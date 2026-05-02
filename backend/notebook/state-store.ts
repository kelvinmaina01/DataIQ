import fs from 'fs';
import path from 'path';

interface NotebookSnapshot {
  id: string;
  title?: string;
  cells: any[];
  dataSources: any[];
  insights: any[];
  updatedAt: string;
}

interface NotebookStateFile {
  notebooks: Record<string, NotebookSnapshot>;
  connectors: any[];
  pinnedInsights: any[];
}

const STATE_PATH = path.resolve(process.cwd(), 'uploads', 'notebook-state.json');

function ensureStateFile() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STATE_PATH)) {
    const initial: NotebookStateFile = { notebooks: {}, connectors: [], pinnedInsights: [] };
    fs.writeFileSync(STATE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readState(): NotebookStateFile {
  ensureStateFile();
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return { notebooks: {}, connectors: [], pinnedInsights: [] };
  }
}

function writeState(state: NotebookStateFile) {
  ensureStateFile();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

export const notebookStateStore = {
  listConnectors() {
    return readState().connectors;
  },

  addConnector(connector: any) {
    const state = readState();
    const record = { id: connector.id || `conn-${Date.now()}`, status: 'connected', ...connector };
    state.connectors = [...state.connectors.filter((c) => c.id !== record.id), record];
    writeState(state);
    return record;
  },

  pinInsight(insight: any, notebookId?: string) {
    const state = readState();
    const record = { ...insight, notebookId, pinnedAt: new Date().toISOString() };
    state.pinnedInsights = [
      ...state.pinnedInsights.filter((i) => i.title !== insight?.title),
      record,
    ];
    writeState(state);
    return record;
  },

  saveNotebook(notebook: any) {
    const state = readState();
    const id = notebook.id || notebook.notebook_id || `nb-${Date.now()}`;
    state.notebooks[id] = {
      id,
      title: notebook.title,
      cells: Array.isArray(notebook.cells) ? notebook.cells : [],
      dataSources: Array.isArray(notebook.dataSources) ? notebook.dataSources : [],
      insights: Array.isArray(notebook.insights) ? notebook.insights : [],
      updatedAt: new Date().toISOString(),
    };
    writeState(state);
    return id;
  },

  getNotebook(id: string) {
    return readState().notebooks[id] || null;
  },
};
