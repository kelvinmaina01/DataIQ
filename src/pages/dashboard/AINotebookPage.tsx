import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Play, Plus, Share2, Database, ChevronDown, ChevronRight,
  BarChart3, Sparkles, Layers, Loader2, Pin, PanelLeftClose, PanelLeft,
  X, Lock, Link, BrainCircuit, Zap, Plug, Upload, History, Copy, Download,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { NotebookCellRenderer } from './notebook/NotebookCell';
import { LiveCellRenderer } from './notebook/NotebookCell';
import type { PreviewViewMode } from './notebook/dataPreviewUtils';
import { CELL_1, CELL_2, SAMPLE_DATA, PINNED, matchAnalysis, type CellData } from './notebook/simulations';
import { streamAnalysis } from '../../services/streamAnalysis';
import {
  analyzePrompt,
  uploadFile,
  listSessions,
  createSession,
  getSession,
  saveSession,
  getDataSourcePreview,
  pinToDashboard,
  type DataSourceRef,
  type NotebookSessionSummary,
} from '../../services/notebook-api';
import { useNotebookStore } from '../../stores/notebookStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function mapInsightColorToSeverity(color: string): 'critical' | 'warning' | 'positive' | 'info' | 'model' {
  if (color === 'rose') return 'critical';
  if (color === 'amber') return 'warning';
  if (color === 'emerald') return 'positive';
  if (color === 'violet') return 'model';
  return 'info';
}

export function AINotebookPage() {
  const [cells, setCells] = useState<CellData[]>([{ ...CELL_1 }, { ...CELL_2 }]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [livePrompt, setLivePrompt] = useState('');
  const [liveStatus, setLiveStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [liveResult, setLiveResult] = useState<CellData | null>(null);
  const [progress, setProgress] = useState(0);
  const [mlPopupOpen, setMlPopupOpen] = useState(false);
  const [uploadedSources, setUploadedSources] = useState<DataSourceRef[]>([]);
  const [streamingThinking, setStreamingThinking] = useState('');
  const [liveStageLabel, setLiveStageLabel] = useState('Thinking');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [previewTables, setPreviewTables] = useState<Record<string, { headers: string[]; rows: any[][] }>>({});
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const [previewViewMode, setPreviewViewMode] = useState<PreviewViewMode>('table');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const PREVIEW_PAGE_SIZE = 25;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<NotebookSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextNum = cells.length + 1;
  // Reactive store cells — re-renders as streaming events arrive
  const storeCells = useNotebookStore(s => s.cells);
  const previewDatasets = [
    ...uploadedSources
      .filter((s) => s.profilePreview?.headers?.length)
      .map((s) => ({
        id: `upload-${s.id}`,
        sourceType: 'upload' as const,
        sourceId: s.id,
        title: s.name || s.filename || 'Uploaded Dataset',
        prompt: 'Uploaded file',
        headers: s.profilePreview!.headers,
        rows: s.profilePreview!.rows,
        qualityScore: s.profilePreview!.qualityScore,
      })),
    ...cells
      .filter((c) => c.tableData && c.tableData.headers?.length)
      .map((c) => ({
        id: c.id,
        sourceType: 'cell' as const,
        sourceId: c.id,
        title: c.label || 'Analysis',
        prompt: c.prompt,
        headers: c.tableData!.headers,
        rows: c.tableData!.rows,
        qualityScore: c.qualityScore,
      })),
  ];

  const ensureActiveSession = async (): Promise<string | null> => {
    if (USE_MOCK) return null;
    if (activeSessionId) return activeSessionId;
    try {
      const created = await createSession(`Session ${new Date().toLocaleString()}`);
      setActiveSessionId(created.id);
      return created.id;
    } catch (err: any) {
      toast.error(`Could not initialize session: ${err.message}`);
      return null;
    }
  };

  const persistCurrentSession = async (overrides?: { cells?: CellData[]; liveResult?: CellData | null }) => {
    if (USE_MOCK) return;
    const sessionId = activeSessionId || await ensureActiveSession();
    if (!sessionId) return;
    try {
      await saveSession(sessionId, {
        cells: overrides?.cells ?? cells,
        liveResult: overrides?.liveResult ?? liveResult,
        uploadedSources,
      });
      const sessions = await listSessions();
      setSessionHistory(sessions);
    } catch (err: any) {
      toast.error(`Session save failed: ${err.message}`);
    }
  };

  const startNewSession = async () => {
    if (USE_MOCK) {
      setCells([]);
      setLiveResult(null);
      setLivePrompt('');
      toast.success('New local session started');
      return;
    }
    try {
      const created = await createSession(`Session ${new Date().toLocaleString()}`);
      setActiveSessionId(created.id);
      setCells([]);
      setLiveResult(null);
      setLivePrompt('');
      setUploadedSources([]);
      const sessions = await listSessions();
      setSessionHistory(sessions);
      toast.success('New session created');
    } catch (err: any) {
      toast.error(`Could not create session: ${err.message}`);
    }
  };

  const loadSession = async (id: string) => {
    if (USE_MOCK) return;
    try {
      const session = await getSession(id);
      setActiveSessionId(id);
      setCells((session.payload?.cells || []) as CellData[]);
      setLiveResult((session.payload?.liveResult || null) as CellData | null);
      setUploadedSources((session.payload?.uploadedSources || []) as DataSourceRef[]);
      setLivePrompt('');
      toast.success(`Opened session: ${session.title}`);
    } catch (err: any) {
      toast.error(`Could not load session: ${err.message}`);
    }
  };

  useEffect(() => {
    if (USE_MOCK) return;
    (async () => {
      try {
        const sessions = await listSessions();
        setSessionHistory(sessions);
        if (sessions.length > 0) {
          await loadSession(sessions[0].id);
        } else {
          const seeded = await createSession('Seeded Mock Session');
          setActiveSessionId(seeded.id);
          await saveSession(
            seeded.id,
            { cells: [{ ...CELL_1 }, { ...CELL_2 }], liveResult: null, uploadedSources: [] },
            'Seeded Mock Session'
          );
          const refreshed = await listSessions();
          setSessionHistory(refreshed);
          if (refreshed.length > 0) {
            await loadSession(refreshed[0].id);
          }
        }
      } catch (err: any) {
        toast.error(`Session history unavailable: ${err.message}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePin = async (cellId: string, insightIdx: number) => {
    const cell = cells.find((c) => c.id === cellId) ?? (liveResult?.id === cellId ? liveResult : null);
    if (!cell) return;
    const ins = cell.insights[insightIdx];
    if (!ins) return;

    const nextPinned = !ins.pinned;

    const patchCells = (insights: typeof cell.insights) =>
      cells.map((c) => (c.id === cellId ? { ...c, insights } : c));

    const patchLive = (insights: typeof cell.insights) =>
      liveResult?.id === cellId ? { ...liveResult, insights } : liveResult;

    if (USE_MOCK) {
      const insights = [...cell.insights];
      insights[insightIdx] = { ...insights[insightIdx], pinned: nextPinned };
      const updatedCells = patchCells(insights);
      const updatedLive = patchLive(insights);
      setCells(updatedCells);
      setLiveResult(updatedLive);
      void persistCurrentSession({ cells: updatedCells, liveResult: updatedLive });
      toast.success(nextPinned ? 'Pinned to dashboard (mock)' : 'Unpinned');
      return;
    }

    try {
      if (nextPinned) {
        const sessionKey = activeSessionId || (await ensureActiveSession());
        const { id } = await pinToDashboard({
          notebook_id: sessionKey,
          item_type: 'insight',
          item_data: {
            title: ins.title,
            body: ins.text,
            severity: mapInsightColorToSeverity(ins.color),
            icon: ins.icon,
          },
          dedupe_key: `${cellId}-insight-${insightIdx}`,
        });
        useNotebookStore.getState().addLocalPin({
          id,
          user_id: 'default',
          notebook_id: sessionKey,
          item_type: 'insight',
          item_data: {
            title: ins.title,
            body: ins.text,
            severity: mapInsightColorToSeverity(ins.color),
            icon: ins.icon,
          },
          pinned_at: new Date().toISOString(),
        });
        const insights = [...cell.insights];
        insights[insightIdx] = { ...insights[insightIdx], pinned: true, pinnedItemId: id };
        const updatedCells = patchCells(insights);
        const updatedLive = patchLive(insights);
        setCells(updatedCells);
        setLiveResult(updatedLive);
        void persistCurrentSession({ cells: updatedCells, liveResult: updatedLive });
        toast.success('Pinned to analytics dashboard');
      } else {
        if (ins.pinnedItemId) {
          await useNotebookStore.getState().removePinned(ins.pinnedItemId);
        }
        const insights = [...cell.insights];
        insights[insightIdx] = {
          ...insights[insightIdx],
          pinned: false,
          pinnedItemId: undefined,
        };
        const updatedCells = patchCells(insights);
        const updatedLive = patchLive(insights);
        setCells(updatedCells);
        setLiveResult(updatedLive);
        void persistCurrentSession({ cells: updatedCells, liveResult: updatedLive });
        toast.success('Removed from dashboard');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Pin action failed');
    }
  };

  const handlePinChart = async (cellId: string, chartIdx: number) => {
    const cell = cells.find((c) => c.id === cellId) ?? (liveResult?.id === cellId ? liveResult : null);
    if (!cell) return;
    const ch = cell.charts[chartIdx];
    if (!ch) return;
    const series = cell.chartData[ch.id];
    if (!series) {
      toast.error('Chart data unavailable for pinning');
      return;
    }

    const nextPinned = !ch.pinned;

    const patchCells = (charts: typeof cell.charts) =>
      cells.map((c) => (c.id === cellId ? { ...c, charts } : c));

    const patchLive = (charts: typeof cell.charts) =>
      liveResult?.id === cellId ? { ...liveResult, charts } : liveResult;

    if (USE_MOCK) {
      const charts = [...cell.charts];
      charts[chartIdx] = { ...charts[chartIdx], pinned: nextPinned };
      const updatedCells = patchCells(charts);
      const updatedLive = patchLive(charts);
      setCells(updatedCells);
      setLiveResult(updatedLive);
      void persistCurrentSession({ cells: updatedCells, liveResult: updatedLive });
      toast.success(nextPinned ? 'Chart pinned (mock)' : 'Chart unpinned');
      return;
    }

    try {
      if (nextPinned) {
        const sessionKey = activeSessionId || (await ensureActiveSession());
        const { id } = await pinToDashboard({
          notebook_id: sessionKey,
          item_type: 'chart',
          item_data: {
            chartMeta: ch,
            chartData: { [ch.id]: series },
          },
          dedupe_key: `${cellId}-chart-${chartIdx}`,
        });
        useNotebookStore.getState().addLocalPin({
          id,
          user_id: 'default',
          notebook_id: sessionKey,
          item_type: 'chart',
          item_data: {
            chartMeta: ch,
            chartData: { [ch.id]: series },
          },
          pinned_at: new Date().toISOString(),
        });
        const charts = [...cell.charts];
        charts[chartIdx] = { ...charts[chartIdx], pinned: true, pinnedItemId: id };
        const updatedCells = patchCells(charts);
        const updatedLive = patchLive(charts);
        setCells(updatedCells);
        setLiveResult(updatedLive);
        void persistCurrentSession({ cells: updatedCells, liveResult: updatedLive });
        toast.success('Chart pinned to dashboard');
      } else {
        if (ch.pinnedItemId) {
          await useNotebookStore.getState().removePinned(ch.pinnedItemId);
        }
        const charts = [...cell.charts];
        charts[chartIdx] = {
          ...charts[chartIdx],
          pinned: false,
          pinnedItemId: undefined,
        };
        const updatedCells = patchCells(charts);
        const updatedLive = patchLive(charts);
        setCells(updatedCells);
        setLiveResult(updatedLive);
        void persistCurrentSession({ cells: updatedCells, liveResult: updatedLive });
        toast.success('Chart removed from dashboard');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Chart pin failed');
    }
  };

  /** Handle file upload for data sources */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Uploading file...');
      const result = await uploadFile(file);
      const source: DataSourceRef = {
        id: result.datasource_id,
        type: 'file',
        name: result.filename,
        filename: result.filename,
      };
      const preview = await getDataSourcePreview(result.datasource_id).catch(() => null);
      const sourceWithPreview: DataSourceRef = {
        ...source,
        profilePreview: preview
          ? {
              headers: preview.headers || [],
              rows: preview.rows || [],
              rowCount: preview.rowCount || 0,
            }
          : undefined,
      };

      setUploadedSources(prev => {
        const next = [...prev, sourceWithPreview];
        if (!USE_MOCK) {
          void (async () => {
            const sid = activeSessionId || await ensureActiveSession();
            if (!sid) return;
            await saveSession(sid, { cells, liveResult, uploadedSources: next });
          })();
        }
        return next;
      });
      toast.dismiss();
      toast.success(`Uploaded ${result.filename} — ${result.profile.rows} rows, ${result.profile.columns} columns`);
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Upload failed: ${err.message}`);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Run analysis — streams via 4-role AI Analyst Team */
  const runLiveCell = async () => {
    if (!livePrompt.trim()) return;
    setLiveStatus('running');
    setProgress(0);
    setStreamingThinking('');
    setLiveStageLabel('Thinking');

    // ─── MOCK PATH ──────────────────────────────────────────────
    if (USE_MOCK) {
      const interval = setInterval(() => {
        setProgress(p => { if (p >= 92) { clearInterval(interval); return 92; } return p + Math.random() * 15; });
      }, 200);
      await delay(2800);
      clearInterval(interval);
      setProgress(100);
      const analysis = matchAnalysis(livePrompt);
      const result: CellData = { ...analysis, id: `cell-${nextNum}`, num: nextNum, prompt: livePrompt, label: 'Analysis', status: 'complete' };
      setCells(prev => { const updated = [...prev, result]; void persistCurrentSession({ cells: updated, liveResult: null }); return updated; });
      setLiveResult(null);
      setLiveStatus('complete');
      toast.success('Analysis complete!');
      return;
    }

    // ─── REAL STREAMING PATH ────────────────────────────────────
    const store = useNotebookStore.getState();
    const cell = store.addCell(livePrompt);
    const cellId = cell.id;

    // Progress bar ticks while stream runs
    const progressInterval = setInterval(() => {
      setProgress(p => { if (p >= 92) { clearInterval(progressInterval); return 92; } return p + Math.random() * 4; });
    }, 600);

    try {
      await streamAnalysis(
        cellId,
        livePrompt,
        uploadedSources,
        cells.map(c => ({ prompt: c.prompt, resultSummary: c.summary?.paragraphs?.[0] }))
      );
      clearInterval(progressInterval);
      setProgress(100);
      setLiveStatus('complete');
      toast.success('Analysis complete!');
    } catch (err: any) {
      clearInterval(progressInterval);
      setLiveStatus('idle');
      toast.error(`Analysis failed: ${err.message}`);
    }

    setLivePrompt('');
  };

  const setPromptExample = (text: string) => {
    setLivePrompt(text);
    textareaRef.current?.focus();
  };

  const buildConversationExport = () => {
    const lines: string[] = [
      '# DataIQ AI Notebook',
      `Exported: ${new Date().toLocaleString()}`,
    ];
    if (activeSessionId) lines.push(`Session ID: ${activeSessionId}`);
    lines.push('');
    for (const c of cells) {
      lines.push(`## Cell [${c.num}] — ${c.label}`, '', `**Prompt:** ${c.prompt}`, '');
      if (c.summary?.paragraphs?.length) {
        lines.push(c.summary.paragraphs.join('\n\n'), '');
      }
      if (c.summary?.suggestedPrompts?.length) {
        lines.push('**Suggested next steps:**', ...c.summary.suggestedPrompts.map((s) => `- ${s}`), '');
      }
    }
    if (livePrompt.trim()) {
      lines.push('## Current draft prompt', '', livePrompt.trim(), '');
    }
    return lines.join('\n');
  };

  const handleCopyConversation = async () => {
    try {
      await navigator.clipboard.writeText(buildConversationExport());
      toast.success('Notebook copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleDownloadConversation = () => {
    const blob = new Blob([buildConversationExport()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataiq-notebook-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notebook downloaded');
  };

  const handleShareNotebook = async () => {
    const text = buildConversationExport();
    const shareUrl = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'DataIQ Notebook',
          text: text.length > 12000 ? `${text.slice(0, 12000)}\n…` : text,
          url: shareUrl,
        });
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareUrl}\n\n---\n\n${text}`);
      toast.success('Link and notebook text copied — paste anywhere to share');
    } catch {
      toast.error('Share not available');
    }
  };

  const handleAddAnalysisCell = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast.message('Use the prompt cell below to run another analysis');
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.max(44, el.scrollHeight) + 'px';
  };

  const openDataPreview = async () => {
    let currentUploaded = uploadedSources;
    if (currentUploaded.some((s) => s.type === 'file' && !s.profilePreview?.headers?.length)) {
      const hydrated = await Promise.all(
        currentUploaded.map(async (s) => {
          if (s.type !== 'file' || s.profilePreview?.headers?.length) return s;
          try {
            const preview = await getDataSourcePreview(s.id);
            return {
              ...s,
              profilePreview: {
                headers: preview.headers || [],
                rows: preview.rows || [],
                rowCount: preview.rowCount || 0,
              },
            } as DataSourceRef;
          } catch {
            return s;
          }
        })
      );
      currentUploaded = hydrated;
      setUploadedSources(hydrated);
      if (!USE_MOCK) {
        const sid = activeSessionId || await ensureActiveSession();
        if (sid) await saveSession(sid, { cells, liveResult, uploadedSources: hydrated });
      }
    }

    const datasetsNow = [
      ...currentUploaded
        .filter((s) => s.profilePreview?.headers?.length)
        .map((s) => ({
          id: `upload-${s.id}`,
          title: s.name || s.filename || 'Uploaded Dataset',
          prompt: 'Uploaded file',
          headers: s.profilePreview!.headers,
          rows: s.profilePreview!.rows,
          qualityScore: s.profilePreview!.qualityScore,
        })),
      ...previewDatasets.filter((d) => d.id.startsWith('cell-')),
    ];

    if (datasetsNow.length === 0) {
      toast.info('No dataset preview available yet in this session. Upload data or run analysis first.');
      return;
    }
    const initial: Record<string, { headers: string[]; rows: any[][] }> = {};
    for (const ds of datasetsNow) {
      initial[ds.id] = {
        headers: [...ds.headers],
        rows: ds.rows.map((r) => [...r]),
      };
    }
    setPreviewTables(initial);
    setSelectedPreviewId(datasetsNow[0].id);
    setPreviewSearch('');
    setPreviewPage(1);
    setPreviewOpen(true);
  };

  const updatePreviewCell = (datasetId: string, rowIdx: number, colIdx: number, value: string) => {
    setPreviewTables((prev) => {
      const ds = prev[datasetId];
      if (!ds) return prev;
      const rows = ds.rows.map((r) => [...r]);
      rows[rowIdx][colIdx] = value;
      return { ...prev, [datasetId]: { ...ds, rows } };
    });
  };

  const applyPreviewEdits = () => {
    setCells((prev) => {
      const updated = prev.map((cell) => {
        const edited = previewTables[cell.id];
        if (!edited || !cell.tableData) return cell;
        return {
          ...cell,
          tableData: {
            ...cell.tableData,
            headers: edited.headers,
            rows: edited.rows,
          },
        };
      });
      void persistCurrentSession({ cells: updated });
      return updated;
    });
    setUploadedSources((prev) => {
      const next = prev.map((s) => {
        const edited = previewTables[`upload-${s.id}`];
        if (!edited) return s;
        return {
          ...s,
          profilePreview: {
            ...(s.profilePreview || {}),
            headers: edited.headers,
            rows: edited.rows,
          },
        };
      });
      if (!USE_MOCK) {
        void (async () => {
          const sid = activeSessionId || await ensureActiveSession();
          if (!sid) return;
          await saveSession(sid, { cells, liveResult, uploadedSources: next });
        })();
      }
      return next;
    });
    toast.success('Session data preview updated');
    setPreviewOpen(false);
  };

  const selectedPreviewTable = selectedPreviewId ? previewTables[selectedPreviewId] : null;
  const filteredPreviewRows = selectedPreviewTable
    ? selectedPreviewTable.rows.filter((row) =>
        previewSearch.trim().length === 0
          ? true
          : row.some((cell) => String(cell ?? '').toLowerCase().includes(previewSearch.toLowerCase()))
      )
    : [];
  const totalPreviewPages = Math.max(1, Math.ceil(filteredPreviewRows.length / PREVIEW_PAGE_SIZE));
  const currentPreviewPage = Math.min(previewPage, totalPreviewPages);
  const paginatedPreviewRows = filteredPreviewRows.slice(
    (currentPreviewPage - 1) * PREVIEW_PAGE_SIZE,
    currentPreviewPage * PREVIEW_PAGE_SIZE
  );

  const exportPreviewCsv = () => {
    if (!selectedPreviewTable || !selectedPreviewId) return;
    const csvRows = [
      selectedPreviewTable.headers.join(','),
      ...selectedPreviewTable.rows.map((row) =>
        row
          .map((cell) => {
            const text = String(cell ?? '');
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
              return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-preview-${selectedPreviewId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPreviewTable = async () => {
    if (!selectedPreviewTable) return;
    const lines = [
      selectedPreviewTable.headers.join('\t'),
      ...selectedPreviewTable.rows.map((row) => row.map((cell) => String(cell ?? '')).join('\t')),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Preview table copied');
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white animate-in fade-in duration-500">
      <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-y-auto notebook-scrollbar scroll-pb-24">
        {/* Main notebook column */}
        <div className="relative isolate z-0 min-h-0 min-w-0 flex-1 bg-white px-4 py-4 md:px-8">
          {/* Sticky toolbar — opaque layer so scrolling cells never “slide under” a glass/envelope illusion */}
          {/* One horizontal row only: heading left, actions right (never stacked) */}
          <div className="sticky top-0 z-50 -mx-4 mb-8 flex min-w-0 flex-nowrap items-center justify-between gap-3 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-4 pb-4 pt-0 md:-mx-8 md:px-8">
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="truncate text-xl font-bold text-slate-900">
                Customer Churn Analysis — Q3 2024
              </h1>
              <p className="truncate text-xs text-slate-400">
                AI-powered analysis · 12,847 customers · PostgreSQL + CSV · Last run 4 min ago
              </p>
            </div>
            <div className="notebook-scrollbar flex shrink-0 flex-nowrap items-center justify-end gap-1.5 overflow-x-auto py-0.5 sm:gap-2">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0E50F6]/25 bg-blue-50/90 px-2 py-1.5 text-[10px] font-semibold text-[#0E50F6] hover:bg-blue-50 sm:px-2.5 sm:text-[11px]"
                >
                  <PanelLeft className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Overview</span>
                </button>
              )}
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 gap-1 border-0 bg-blue-600 px-2 text-[10px] text-white shadow-sm hover:bg-blue-700 sm:gap-1.5 sm:px-3 sm:text-xs"
                onClick={() => void handleAddAnalysisCell()}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Add analysis</span>
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 gap-1 border-0 bg-emerald-600 px-2 text-[10px] text-white shadow-sm hover:bg-emerald-700 sm:gap-1.5 sm:px-3 sm:text-xs"
                onClick={() => void startNewSession()}
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">New session</span>
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 gap-1 border-0 bg-violet-600 px-2 text-[10px] text-white shadow-sm hover:bg-violet-700 sm:gap-1.5 sm:px-3 sm:text-xs"
                onClick={() => void handleShareNotebook()}
              >
                <Share2 className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Share</span>
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 gap-1 border-0 bg-amber-500 px-2 text-[10px] text-white shadow-sm hover:bg-amber-600 sm:gap-1.5 sm:px-3 sm:text-xs"
                onClick={() => void handleCopyConversation()}
              >
                <Copy className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Copy</span>
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 gap-1 border-0 bg-rose-600 px-2 text-[10px] text-white shadow-sm hover:bg-rose-700 sm:gap-1.5 sm:px-3 sm:text-xs"
                onClick={handleDownloadConversation}
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Download</span>
              </Button>
            </div>
          </div>

          {/* Pre-rendered Cells (legacy CellData — mock or session-loaded) */}
          {cells.map(cell => (
            <div key={cell.id}>
              <NotebookCellRenderer
                cell={cell}
                onPin={handlePin}
                onPinChart={handlePinChart}
                onSuggest={setPromptExample}
              />
              <div className="group flex items-center gap-2 py-2 my-1 cursor-pointer pl-10 opacity-100">
                <div className="flex-1 h-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => void handleAddAnalysisCell()}
                  className="text-[11px] text-slate-400 hover:text-[#0E50F6] px-3 py-1 rounded-md border border-slate-200 hover:border-[#0E50F6]/30 hover:bg-blue-50 bg-white transition-all"
                >
                  + Add Cell
                </button>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </div>
          ))}

          {/* Live streaming cells from AI Analyst Team */}
          {storeCells.map(cell => (
            <div key={cell.id}>
              <LiveCellRenderer
                cell={cell}
                onPin={(cellId, idx) => useNotebookStore.getState().pinInsightInCell(cellId, idx)}
                onPinChart={(cellId, idx) => useNotebookStore.getState().pinChartInCell(cellId, idx)}
                onSuggest={setPromptExample}
              />
            </div>
          ))}

          {/* Interactive Cell */}
          <div className="relative pl-10 mb-3">
            <div className="absolute left-0 top-2 flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-400 w-6 text-right block">[{nextNum}]</span>
            </div>
            <div
              className={`rounded-xl border overflow-hidden transition-all shadow-none ${
                liveStatus === 'running'
                  ? 'border-[#0E50F6] bg-blue-50/30 ring-2 ring-[#0E50F6]/10'
                  : 'border-slate-200/80 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-3 py-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0E50F6]/10 text-[#0E50F6]">PROMPT</span>
                <span className="text-[11px] text-slate-400">New Analysis</span>
                <div className="flex-1" />
                <button className="text-slate-400 hover:text-slate-600 text-xs p-1" onClick={() => { setLivePrompt(''); setLiveResult(null); setLiveStatus('idle'); }}>✕</button>
              </div>
              <textarea
                ref={textareaRef}
                value={livePrompt}
                onChange={(e) => { setLivePrompt(e.target.value); autoResize(e.target); }}
                placeholder="Ask anything about your data... e.g. 'Which internet service has the highest churn?'"
                className="w-full px-4 py-3 text-[14px] text-slate-800 bg-transparent border-none outline-none resize-none min-h-[44px] leading-relaxed placeholder:text-slate-400"
                rows={2}
                disabled={liveStatus === 'running'}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runLiveCell(); }}
              />
              {/* Uploaded data sources badges */}
              {uploadedSources.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 border-t border-slate-100 bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-semibold">DATA:</span>
                  {uploadedSources.map((s, i) => (
                    <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      📊 {s.name}
                      <button onClick={() => setUploadedSources(prev => prev.filter((_, j) => j !== i))} className="text-emerald-400 hover:text-red-500 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-3 py-2">
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.json,.tsv" className="hidden" onChange={handleFileUpload} />
                <Button size="sm" onClick={runLiveCell} disabled={liveStatus === 'running'}
                  className="rounded-lg text-xs gap-1.5 h-7 bg-[#0E50F6] hover:bg-[#0D44D1] text-white font-semibold shadow-sm">
                  {liveStatus === 'running' ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : <><Play className="w-3 h-3" /> Run Analysis</>}
                </Button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 px-2 py-1 border border-emerald-200 rounded-md hover:border-emerald-300 transition-colors bg-emerald-50 flex items-center gap-1.5 font-semibold">
                  <Upload className="w-3 h-3" /> Upload Data
                </button>
                <button onClick={() => toast.info('Connector modal would open here')}
                  className="text-[11px] text-amber-700 hover:text-amber-800 px-2 py-1 border border-amber-200 rounded-md hover:border-amber-300 transition-colors bg-amber-50 flex items-center gap-1.5 font-semibold">
                  <Link className="w-3 h-3" /> Add connector
                </button>
                <button onClick={() => toast.info('MCP connection modal coming soon')}
                  className="text-[11px] text-violet-700 hover:text-violet-800 px-2 py-1 border border-violet-200 rounded-md hover:border-violet-300 transition-colors bg-violet-50 flex items-center gap-1.5 font-semibold">
                  <Plug className="w-3 h-3" /> Connect MCPs
                </button>
                <button
                  onClick={openDataPreview}
                  className="text-[11px] text-rose-700 hover:text-rose-800 px-2 py-1 border border-rose-200 rounded-md hover:border-rose-300 transition-colors bg-rose-50 flex items-center gap-1.5 font-semibold"
                >
                  <Database className="w-3 h-3" /> Data Preview
                </button>
                <div className="relative">
                  <button onClick={() => setMlPopupOpen(!mlPopupOpen)}
                    className="text-[11px] text-slate-400 hover:text-[#0E50F6] px-2 py-1 border border-slate-200 rounded-md hover:border-[#0E50F6]/30 transition-colors bg-white flex items-center gap-1.5 font-medium">
                    <BrainCircuit className="w-3 h-3" /> ML model ↗
                  </button>

                  {/* ML Popup Drawer */}
                  <AnimatePresence>
                    {mlPopupOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full mb-3 left-0 w-[300px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 z-50 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                              <div className="bg-slate-800 text-white p-1 rounded">
                                <Zap className="w-3 h-3" />
                              </div>
                              DataIQ ML Toolkit
                            </div>
                            <button onClick={() => setMlPopupOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <h3 className="text-[15px] font-bold text-slate-900 mb-2.5 leading-tight pr-4">Unlock Machine Learning insights in DataIQ</h3>
                          
                          <div className="flex gap-1.5 mb-4">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Pre-trained</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">AutoML</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Real-time</span>
                          </div>
                          
                          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white">
                            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
                                 onClick={() => { setPromptExample('Use a pre-trained model to score churn risk'); setMlPopupOpen(false); }}>
                              <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#0E50F6]">Use Pre-trained Models</span>
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                            <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                                 onClick={() => { setPromptExample('Train a new AutoML model on this dataset'); setMlPopupOpen(false); }}>
                              <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#0E50F6]">Train Custom Model</span>
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          </div>
                          
                          <button className="w-full bg-[#0F172A] hover:bg-black text-white text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md">
                            Connect ML Workspace <ChevronRight className="w-4 h-4" />
                          </button>
                          
                          <div className="text-center text-[10px] text-slate-400 mt-3.5 font-medium">
                            One-click setup · Secure access · Turn it off anytime
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="ml-auto text-[10px] text-slate-300">⌘↵ to run</span>
              </div>
            </div>

            {/* Streaming running state */}
            {liveStatus === 'running' && useNotebookStore.getState().cells.length === 0 && (
              <div className="mt-1 space-y-3">
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 p-4 shadow-none">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-[#0E50F6]">🤖 AI Analyst</span>
                    <span className="text-slate-400">·</span>
                    <span>{liveStageLabel}</span>
                  </div>
                  <div className="mb-3 h-[3px] overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#0E50F6] to-violet-400"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="notebook-scrollbar max-h-[min(480px,55vh)] overflow-y-auto rounded-lg border border-violet-200 bg-violet-50">
                    <div className="border-b border-violet-100 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                        {'Live reasoning & draft output'}
                      </div>
                      <div className="text-[10px] text-violet-400">
                        Same stream you’ll see structured below when complete — plan, code, and insights as they’re generated
                      </div>
                    </div>
                    <div className="px-3 py-3 font-mono text-[11px] leading-relaxed text-slate-600">
                      {streamingThinking ? (
                        <>
                          <span className="whitespace-pre-wrap">{streamingThinking}</span>
                          <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-[#0E50F6]" />
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Waiting for model output…</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[#0E50F6]"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overview / pinned insights — scrolls independently from the notebook column */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="sticky top-0 h-full relative z-10 shrink-0 bg-white flex flex-col overflow-hidden"
        >
          <div className="flex h-full min-h-0 w-[280px] flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-0.5 border-b border-slate-100 bg-slate-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Notebook Overview
                  </span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition-colors hover:border-[#0E50F6]/30 hover:bg-blue-50 hover:text-[#0E50F6]"
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                {[
                  {
                    icon: History,
                    label: `History (${sessionHistory.length})`,
                    active: historyOpen,
                    onClick: () => setHistoryOpen(true),
                  },
                  {
                    icon: Layers,
                    label: 'Cells',
                    active: !historyOpen,
                    onClick: () => setHistoryOpen(false),
                  },
                  {
                    icon: BarChart3,
                    label: 'Visualizations',
                    active: false,
                    onClick: () => setHistoryOpen(false),
                  },
                  {
                    icon: Sparkles,
                    label: `Insights (${PINNED.length})`,
                    active: false,
                    onClick: () => setHistoryOpen(false),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={item.onClick}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-colors ${
                      item.active
                        ? 'bg-[#0E50F6]/10 font-bold text-[#0E50F6]'
                        : 'font-medium text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4 opacity-70" />
                    {item.label}
                  </div>
                ))}
              </div>

              {historyOpen && (
                <div className="border-b border-slate-100 px-4 pb-2 pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Chat Sessions
                    </span>
                    <button
                      type="button"
                      onClick={startNewSession}
                      className="rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-500 hover:border-[#0E50F6]/40 hover:text-[#0E50F6]"
                    >
                      + New
                    </button>
                  </div>
                  <div className="notebook-scrollbar max-h-[220px] space-y-1.5 overflow-y-auto">
                    {sessionHistory.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => loadSession(s.id)}
                        className={`w-full rounded-md border p-2 text-left transition-colors ${
                          s.id === activeSessionId
                            ? 'border-[#0E50F6]/50 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-[#0E50F6]/30'
                        }`}
                      >
                        <div className="truncate text-[11px] font-semibold text-slate-700">
                          {s.title || 'Untitled Session'}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">{s.preview || 'No messages yet'}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Connected Data
                </span>
              </div>
              {SAMPLE_DATA.tables.map((t, i) => (
                <div
                  key={i}
                  className={`mx-4 mt-2.5 rounded-xl border p-3.5 shadow-sm ${
                    t.type === 'db'
                      ? 'border-violet-200/60 bg-violet-50/50'
                      : 'border-blue-200/60 bg-blue-50/50'
                  }`}
                >
                  <div className={`text-sm font-bold ${t.type === 'db' ? 'text-violet-700' : 'text-blue-700'}`}>
                    {t.name}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{t.meta}</div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {t.stats.map((s, si) => (
                      <span
                        key={si}
                        className="rounded border border-slate-200/60 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="px-4 pb-2 pt-6">
                <div className="flex items-center gap-1.5">
                  <Pin className="h-4 w-4 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                    Pinned Insights
                  </span>
                </div>
              </div>
              <div className="space-y-2.5 px-4 pb-6">
                {PINNED.map((p, i) => (
                  <div
                    key={i}
                    className="group cursor-pointer rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm transition-all hover:border-[#0E50F6]/40 hover:shadow-md"
                  >
                    <div className="text-xs font-bold leading-relaxed text-slate-700 transition-colors group-hover:text-[#0E50F6]">
                      {p.label}
                    </div>
                    <div className="mt-2 inline-block rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      {p.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="w-[95vw] max-w-6xl h-[82vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex"
            >
              <div className="w-[280px] border-r border-slate-200 bg-slate-50 p-3 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Session Data Sources</div>
                <div className="space-y-2">
                  {previewDatasets.map((ds) => (
                    <button
                      key={ds.id}
                      onClick={() => {
                        setSelectedPreviewId(ds.id);
                        setPreviewPage(1);
                      }}
                      className={`w-full text-left p-2 rounded-lg border ${
                        ds.id === selectedPreviewId ? 'border-[#0E50F6]/50 bg-blue-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-[12px] font-semibold text-slate-700 truncate">{ds.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{ds.prompt}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {ds.rows.length} rows · {ds.headers.length} cols{ds.qualityScore ? ` · Quality ${ds.qualityScore}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Session Data Preview</div>
                    <div className="text-xs text-slate-500">Inspect, edit, filter, copy, and export data from this session</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <input
                      value={previewSearch}
                      onChange={(e) => {
                        setPreviewSearch(e.target.value);
                        setPreviewPage(1);
                      }}
                      placeholder="Search rows..."
                      className="text-xs h-8 px-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      onClick={copyPreviewTable}
                      className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-slate-800 bg-white"
                    >
                      Copy
                    </button>
                    <button
                      onClick={exportPreviewCsv}
                      className="text-xs px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:text-emerald-800 bg-emerald-50 font-semibold"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                    <button
                      onClick={applyPreviewEdits}
                      className="text-xs px-3 py-1.5 rounded-md border border-[#0E50F6]/30 text-[#0E50F6] bg-blue-50 hover:bg-blue-100 font-semibold"
                    >
                      Save Edits
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-3">
                  {selectedPreviewId && selectedPreviewTable ? (
                    <table className="w-full text-[12px] border-collapse">
                      <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr>
                          {selectedPreviewTable.headers.map((h, i) => (
                            <th key={i} className="px-2 py-2 border border-slate-200 text-left text-[11px] font-semibold text-slate-600">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPreviewRows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="border border-slate-200 p-0">
                                <input
                                  value={val ?? ''}
                                  onChange={(e) =>
                                    updatePreviewCell(
                                      selectedPreviewId,
                                      (currentPreviewPage - 1) * PREVIEW_PAGE_SIZE + rIdx,
                                      cIdx,
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1.5 text-[12px] text-slate-700 bg-white focus:outline-none focus:bg-blue-50"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      No previewable table found in this session yet.
                    </div>
                  )}
                </div>

                {selectedPreviewTable && (
                  <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="text-xs text-slate-500">
                      Showing {(currentPreviewPage - 1) * PREVIEW_PAGE_SIZE + 1}-
                      {Math.min(currentPreviewPage * PREVIEW_PAGE_SIZE, filteredPreviewRows.length)} of {filteredPreviewRows.length} rows
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        disabled={currentPreviewPage <= 1}
                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                        className="text-xs px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-slate-500">Page {currentPreviewPage} / {totalPreviewPages}</span>
                      <button
                        disabled={currentPreviewPage >= totalPreviewPages}
                        onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                        className="text-xs px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
