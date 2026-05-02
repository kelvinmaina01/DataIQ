/**
 * DataIQ — Notebook API Routes
 * Endpoints for the AI Notebook: analyze, upload, datasources, insights.
 *
 * All routes are prefixed with /api/notebook in server.ts.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { Client as PgClient } from 'pg';
import XLSX from 'xlsx';
import { analystTeam } from './team/orchestrator';
import { fileStore } from './file-store';
import { notebookStateStore } from './state-store';
import { notebookSessionStore } from './session-store';
import { pinnedDashboardStore } from './pinned-dashboard-store';

const router = Router();

function dashboardUserId(req: Request): string {
  return pinnedDashboardStore.resolveUserId(req.header('x-user-id'));
}

// Multer config for file uploads (in-memory, 50MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.json', '.tsv'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${ext}" not supported. Use: ${allowed.join(', ')}`));
    }
  },
});


// ─── POST /api/notebook/analyze ─────────────────────────────────────────
// Main analysis endpoint. Streams SSE events from the 4-role AI Analyst Team.
router.post('/analyze', async (req: Request, res: Response) => {
  const {
    prompt,
    dataSources,
    data_sources,
    notebookContext,
    notebook_context,
  } = req.body as {
    prompt: string;
    dataSources?: any[];
    data_sources?: any[];
    notebookContext?: Array<{ prompt: string; resultSummary?: string }>;
    notebook_context?: Array<{ prompt: string; resultSummary?: string }>;
  };

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const write = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Resolve data source content (attach file buffers)
    const resolvedSources = await resolveDataSources(dataSources || data_sources || []);

    // Build schema context from data loader (same as before)
    const { buildDataContext } = await import('./data-loader');
    const schema = await buildDataContext(resolvedSources);

    for await (const event of analystTeam.run(
      prompt,
      schema,
      resolvedSources,
      notebookContext || notebook_context
    )) {
      write(event.event, event.data);
    }
  } catch (err: any) {
    console.error('[Routes] Analysis error:', err);
    write('error', { message: err.message || 'Analysis failed', type: err.constructor?.name });
  }

  res.end();
});


// ─── POST /api/notebook/upload ──────────────────────────────────────────
// Upload a file (CSV, Excel, JSON). Returns datasource metadata.
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Store the file
    const stored = await fileStore.store(
      file.originalname,
      file.buffer,
      file.mimetype
    );

    // Quick profile for immediate UI feedback
    let profile: any = { rows: 0, columns: 0, error: null };

    if (file.originalname.endsWith('.csv')) {
      const parsed = Papa.parse(file.buffer.toString('utf-8'), {
        header: true,
        preview: 5,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      const totalLines = file.buffer.toString('utf-8').split('\n').length - 1;
      const columns = parsed.meta.fields || [];

      profile = {
        rows: totalLines,
        columns: columns.length,
        column_names: columns,
        size_bytes: file.size,
        preview: (parsed.data as any[]).slice(0, 5),
      };
    }

    res.json({
      datasource_id: stored.id,
      filename: file.originalname,
      profile,
      type: 'file',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ─── GET /api/notebook/datasources ──────────────────────────────────────
// List all data sources for the current user.
router.get('/datasources', async (_req: Request, res: Response) => {
  try {
    const files = await fileStore.list();
    const connectors = notebookStateStore.listConnectors();

    res.json({ files, connectors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/notebook/datasources/:id/preview ───────────────────────────
router.get('/datasources/:id/preview', async (req: Request, res: Response) => {
  try {
    const fileId = req.params.id;
    const content = await fileStore.get(fileId);
    const files = await fileStore.list();
    const meta = files.find((f) => f.id === fileId);
    const filename = (meta?.filename || '').toLowerCase();
    const MAX_PREVIEW_ROWS = 5000;

    const buildResponse = (headers: string[], records: Record<string, any>[]) => {
      const sliced = records.slice(0, MAX_PREVIEW_ROWS);
      return {
        headers,
        rows: sliced.map((r) => headers.map((h) => r[h] ?? '')),
        rowCount: records.length,
        truncated: records.length > MAX_PREVIEW_ROWS,
      };
    };

    if (filename.endsWith('.csv') || filename.endsWith('.tsv')) {
      const parsed = Papa.parse(content.toString('utf-8'), {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: filename.endsWith('.tsv') ? '\t' : ',',
      });
      const rows = parsed.data as Record<string, any>[];
      const headers = parsed.meta.fields || (rows[0] ? Object.keys(rows[0]) : []);
      res.json(buildResponse(headers, rows));
      return;
    }

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = XLSX.read(content, { type: 'buffer' });
      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      const headers = rows[0] ? Object.keys(rows[0]) : [];
      res.json(buildResponse(headers, rows));
      return;
    }

    if (filename.endsWith('.json')) {
      const raw = JSON.parse(content.toString('utf-8'));
      const rows = Array.isArray(raw) ? raw : [raw];
      const headers = rows[0] ? Object.keys(rows[0]) : [];
      res.json(buildResponse(headers, rows));
      return;
    }

    res.status(400).json({ error: 'Preview is supported for CSV, TSV, Excel, and JSON files.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/notebook/connectors ───────────────────────────────────────
router.post('/connectors', async (req: Request, res: Response) => {
  try {
    const connector = req.body || {};
    const validation = await validateConnector(connector);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const saved = notebookStateStore.addConnector(connector);
    res.json({ connector_id: saved.id, status: saved.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ─── DELETE /api/notebook/datasources/:id ───────────────────────────────
// Delete a stored file.
router.delete('/datasources/:id', async (req: Request, res: Response) => {
  try {
    await fileStore.delete(req.params.id);
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ─── Pinned insights & 360 dashboard (Section 5) ─────────────────────────
// Registered before /:id so paths like "dashboard" are not captured as notebook ids.

/** GET /api/notebook/dashboard — all pinned items + saved grid layout */
router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const state = pinnedDashboardStore.listDashboard(dashboardUserId(req));
    res.json({ items: state.items, layout: state.layout });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/notebook/dashboard/layout — persist react-grid-layout positions */
router.put('/dashboard/layout', (req: Request, res: Response) => {
  try {
    const layout = req.body?.layout;
    if (layout !== null && layout !== undefined && !Array.isArray(layout)) {
      res.status(400).json({ error: 'layout must be an array or null' });
      return;
    }
    pinnedDashboardStore.saveLayout(dashboardUserId(req), layout ?? null);
    res.json({ saved: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/notebook/insights/:itemId/unpin */
router.delete('/insights/:itemId/unpin', (req: Request, res: Response) => {
  try {
    const ok = pinnedDashboardStore.unpin(dashboardUserId(req), req.params.itemId);
    res.json({ unpinned: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/notebook/insights/pin ───────────────────────────────────────
router.post('/insights/pin', async (req: Request, res: Response) => {
  try {
    const parsed = pinnedDashboardStore.validatePinBody(req.body);
    const item = pinnedDashboardStore.pin({
      userId: dashboardUserId(req),
      notebook_id: parsed.notebook_id,
      item_type: parsed.item_type,
      item_data: parsed.item_data,
      layout: parsed.layout,
      dedupe_key: parsed.dedupe_key,
    });
    res.json({ pinned: true, id: item.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Pin failed' });
  }
});


// ─── POST /api/notebook/save ────────────────────────────────────────────
// Save notebook state (cells, insights, charts).
router.post('/save', async (req: Request, res: Response) => {
  const notebook = req.body;
  const notebookId = notebookStateStore.saveNotebook(notebook);
  res.json({ notebook_id: notebookId, saved: true });
});

// Alias compatible with production guide naming.
router.post('/notebooks', async (req: Request, res: Response) => {
  const notebook = req.body;
  const notebookId = notebookStateStore.saveNotebook(notebook);
  res.json({ notebook_id: notebookId, saved: true });
});

// ─── Notebook Sessions (Supabase) ────────────────────────────────────────
router.get('/sessions', async (_req: Request, res: Response) => {
  try {
    const sessions = await notebookSessionStore.listSessions();
    res.json({ sessions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const created = await notebookSessionStore.createSession(req.body?.title);
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const session = await notebookSessionStore.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { title, payload } = req.body || {};
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'payload is required' });
      return;
    }
    const saved = await notebookSessionStore.saveSession(req.params.id, payload, title);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/notebooks/:id', async (req: Request, res: Response) => {
  const notebook = notebookStateStore.getNotebook(req.params.id);
  if (!notebook) {
    res.status(404).json({ error: 'Notebook not found' });
    return;
  }
  res.json(notebook);
});

// ─── GET /api/notebook/:id ──────────────────────────────────────────────
// Load a saved notebook.
router.get('/:id', async (req: Request, res: Response) => {
  const notebook = notebookStateStore.getNotebook(req.params.id);
  if (!notebook) {
    res.status(404).json({ error: 'Notebook not found' });
    return;
  }
  res.json(notebook);
});


// ─── Helper: Resolve data sources ───────────────────────────────────────
async function resolveDataSources(sources: any[]): Promise<any[]> {
  const resolved = [];
  for (const source of sources) {
    if (source.type === 'file' && source.id) {
      try {
        const content = await fileStore.get(source.id);
        resolved.push({ ...source, content });
      } catch {
        resolved.push(source);
      }
    } else {
      resolved.push(source);
    }
  }
  return resolved;
}


export default router;

async function validateConnector(connector: any): Promise<{ success: boolean; error?: string }> {
  try {
    if (connector?.type === 'postgres') {
      if (!connector.connectionString) return { success: false, error: 'connectionString is required for postgres' };
      const client = new PgClient({ connectionString: connector.connectionString });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connector validation failed' };
  }
}
