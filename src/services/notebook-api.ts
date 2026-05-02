/**
 * DataIQ — Notebook API Service
 * Frontend service layer for communicating with the notebook backend.
 * Handles SSE streaming, file uploads, and data source management.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

// ─── Types ──────────────────────────────────────────────────────────────

export interface DataSourceRef {
  id: string;
  type: 'file' | 'postgres' | 'supabase' | 'mcp' | string;
  name: string;
  filename?: string;
  profilePreview?: {
    headers: string[];
    rows: any[][];
    rowCount?: number;
    qualityScore?: string;
  };
  connectorType?: string;
  connectionName?: string;
  connectionId?: string;
  status?: string;
}

export interface UploadResult {
  datasource_id: string;
  filename: string;
  profile: {
    rows: number;
    columns: number;
    column_names: string[];
    size_bytes: number;
    preview: Record<string, any>[];
  };
  type: string;
}

export interface AnalyzeCallbacks {
  onStatus?: (stage: string, message: string) => void;
  onThinkingToken?: (token: string) => void;
  onSandboxResult?: (result: any) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface NotebookSessionSummary {
  id: string;
  title: string;
  preview: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotebookSession extends NotebookSessionSummary {
  payload: {
    cells: any[];
    liveResult: any | null;
    uploadedSources: DataSourceRef[];
  };
}

// ─── API Functions ──────────────────────────────────────────────────────

/**
 * Run an analysis query. Streams SSE events and calls callbacks.
 * Returns a promise that resolves when the stream is complete.
 */
export async function analyzePrompt(
  prompt: string,
  dataSources: DataSourceRef[],
  callbacks: AnalyzeCallbacks,
  notebookContext?: Array<{ prompt: string; resultSummary?: string }>
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/notebook/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      dataSources: dataSources.map(s => ({
        id: s.id,
        type: s.type,
        name: s.name,
        filename: s.filename,
      })),
      data_sources: dataSources.map(s => ({
        id: s.id,
        type: s.type,
        name: s.name,
        filename: s.filename,
      })),
      notebookContext,
      notebook_context: notebookContext,
      useThinking: true,
      use_thinking: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    callbacks.onError?.(`Server error (${response.status}): ${text}`);
    return;
  }

  // Parse SSE stream
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  /** Must persist across TCP chunks — event + data lines often arrive separately */
  let sseEventName = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete last line in buffer

    for (const raw of lines) {
      const line = raw.replace(/\r$/, '');
      if (!line.trim()) continue;

      if (line.startsWith('event: ')) {
        sseEventName = line.slice(7).trim();
        continue;
      }

      if (line.startsWith('data: ')) {
        try {
          const payload = JSON.parse(line.slice(6));

          switch (sseEventName) {
            case 'status':
              callbacks.onStatus?.(payload.stage, payload.message);
              break;
            case 'thinking_token':
              callbacks.onThinkingToken?.(payload.token);
              break;
            case 'sandbox_result':
              callbacks.onSandboxResult?.(payload);
              break;
            case 'complete':
              callbacks.onComplete?.(payload);
              break;
            case 'error':
              callbacks.onError?.(payload.message);
              break;
          }
        } catch {
          // Ignore malformed SSE data lines
        }
        sseEventName = '';
      }
    }
  }
}

/**
 * Upload a file to the notebook backend.
 */
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/api/notebook/upload`);

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed — network error'));
    xhr.send(formData);
  });
}

/**
 * Fetch all data sources (uploaded files + connectors).
 */
export async function getDataSources(): Promise<{
  files: Array<{ id: string; filename: string; size: number; type: string }>;
  connectors: any[];
}> {
  const res = await fetch(`${BASE_URL}/api/notebook/datasources`);
  if (!res.ok) throw new Error(`Failed to fetch data sources: ${res.status}`);
  return res.json();
}

export async function addConnector(connector: any): Promise<{ connector_id: string; status: string }> {
  const res = await fetch(`${BASE_URL}/api/notebook/connectors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connector),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

/**
 * Delete a data source.
 */
export async function deleteDataSource(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/notebook/datasources/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete data source: ${res.status}`);
}

export async function getDataSourcePreview(id: string): Promise<{
  headers: string[];
  rows: any[][];
  rowCount: number;
  truncated?: boolean;
}> {
  const res = await fetch(`${BASE_URL}/api/notebook/datasources/${id}/preview`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Server-side pinned row (Section 5 — 360 dashboard). */
export type PinnedItemType = 'chart' | 'insight' | 'stat';

export interface PinnedDashboardItem {
  id: string;
  user_id: string;
  notebook_id: string | null;
  item_type: PinnedItemType;
  item_data: Record<string, unknown>;
  pinned_at: string;
  layout?: { x: number; y: number; w: number; h: number };
}

export interface DashboardResponse {
  items: PinnedDashboardItem[];
  layout: Array<{ i: string; x: number; y: number; w: number; h: number }> | null;
}

/**
 * Pin an item to the enterprise dashboard (persisted).
 * Supports legacy body `{ notebookId, insight }` and structured `{ item_type, item_data, ... }`.
 */
export async function pinToDashboard(body: {
  notebook_id?: string | null;
  notebookId?: string | null;
  item_type?: PinnedItemType;
  item_data?: Record<string, unknown>;
  insight?: Record<string, unknown>;
  layout?: { x: number; y: number; w: number; h: number };
  dedupe_key?: string;
}): Promise<{ pinned: boolean; id: string }> {
  const res = await fetch(`${BASE_URL}/api/notebook/insights/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error((await res.text()) || `Pin failed (${res.status})`);
  }
  return res.json();
}

/** @deprecated Use pinToDashboard — kept for callers using notebookId + insight */
export async function pinInsight(notebookId: string, insight: unknown): Promise<{ id: string }> {
  const data = await pinToDashboard({ notebookId, insight: insight as Record<string, unknown> });
  return { id: data.id };
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${BASE_URL}/api/notebook/dashboard`);
  if (!res.ok) {
    throw new Error(`Dashboard fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function unpinDashboardItem(itemId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/notebook/insights/${encodeURIComponent(itemId)}/unpin`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

export async function saveDashboardLayout(
  layout: Array<{ i: string; x: number; y: number; w: number; h: number }> | null
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/notebook/dashboard/layout`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ layout }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}

/**
 * Save notebook state.
 */
export async function saveNotebook(notebook: any): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/notebook/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notebook),
  });
  const data = await res.json();
  return data.notebook_id;
}

export async function listSessions(): Promise<NotebookSessionSummary[]> {
  const res = await fetch(`${BASE_URL}/api/notebook/sessions`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.sessions || [];
}

export async function createSession(title?: string): Promise<NotebookSession> {
  const res = await fetch(`${BASE_URL}/api/notebook/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getSession(id: string): Promise<NotebookSession> {
  const res = await fetch(`${BASE_URL}/api/notebook/sessions/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveSession(
  id: string,
  payload: NotebookSession['payload'],
  title?: string
): Promise<NotebookSession> {
  const res = await fetch(`${BASE_URL}/api/notebook/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, payload }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
