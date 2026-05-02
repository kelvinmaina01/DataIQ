/**
 * Power BI–style 360° dashboard from pinned notebook insights & charts (Section 5).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LayoutGrid, Pencil, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ChartRenderer, type ChartRendererInput } from '../../components/dashboard/ChartRenderer';
import { useNotebookStore, type PinnedDashboardItem } from '../../stores/notebookStore';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

type WidgetType = 'chart' | 'insight' | 'stat';

interface DashboardWidget {
  id: string;
  type: WidgetType;
  data: Record<string, unknown>;
  layout: { x: number; y: number; w: number; h: number };
  raw: PinnedDashboardItem;
}

function autoLayout(index: number, type: WidgetType): { x: number; y: number; w: number; h: number } {
  const col = index % 2;
  const row = Math.floor(index / 2);
  if (type === 'chart') return { x: 0, y: row * 4, w: 12, h: 4 };
  if (type === 'stat') return { x: col * 6, y: row * 2, w: 6, h: 2 };
  return { x: 0, y: row * 3, w: 12, h: 3 };
}

function mergeLayout(items: PinnedDashboardItem[], saved: Layout[] | null): Layout[] {
  const savedById = new Map((saved ?? []).map((l) => [l.i, l]));
  return items.map((item, index) => {
    const existing = savedById.get(item.id);
    if (existing) {
      return {
        ...existing,
        i: item.id,
        minW: existing.minW ?? 2,
        minH: existing.minH ?? 2,
      };
    }
    const base = item.layout ?? autoLayout(index, item.item_type as WidgetType);
    return {
      i: item.id,
      x: base.x,
      y: base.y,
      w: base.w,
      h: base.h,
      minW: 2,
      minH: 2,
    };
  });
}

function toWidgets(items: PinnedDashboardItem[]): DashboardWidget[] {
  return items.map((raw) => ({
    id: raw.id,
    type: raw.item_type,
    data: raw.item_data,
    layout: raw.layout ?? { x: 0, y: 0, w: 6, h: 3 },
    raw,
  }));
}

const statColors: Record<string, string> = {
  red: '#FCA5A5',
  green: '#86EFAC',
  blue: '#93C5FD',
  amber: '#FCD34D',
  neutral: 'white',
};

const severityStyle: Record<
  string,
  { border: string; bg: string; badge: string; icon: string; label: string }
> = {
  critical: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'text-red-300 bg-red-500/15',
    icon: '🚨',
    label: 'Critical',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'text-amber-200 bg-amber-500/15',
    icon: '⚠️',
    label: 'Warning',
  },
  positive: {
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/5',
    badge: 'text-emerald-200 bg-emerald-500/15',
    icon: '✅',
    label: 'Positive',
  },
  info: {
    border: 'border-blue-500/25',
    bg: 'bg-blue-500/5',
    badge: 'text-blue-200 bg-blue-500/15',
    icon: '💡',
    label: 'Insight',
  },
  model: {
    border: 'border-violet-500/25',
    bg: 'bg-violet-500/5',
    badge: 'text-violet-200 bg-violet-500/15',
    icon: '🤖',
    label: 'Model',
  },
};

function KPIStrip({ widgets }: { widgets: DashboardWidget[] }) {
  if (widgets.length === 0) return null;
  const slice = widgets.slice(0, 4);
  return (
    <div
      className="grid gap-3 mb-5"
      style={{ gridTemplateColumns: `repeat(${Math.min(slice.length, 4)}, minmax(0, 1fr))` }}
    >
      {slice.map((w) => {
        const label = String(w.data.label ?? '');
        const value = String(w.data.value ?? '—');
        const delta = w.data.delta != null ? String(w.data.delta) : '';
        const colorKey = typeof w.data.color === 'string' ? w.data.color : 'neutral';
        const color = statColors[colorKey] ?? statColors.neutral;
        return (
          <div
            key={w.id}
            className="rounded-xl border border-white/[0.06] bg-slate-800/80 px-4 py-3.5 shadow-sm"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              {label}
            </div>
            <div className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
              {value}
            </div>
            {delta ? <div className="text-[11px] text-slate-500 mt-1">{delta}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function DashboardWidgetView({
  widget,
  editMode,
  onRemove,
}: {
  widget: DashboardWidget;
  editMode: boolean;
  onRemove: (id: string) => void;
}) {
  const base =
    'h-full min-h-0 rounded-xl border overflow-hidden flex flex-col bg-slate-800/80 border-white/[0.06]';
  const ring = editMode ? 'border-dashed border-blue-500/40 ring-1 ring-blue-500/20' : '';

  if (widget.type === 'chart') {
    const chart = widget.data as unknown as ChartRendererInput;
    return (
      <div className={`${base} ${ring} relative`}>
        {editMode && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <button
              type="button"
              className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300 hover:bg-red-500/30"
              onClick={() => onRemove(widget.id)}
            >
              ✕ Remove
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto p-3">
          <ChartRenderer chart={chart} compact />
        </div>
      </div>
    );
  }

  if (widget.type === 'stat') {
    return (
      <div className={`${base} ${ring} relative p-4 justify-center`}>
        {editMode && (
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300"
              onClick={() => onRemove(widget.id)}
            >
              ✕
            </button>
          </div>
        )}
        <div className="text-[11px] font-semibold uppercase text-slate-500">{String(widget.data.label ?? '')}</div>
        <div className="text-2xl font-bold tabular-nums text-white mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {String(widget.data.value ?? '')}
        </div>
      </div>
    );
  }

  const sev = typeof widget.data.severity === 'string' ? widget.data.severity : 'info';
  const cfg = severityStyle[sev] ?? severityStyle.info;
  const title = String(widget.data.title ?? 'Insight');
  const body = String(widget.data.body ?? widget.data.text ?? '');
  const metric = widget.data.metric != null ? String(widget.data.metric) : '';

  return (
    <div className={`${base} ${ring} relative`}>
      {editMode && (
        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300"
            onClick={() => onRemove(widget.id)}
          >
            ✕ Remove
          </button>
        </div>
      )}
      <div className={`p-4 ${cfg.bg} ${cfg.border} border m-3 rounded-lg flex gap-3 items-start`}>
        <span className="text-lg shrink-0">{String(widget.data.icon ?? cfg.icon)}</span>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-2 ${cfg.badge}`}
          >
            {cfg.icon} {cfg.label}
          </span>
          <div className="text-sm font-semibold text-white mb-1">{title}</div>
          <div className="text-xs text-slate-300 leading-relaxed">{body}</div>
          {metric ? (
            <div
              className="mt-2 text-xl font-bold tabular-nums text-white"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {metric}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [editMode, setEditMode] = useState(false);
  const [gridLayout, setGridLayout] = useState<Layout[]>([]);

  const { pinnedItems, layout: savedGrid, loading, error, loadDashboard, removePinned, persistLayout } =
    useNotebookStore();

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setWidth(Math.max(320, Math.floor(e.contentRect.width)));
      }
    });
    ro.observe(el);
    setWidth(Math.max(320, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setGridLayout(mergeLayout(pinnedItems, savedGrid));
  }, [pinnedItems, savedGrid]);

  const widgets = useMemo(() => toWidgets(pinnedItems), [pinnedItems]);

  const statWidgets = useMemo(() => widgets.filter((w) => w.type === 'stat'), [widgets]);

  const handleLayoutChange = useCallback((next: Layout[]) => {
    setGridLayout(next);
  }, []);

  const toggleEdit = async () => {
    if (editMode) {
      try {
        await persistLayout(gridLayout);
        toast.success('Layout saved');
      } catch (e: any) {
        toast.error(e?.message || 'Could not save layout');
        return;
      }
    }
    setEditMode(!editMode);
  };

  const handleRemove = async (id: string) => {
    try {
      await removePinned(id);
      toast.success('Removed from dashboard');
    } catch (e: any) {
      toast.error(e?.message || 'Remove failed');
    }
  };

  const exportDashboard = () => {
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 px-4 md:px-8 py-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <LayoutGrid className="w-4 h-4" />
              <span>360° Command Center</span>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Analytics Dashboard</h1>
            <p className="text-[13px] text-slate-500 mt-1">
              {widgets.length} pinned insight{widgets.length === 1 ? '' : 's'} · Drag to rearrange · Resize tiles in edit
              mode
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={editMode ? 'default' : 'outline'}
              className={editMode ? 'bg-blue-600 hover:bg-blue-500' : 'border-slate-600 text-slate-200'}
              onClick={() => void toggleEdit()}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {editMode ? 'Done editing' : 'Edit layout'}
            </Button>
            <Button variant="secondary" className="bg-slate-800 text-slate-100" onClick={exportDashboard}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button asChild variant="outline" className="border-slate-600">
              <Link to="/dashboard/notebook">Notebook →</Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-4">
            {error}
          </div>
        ) : null}
        {loading && widgets.length === 0 ? (
          <div className="text-slate-500 text-sm py-20 text-center">Loading pinned insights…</div>
        ) : null}

        <KPIStrip widgets={statWidgets} />

        <div ref={containerRef} className="w-full dashboard-print-root">
          {widgets.length > 0 ? (
            <GridLayout
              className="-ml-2"
              layout={gridLayout}
              cols={12}
              rowHeight={72}
              width={width}
              isDraggable={editMode}
              isResizable={editMode}
              draggableCancel="button,a,input,textarea,select"
              onLayoutChange={handleLayoutChange}
              compactType="vertical"
              margin={[12, 12]}
            >
              {widgets.map((w) => (
                <div key={w.id} className="dashboard-widget">
                  <DashboardWidgetView widget={w} editMode={editMode} onRemove={(id) => void handleRemove(id)} />
                </div>
              ))}
            </GridLayout>
          ) : !loading ? (
            <EmptyDashboard />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="text-center py-20 px-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40">
      <div className="text-5xl mb-4">📌</div>
      <div className="text-lg font-medium text-white mb-2">Your dashboard is empty</div>
      <p className="text-[13px] text-slate-500 mb-6 max-w-md mx-auto">
        Open the AI Notebook, run an analysis, and pin charts or key insights. They appear here with live data and a
        layout you control.
      </p>
      <Button asChild className="bg-[#0E50F6] hover:bg-[#0E50F6]/90">
        <Link to="/dashboard/notebook">Go to Notebook →</Link>
      </Button>
    </div>
  );
}
