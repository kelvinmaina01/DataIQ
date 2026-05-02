/**
 * DataIQ — Notebook Cell State Store (Zustand)
 * Full cell state machine for the new 4-role AI Analyst Team.
 * Manages live cells, plan steps, streaming code/thinking, charts, stats, insights.
 */

import { create } from 'zustand';
import type { Layout } from 'react-grid-layout';
import type {
  LiveCell,
  PlanStep,
  PlanStepStatus,
  StreamingCodeBlock,
  SandboxOutput,
  ChartData,
  StatData,
  InsightData,
  NarratorReport,
  ClarificationData,
} from '../types/streaming';
import {
  fetchDashboard,
  unpinDashboardItem,
  saveDashboardLayout,
  type PinnedDashboardItem,
} from '../services/notebook-api';

export type { PinnedDashboardItem };

let cellCounter = 1;

function makeBlankCell(prompt: string = ''): LiveCell {
  return {
    id: `cell-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prompt,
    status: 'idle',
    num: cellCounter++,
    streamingThinking: '',
    plan: [],
    codeBlocks: {},
    sandboxOutputs: {},
    charts: [],
    stats: [],
    insights: [],
  };
}

// ─── Store Interface ─────────────────────────────────────────────────────

interface NotebookStoreState {
  // ── Live Cells ──────────────────────────────────────────────────
  cells: LiveCell[];
  activeCellId: string | null;

  addCell: (prompt?: string) => LiveCell;
  removeCell: (id: string) => void;
  getCell: (id: string) => LiveCell | undefined;

  updateCell: (id: string, patch: Partial<LiveCell>) => void;
  updatePlanStep: (cellId: string, stepNum: number, patch: Partial<PlanStep>) => void;

  appendThinking: (cellId: string, token: string) => void;

  initCodeBlock: (cellId: string, stepNum: number, block: StreamingCodeBlock) => void;
  appendCode: (cellId: string, stepNum: number, token: string) => void;
  finalizeCode: (cellId: string, stepNum: number) => void;

  setSandboxOutput: (cellId: string, stepNum: number, output: SandboxOutput) => void;

  addChart: (cellId: string, chart: ChartData) => void;
  addStat: (cellId: string, stat: StatData) => void;
  addInsight: (cellId: string, insight: InsightData) => void;
  pinInsightInCell: (cellId: string, insightIndex: number) => void;
  pinChartInCell: (cellId: string, chartIndex: number) => void;

  setReport: (cellId: string, report: NarratorReport, suggestedPrompts?: string[]) => void;
  setClarification: (cellId: string, data: ClarificationData) => void;

  resetCell: (id: string) => void;

  // ── Pinned Dashboard ────────────────────────────────────────────
  pinnedItems: PinnedDashboardItem[];
  layout: Layout[] | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  lastLoadedAt: number | null;

  loadDashboard: () => Promise<void>;
  removePinned: (id: string) => Promise<void>;
  persistLayout: (layout: Layout[] | null) => Promise<void>;
  addLocalPin: (item: PinnedDashboardItem) => void;
  clearDashboard: () => void;
}

// ─── Store Implementation ────────────────────────────────────────────────

export const useNotebookStore = create<NotebookStoreState>((set, get) => ({

  // ── Cells ──────────────────────────────────────────────────────────────

  cells: [],
  activeCellId: null,

  addCell: (prompt = '') => {
    const cell = makeBlankCell(prompt);
    set(s => ({ cells: [...s.cells, cell], activeCellId: cell.id }));
    return cell;
  },

  removeCell: (id) => {
    set(s => ({ cells: s.cells.filter(c => c.id !== id) }));
  },

  getCell: (id) => get().cells.find(c => c.id === id),

  updateCell: (id, patch) => {
    set(s => ({
      cells: s.cells.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
  },

  updatePlanStep: (cellId, stepNum, patch) => {
    set(s => ({
      cells: s.cells.map(c => {
        if (c.id !== cellId) return c;
        return {
          ...c,
          plan: c.plan.map(step =>
            step.step === stepNum
              ? { ...step, ...patch } as PlanStep
              : step
          ),
        };
      }),
    }));
  },

  appendThinking: (cellId, token) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, streamingThinking: c.streamingThinking + token }
          : c
      ),
    }));
  },

  initCodeBlock: (cellId, stepNum, block) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, codeBlocks: { ...c.codeBlocks, [stepNum]: block } }
          : c
      ),
    }));
  },

  appendCode: (cellId, stepNum, token) => {
    set(s => ({
      cells: s.cells.map(c => {
        if (c.id !== cellId) return c;
        const existing = c.codeBlocks[stepNum];
        if (!existing) return c;
        return {
          ...c,
          codeBlocks: {
            ...c.codeBlocks,
            [stepNum]: { ...existing, code: existing.code + token },
          },
        };
      }),
    }));
  },

  finalizeCode: (cellId, stepNum) => {
    set(s => ({
      cells: s.cells.map(c => {
        if (c.id !== cellId) return c;
        const existing = c.codeBlocks[stepNum];
        if (!existing) return c;
        return {
          ...c,
          codeBlocks: {
            ...c.codeBlocks,
            [stepNum]: { ...existing, isStreaming: false },
          },
        };
      }),
    }));
  },

  setSandboxOutput: (cellId, stepNum, output) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, sandboxOutputs: { ...c.sandboxOutputs, [stepNum]: output } }
          : c
      ),
    }));
  },

  addChart: (cellId, chart) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, charts: [...c.charts, chart] }
          : c
      ),
    }));
  },

  addStat: (cellId, stat) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, stats: [...c.stats, stat] }
          : c
      ),
    }));
  },

  addInsight: (cellId, insight) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, insights: [...c.insights, insight] }
          : c
      ),
    }));
  },

  pinInsightInCell: (cellId, insightIndex) => {
    set(s => ({
      cells: s.cells.map(c => {
        if (c.id !== cellId) return c;
        return {
          ...c,
          insights: c.insights.map((ins, i) =>
            i === insightIndex ? { ...ins, pinned: !ins.pinned } : ins
          ),
        };
      }),
    }));
  },

  pinChartInCell: (cellId, chartIndex) => {
    set(s => ({
      cells: s.cells.map(c => {
        if (c.id !== cellId) return c;
        return {
          ...c,
          charts: c.charts.map((ch, i) =>
            i === chartIndex ? { ...ch, pinned: !ch.pinned } : ch
          ),
        };
      }),
    }));
  },

  setReport: (cellId, report, suggestedPrompts) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, report, suggestedPrompts: suggestedPrompts ?? [] }
          : c
      ),
    }));
  },

  setClarification: (cellId, data) => {
    set(s => ({
      cells: s.cells.map(c =>
        c.id === cellId
          ? { ...c, status: 'clarification', clarification: data }
          : c
      ),
    }));
  },

  resetCell: (id) => {
    set(s => ({
      cells: s.cells.map(c => {
        if (c.id !== id) return c;
        return {
          ...makeBlankCell(c.prompt),
          id: c.id,
          num: c.num,
        };
      }),
    }));
  },

  // ── Pinned Dashboard ───────────────────────────────────────────────────

  pinnedItems: [],
  layout: null,
  dashboardLoading: false,
  dashboardError: null,
  lastLoadedAt: null,

  loadDashboard: async () => {
    if (get().dashboardLoading) return;
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const { items, layout } = await fetchDashboard();
      set({
        pinnedItems: items,
        layout: (layout as Layout[] | null) ?? null,
        dashboardLoading: false,
        lastLoadedAt: Date.now(),
      });
    } catch (e: any) {
      set({ dashboardError: e?.message || 'Failed to load dashboard', dashboardLoading: false });
    }
  },

  removePinned: async (id) => {
    await unpinDashboardItem(id);
    set(s => ({
      pinnedItems: s.pinnedItems.filter(i => i.id !== id),
      layout: s.layout ? s.layout.filter(l => l.i !== id) : null,
    }));
  },

  persistLayout: async (layout) => {
    await saveDashboardLayout(layout);
    set({ layout });
  },

  addLocalPin: (item) => {
    set(s => {
      const withoutDup = s.pinnedItems.filter(i => i.id !== item.id);
      return { pinnedItems: [item, ...withoutDup] };
    });
  },

  clearDashboard: () => {
    set({ pinnedItems: [], layout: null, dashboardError: null, lastLoadedAt: null });
  },
}));
