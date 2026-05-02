import { AnimatePresence, motion } from 'framer-motion';
import {
  Braces,
  Copy,
  Download,
  ListOrdered,
  Maximize2,
  Minimize2,
  Table2,
  AlignJustify,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import {
  buildCsv,
  buildJson,
  buildJsonl,
  buildTsv,
  previewCellTone,
  type PreviewViewMode,
  type PreviewRow,
} from './dataPreviewUtils';

type DatasetMeta = {
  id: string;
  title: string;
  prompt: string;
  rows: unknown[][];
  headers: string[];
  qualityScore?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  viewMode: PreviewViewMode;
  onViewMode: (m: PreviewViewMode) => void;
  previewDatasets: DatasetMeta[];
  selectedPreviewId: string | null;
  onSelectPreviewId: (id: string) => void;
  selectedPreviewTable: { headers: string[]; rows: unknown[][] } | null;
  previewSearch: string;
  onPreviewSearch: (q: string) => void;
  pageRows: PreviewRow[];
  onCellChange: (originalIndex: number, colIdx: number, value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalFilteredRows: number;
  pageSize: number;
  onSaveEdits: () => void;
};

function lineNumberedText(text: string, className: string) {
  const lines = text.split('\n');
  return (
    <pre className={cn('m-0 p-0 font-mono text-[11px] leading-relaxed', className)}>
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            'flex min-w-max border-b border-slate-800/50',
            i % 2 === 0 ? 'bg-slate-800/35' : 'bg-slate-900/50'
          )}
        >
          <span className="inline-block w-9 shrink-0 select-none border-r border-slate-700/80 pr-1.5 text-right text-[10px] text-slate-500">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 whitespace-pre pl-2 pr-2 py-0.5 text-slate-100">{line || ' '}</span>
        </div>
      ))}
    </pre>
  );
}

const viewTabs: { id: PreviewViewMode; label: string; icon: typeof Table2 }[] = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'json', label: 'JSON', icon: Braces },
  { id: 'jsonl', label: 'JSONL', icon: ListOrdered },
  { id: 'tsv', label: 'TSV', icon: AlignJustify },
];

export function SessionDataPreviewModal({
  open,
  onClose,
  expanded,
  onToggleExpand,
  viewMode,
  onViewMode,
  previewDatasets,
  selectedPreviewId,
  onSelectPreviewId,
  selectedPreviewTable,
  previewSearch,
  onPreviewSearch,
  pageRows,
  onCellChange,
  currentPage,
  totalPages,
  onPageChange,
  totalFilteredRows,
  pageSize,
  onSaveEdits,
}: Props) {
  const getTextForView = (mode: PreviewViewMode) => {
    if (!selectedPreviewTable) return '';
    if (mode === 'json') return buildJson(selectedPreviewTable);
    if (mode === 'jsonl') return buildJsonl(selectedPreviewTable);
    if (mode === 'tsv') return buildTsv(selectedPreviewTable);
    return buildTsv(selectedPreviewTable);
  };

  const copyCurrent = async () => {
    if (!selectedPreviewTable) return;
    const text = getTextForView(viewMode === 'table' ? 'tsv' : viewMode);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        viewMode === 'table' ? 'Table copied (tab-separated)' : `Copied as ${viewMode.toUpperCase()}`
      );
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const download = (format: 'csv' | 'json' | 'jsonl' | 'tsv') => {
    if (!selectedPreviewTable || !selectedPreviewId) return;
    let body: string;
    let ext: string;
    let mime: string;
    if (format === 'csv') {
      body = buildCsv(selectedPreviewTable);
      ext = 'csv';
      mime = 'text/csv;charset=utf-8';
    } else if (format === 'json') {
      body = buildJson(selectedPreviewTable);
      ext = 'json';
      mime = 'application/json;charset=utf-8';
    } else if (format === 'jsonl') {
      body = buildJsonl(selectedPreviewTable);
      ext = 'jsonl';
      mime = 'application/x-ndjson;charset=utf-8';
    } else {
      body = buildTsv(selectedPreviewTable);
      ext = 'tsv';
      mime = 'text/tab-separated-values;charset=utf-8';
    }
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-data-${selectedPreviewId.slice(0, 12)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded .${ext}`);
  };

  const jsonBody = selectedPreviewTable ? buildJson(selectedPreviewTable) : '';
  const jsonlBody = selectedPreviewTable ? buildJsonl(selectedPreviewTable) : '';
  const tsvBody = selectedPreviewTable ? buildTsv(selectedPreviewTable) : '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
              expanded
                ? 'fixed left-2 top-2 z-[60] h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none sm:left-3 sm:top-3 sm:h-[calc(100dvh-1.5rem)] sm:w-[calc(100vw-1.5rem)]'
                : 'relative h-[min(82dvh,900px)] w-[min(96vw,1200px)]'
            )}
          >
            {/* Left: sources */}
            <div className="data-preview-scrollbar w-[min(100%,280px)] shrink-0 border-r border-slate-200 bg-slate-50 p-3 max-sm:max-w-[40%]">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Session data sources
              </div>
              <div className="space-y-2">
                {previewDatasets.map((ds) => (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => onSelectPreviewId(ds.id)}
                    className={cn(
                      'w-full rounded-lg border p-2.5 text-left transition-colors',
                      ds.id === selectedPreviewId
                        ? 'border-[#0E50F6]/50 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="truncate text-[12px] font-semibold text-slate-800">{ds.title}</div>
                    <div className="truncate text-[10px] text-slate-400">{ds.prompt}</div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      {ds.rows.length} rows · {ds.headers.length} cols
                      {ds.qualityScore ? ` · Quality ${ds.qualityScore}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: preview */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/* Toolbar */}
              <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">Session Data Preview</div>
                    <p className="text-xs text-slate-500">
                      Inspect, edit (table), filter, copy, and export — multiple formats.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-200 px-2"
                      onClick={onToggleExpand}
                      title={expanded ? 'Exit full screen' : 'Expand'}
                    >
                      {expanded ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-200"
                      onClick={onClose}
                    >
                      <X className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Close</span>
                    </Button>
                  </div>
                </div>

                {/* View mode + search + actions */}
                <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-3">
                  <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
                    {viewTabs.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onViewMode(id)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                          viewMode === id
                            ? 'bg-white text-[#0E50F6] shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 opacity-80" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={previewSearch}
                    onChange={(e) => onPreviewSearch(e.target.value)}
                    placeholder="Filter rows…"
                    className="h-8 min-w-[140px] flex-1 rounded-md border border-slate-200 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 xl:max-w-xs"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 border-slate-200 text-xs"
                      onClick={() => void copyCurrent()}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">save as</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-emerald-200 bg-emerald-50/80 text-[11px] text-emerald-800 hover:bg-emerald-50"
                      onClick={() => download('csv')}
                    >
                      <Download className="mr-0.5 h-3 w-3" />
                      CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-sky-200 bg-sky-50/80 text-[11px] text-sky-900 hover:bg-sky-50"
                      onClick={() => download('json')}
                    >
                      JSON
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-violet-200 bg-violet-50/80 text-[11px] text-violet-900 hover:bg-violet-50"
                      onClick={() => download('jsonl')}
                    >
                      JSONL
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-amber-200 bg-amber-50/80 text-[11px] text-amber-950 hover:bg-amber-50"
                      onClick={() => download('tsv')}
                    >
                      TSV
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 gap-1 bg-[#0E50F6] text-[11px] text-white hover:bg-[#0E50F6]/90"
                      onClick={onSaveEdits}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save edits
                    </Button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 p-3">
                {selectedPreviewId && selectedPreviewTable ? (
                  <>
                    {viewMode === 'table' && (
                      <div className="data-preview-scrollbar min-h-[220px] flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-max min-w-full border-collapse text-[12px]">
                          <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_rgb(226_232_240)]">
                            <tr>
                              <th className="border-b border-r border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                #
                              </th>
                              {selectedPreviewTable.headers.map((h, i) => (
                                <th
                                  key={i}
                                  className={cn(
                                    'border-b border-r border-slate-200 px-2 py-2 text-left text-[11px] font-bold text-slate-700',
                                    i % 2 === 0 ? 'bg-slate-100' : 'bg-slate-50'
                                  )}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pageRows.map(({ originalIndex, row }) => (
                              <tr
                                key={originalIndex}
                                className="border-b border-slate-100 odd:bg-white even:bg-slate-50/40"
                              >
                                <td className="border-r border-slate-100 bg-slate-50 px-2 py-0 text-center text-[10px] font-mono text-slate-400">
                                  {originalIndex + 1}
                                </td>
                                {row.map((val, cIdx) => {
                                  const header = selectedPreviewTable.headers[cIdx] ?? '';
                                  const tone = previewCellTone(header, val);
                                  return (
                                    <td key={cIdx} className={cn('border-r border-slate-100 p-0', tone.wrap)}>
                                      <input
                                        value={String(val ?? '')}
                                        onChange={(e) =>
                                          onCellChange(originalIndex, cIdx, e.target.value)
                                        }
                                        className={cn(
                                          'w-full min-w-[7rem] bg-transparent px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0E50F6]/25',
                                          tone.input
                                        )}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {viewMode === 'json' && (
                      <div className="data-preview-scrollbar min-h-[220px] flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                        {lineNumberedText(jsonBody, 'text-emerald-100')}
                      </div>
                    )}
                    {viewMode === 'jsonl' && (
                      <div className="data-preview-scrollbar min-h-[220px] flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                        {lineNumberedText(jsonlBody, 'text-sky-100')}
                      </div>
                    )}
                    {viewMode === 'tsv' && (
                      <div className="data-preview-scrollbar min-h-[220px] flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                        {lineNumberedText(tsvBody, 'text-orange-100')}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-400">
                    No previewable table in this session yet.
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedPreviewTable && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 sm:px-4">
                  <span>
                    Showing{' '}
                    {totalFilteredRows === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}
                    –
                    {Math.min(currentPage * pageSize, totalFilteredRows)} of {totalFilteredRows} filtered
                    rows ({selectedPreviewTable.rows.length} total in dataset)
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="text-[11px] text-slate-500">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                      className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium disabled:opacity-40"
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
  );
}
