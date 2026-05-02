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
  const [visualsOpen, setVisualsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
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

  useEffect(() => {
    if (!USE_MOCK) {
      void (async () => {
        try {
          const sessions = await listSessions();
          setSessionHistory(sessions);
        } catch (err) {
          console.error('Failed to load sessions', err);
        }
      })();
    }
  }, []);

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
    <div className="flex h-full w-full overflow-hidden bg-white relative">

      <div className="flex min-w-0 flex-1 flex-col relative isolate z-0 overflow-hidden">
        {/* Main notebook content area */}
        <div className="flex-1 overflow-y-auto notebook-scrollbar scroll-pb-24 bg-white">
          <div className="relative isolate z-0 min-h-0 min-w-0 px-0 py-0">
          {/* Sticky toolbar — integrated into the full page surface */}
          <div className="sticky top-0 z-50 mb-8 flex min-w-0 flex-nowrap items-center justify-between gap-3 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-6 pb-4 pt-4">
            <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="h-9 w-9 shrink-0 rounded-xl hover:bg-slate-100"
              >
                <ChevronRight className="h-5 w-5 text-slate-500 rotate-180" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold text-slate-900">
                  Customer Churn Analysis — Q3 2024
                </h1>
                <p className="truncate text-xs text-slate-400">
                  AI-powered analysis · 12,847 customers · PostgreSQL + CSV · Last run 4 min ago
                </p>
              </div>
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

          {/* Cells Area — Centered column for readability but full-page background */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-32">
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
            <div className="relative pl-10 mt-12 mb-3">
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
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="ml-auto text-[10px] text-slate-300">⌘↵ to run</span>
                </div>
            </div>

            {/* Accessibility Quick Actions Bar (Replica of top toolbar) */}
            <div className="mt-8 mb-12 flex justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 border-0 bg-blue-600 px-3 text-[11px] text-white shadow-sm hover:bg-blue-700 font-semibold rounded-lg"
                  onClick={() => void handleAddAnalysisCell()}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Add analysis</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 border-0 bg-emerald-600 px-3 text-[11px] text-white shadow-sm hover:bg-emerald-700 font-semibold rounded-lg"
                  onClick={() => void startNewSession()}
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">New session</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 border-0 bg-violet-600 px-3 text-[11px] text-white shadow-sm hover:bg-violet-700 font-semibold rounded-lg"
                  onClick={() => void handleShareNotebook()}
                >
                  <Share2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Share</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 border-0 bg-amber-500 px-3 text-[11px] text-white shadow-sm hover:bg-amber-600 font-semibold rounded-lg"
                  onClick={() => void handleCopyConversation()}
                >
                  <Copy className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Copy</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 border-0 bg-rose-600 px-3 text-[11px] text-white shadow-sm hover:bg-rose-700 font-semibold rounded-lg"
                  onClick={() => void handleDownloadConversation()}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Download</span>
                </Button>
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
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>

        {/* Data Preview Modal */}
        <AnimatePresence>
          {previewOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`flex flex-col bg-white shadow-2xl ring-1 ring-slate-200 transition-all duration-300 ${
                  previewExpanded ? 'h-full w-full rounded-none' : 'h-[85vh] w-full max-w-[1400px] rounded-3xl'
                } overflow-hidden`}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Notebook Data Assets</h2>
                      <p className="text-xs text-slate-400">Preview and manage data sources used in this analysis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewExpanded(!previewExpanded)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      {previewExpanded ? <X className="h-5 w-5 rotate-45" /> : <Plus className="h-5 w-5 rotate-45" />}
                    </button>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                  {/* Left Sidebar - Dataset List */}
                  <div className="notebook-scrollbar w-80 shrink-0 border-r border-slate-100 bg-slate-50/30 overflow-y-auto">
                    <div className="p-4 space-y-1">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Active Datasets</div>
                      {previewDatasets.map((ds) => (
                        <div
                          key={ds.id}
                          onClick={() => setSelectedPreviewId(ds.id)}
                          className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${
                            selectedPreviewId === ds.id
                              ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                              : 'border-transparent hover:bg-white hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              selectedPreviewId === ds.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                            }`}>
                              {ds.sourceType === 'upload' ? <Upload className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm font-bold truncate ${selectedPreviewId === ds.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                {ds.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[10px] font-medium text-slate-400">{ds.rows.length} rows</span>
                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                <span className="text-[10px] font-bold text-emerald-600">{Math.round(ds.qualityScore * 100)}% quality</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Content Area - Table Preview */}
                  <div className="flex min-w-0 flex-1 flex-col bg-white">
                    {selectedPreviewId && (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-50 bg-white px-6 py-3">
                          <div className="flex items-center gap-4 flex-1 max-w-xl">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                              <input
                                type="text"
                                placeholder="Search in table..."
                                value={previewSearch}
                                onChange={(e) => setPreviewSearch(e.target.value)}
                                className="h-9 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm focus:border-blue-400 focus:ring-0"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewViewMode('table')}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                previewViewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              Table
                            </button>
                            <button
                              onClick={() => setPreviewViewMode('schema')}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                previewViewMode === 'schema' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              Schema
                            </button>
                            <div className="mx-2 h-4 w-px bg-slate-100" />
                            <button
                              onClick={copyPreviewTable}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </button>
                          </div>
                        </div>

                        <div className="data-preview-scrollbar min-h-0 flex-1 overflow-auto bg-slate-50/20">
                          {previewViewMode === 'table' ? (
                            <table className="w-full border-separate border-spacing-0">
                              <thead className="sticky top-0 z-10">
                                <tr>
                                  <th className="border-b border-r border-slate-200 bg-slate-100/80 p-2 text-center text-[10px] font-bold text-slate-400 backdrop-blur-sm">#</th>
                                  {previewDatasets.find(d => d.id === selectedPreviewId)?.headers.map((h, i) => (
                                    <th key={i} className="border-b border-r border-slate-200 bg-slate-100/80 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 backdrop-blur-sm">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {previewDatasets.find(d => d.id === selectedPreviewId)?.rows
                                  .filter(row => row.some(cell => String(cell).toLowerCase().includes(previewSearch.toLowerCase())))
                                  .slice((previewPage - 1) * PREVIEW_PAGE_SIZE, previewPage * PREVIEW_PAGE_SIZE)
                                  .map((row, ri) => (
                                    <tr key={ri} className="group">
                                      <td className="border-b border-r border-slate-100 bg-white p-2 text-center text-[10px] font-mono text-slate-300 group-hover:bg-blue-50/30">
                                        {(previewPage - 1) * PREVIEW_PAGE_SIZE + ri + 1}
                                      </td>
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="border-b border-r border-slate-100 bg-white px-4 py-2.5 text-sm text-slate-600 group-hover:bg-blue-50/30">
                                          {String(cell ?? '')}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-8">
                               {/* Schema view content */}
                               <div className="max-w-2xl mx-auto space-y-6">
                                  <div className="flex items-center justify-between">
                                     <h3 className="text-lg font-bold text-slate-800">Dataset Schema</h3>
                                     <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                                        {previewDatasets.find(d => d.id === selectedPreviewId)?.headers.length} columns detected
                                     </span>
                                  </div>
                                  <div className="grid gap-3">
                                     {previewDatasets.find(d => d.id === selectedPreviewId)?.headers.map((h, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                           <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                 {i+1}
                                              </div>
                                              <span className="font-mono text-sm font-bold text-slate-700">{h}</span>
                                           </div>
                                           <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type:</span>
                                              <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg">STRING</span>
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                          )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
                          <div className="text-xs font-medium text-slate-400">
                            Showing <span className="text-slate-700">{(previewPage - 1) * PREVIEW_PAGE_SIZE + 1}</span> to <span className="text-slate-700">{Math.min(previewPage * PREVIEW_PAGE_SIZE, previewDatasets.find(d => d.id === selectedPreviewId)?.rows.length || 0)}</span> of <span className="text-slate-700">{previewDatasets.find(d => d.id === selectedPreviewId)?.rows.length}</span> results
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                              disabled={previewPage === 1}
                              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setPreviewPage(p => p + 1)}
                              disabled={previewPage * PREVIEW_PAGE_SIZE >= (previewDatasets.find(d => d.id === selectedPreviewId)?.rows.length || 0)}
                              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Visualizations Gallery Modal */}
        <AnimatePresence>
          {visualsOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col bg-slate-50 shadow-2xl ring-1 ring-slate-200 h-[85vh] w-full max-w-[1200px] rounded-3xl overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Visualizations Gallery</h2>
                      <p className="text-xs text-slate-400">All charts generated in this analysis session</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setVisualsOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 notebook-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...cells, ...storeCells].flatMap(c => c.charts?.map((chart, idx) => (
                      <div key={`${c.id}-${idx}`} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-bold text-slate-800 text-sm">{chart.title}</h3>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-400 uppercase tracking-widest">
                            {chart.type}
                          </span>
                        </div>
                        <div className="h-[240px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <div className="text-center">
                             <BarChart3 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                             <div className="text-[11px] text-slate-400">Chart rendering: {chart.title}</div>
                             <div className="text-[9px] text-slate-300 mt-1">{(chart.data?.length || 0)} data points</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                           <div className="text-[10px] text-slate-400 italic">From: {c.label || 'Analysis'}</div>
                           <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-[#0E50F6]">Pin to Dashboard</Button>
                        </div>
                      </div>
                    )) || [])}
                    {([...cells, ...storeCells].flatMap(c => c.charts || []).length === 0) && (
                      <div className="col-span-full py-20 text-center">
                         <BarChart3 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                         <div className="text-slate-400 font-medium">No visualizations created yet.</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Insights Gallery Modal */}
        <AnimatePresence>
          {insightsOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col bg-slate-50 shadow-2xl ring-1 ring-slate-200 h-[85vh] w-full max-w-[1000px] rounded-3xl overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Insights Intelligence</h2>
                      <p className="text-xs text-slate-400">Automated reasoning and key findings from this session</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInsightsOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 notebook-scrollbar">
                  <div className="space-y-6">
                    {[...cells, ...storeCells].flatMap(c => c.insights?.map((ins, idx) => (
                      <div key={`${c.id}-${idx}`} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-${ins.color}-50 text-${ins.color}-600 border border-${ins.color}-100`}>
                             <span className="text-lg">{ins.icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-slate-900">{ins.title}</h3>
                              <span className="text-[10px] text-slate-400 font-medium">Cell: {c.label || 'Analysis'}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{ins.text}</p>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
                               <Button size="sm" className="h-8 rounded-lg bg-[#0E50F6] text-white font-bold text-[11px]">Pin Insight</Button>
                               <Button size="sm" variant="ghost" className="h-8 rounded-lg text-slate-400 font-bold text-[11px]">Copy to Clipboard</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || [])}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Sidebar - Integrated Push Sidebar (Notebook Overview) */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col relative z-20"
          >
            <div className="w-[400px] h-full flex flex-col">
              <div className="space-y-0.5 border-b border-slate-100 bg-slate-50/50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition-colors hover:border-[#0E50F6]/30 hover:bg-blue-50 hover:text-[#0E50F6]"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Notebook Overview
                  </span>
                </div>
                {[
                  { icon: History, label: `History (${sessionHistory.length})`, active: historyOpen, onClick: () => setHistoryOpen(true) },
                  { icon: Layers, label: 'Cells', active: false, onClick: () => { setHistoryOpen(false); setPreviewOpen(true); } },
                  { icon: BarChart3, label: 'Visualizations', active: false, onClick: () => { setHistoryOpen(false); setVisualsOpen(true); } },
                  { icon: Sparkles, label: `Insights (${PINNED.length})`, active: false, onClick: () => { setHistoryOpen(false); setInsightsOpen(true); } },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={item.onClick}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-colors ${
                      item.active ? 'bg-[#0E50F6]/10 font-bold text-[#0E50F6]' : 'font-medium text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4 opacity-70" />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto notebook-scrollbar">
                {historyOpen ? (
                  <div className="p-4 space-y-2">
                    {sessionHistory.map(session => (
                      <div
                        key={session.id}
                        onClick={() => loadSession(session.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          activeSessionId === session.id ? 'border-[#0E50F6] bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-800 truncate">{session.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 space-y-6">
                    {/* Connected Data */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Connected Data
                        </span>
                        <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-[#0E50F6] font-bold hover:underline">
                          + Add
                        </button>
                      </div>
                      <div className="space-y-3">
                        {uploadedSources.map((s, i) => (
                          <div key={i} className="rounded-xl border border-blue-100 bg-blue-50/30 p-3.5 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-blue-50">
                                <Database className="h-4 w-4 text-blue-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-slate-900 truncate">{s.name || s.filename}</div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  Uploaded 2h ago · {s.profilePreview?.headers.length || '--'} columns
                                </div>
                              </div>
                            </div>
                            <div className="mt-2.5 flex gap-1.5">
                              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-100">
                                {s.profilePreview?.rows.length.toLocaleString() || '0'} rows
                              </span>
                              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-100">
                                2.3 MB
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-3.5 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-violet-50">
                                <div className="font-bold text-xs text-violet-600">🐘</div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-slate-900 truncate">PostgreSQL</div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  prod-db · transactions
                                </div>
                              </div>
                            </div>
                            <div className="mt-2.5 flex gap-1.5">
                              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                                Live
                              </span>
                              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-100">
                                1.2M rows
                              </span>
                            </div>
                          </div>
                      </div>
                    </div>

                    {/* Pinned Insights */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Pin className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Pinned Insights
                        </span>
                      </div>
                      <div className="space-y-3">
                        {PINNED.map((p, i) => (
                          <div key={i} className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-[#0E50F6]/30 hover:shadow-md">
                            <div className="text-sm font-bold leading-tight text-slate-800 group-hover:text-[#0E50F6]">
                              {p.label}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {p.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
