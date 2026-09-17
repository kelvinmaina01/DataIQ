import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export interface SessionPayload {
  cells: any[];
  liveResult: any | null;
  uploadedSources: any[];
}

export interface NotebookSession {
  id: string;
  title: string;
  preview: string | null;
  payload: SessionPayload;
  created_at: string;
  updated_at: string;
}

function getClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

const LOCAL_SESSIONS_PATH = path.resolve(process.cwd(), 'uploads', 'notebook-sessions.json');

function readLocalSessions(): NotebookSession[] {
  const dir = path.dirname(LOCAL_SESSIONS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOCAL_SESSIONS_PATH)) {
    fs.writeFileSync(LOCAL_SESSIONS_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_SESSIONS_PATH, 'utf-8')) as NotebookSession[];
  } catch {
    return [];
  }
}

function writeLocalSessions(sessions: NotebookSession[]) {
  const dir = path.dirname(LOCAL_SESSIONS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_SESSIONS_PATH, JSON.stringify(sessions, null, 2), 'utf-8');
}

function localNow() {
  return new Date().toISOString();
}

export const notebookSessionStore = {
  async listSessions(): Promise<Array<Pick<NotebookSession, 'id' | 'title' | 'preview' | 'created_at' | 'updated_at'>>> {
    const supabase = getClient();
    if (!supabase) {
      const sessions = readLocalSessions()
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .map(({ id, title, preview, created_at, updated_at }) => ({ id, title, preview, created_at, updated_at }));
      return sessions;
    }

    const { data, error } = await supabase
      .from('notebook_sessions')
      .select('id,title,preview,created_at,updated_at')
      .order('updated_at', { ascending: false });
    
    if (error) {
      // If table doesn't exist (PGRST116 or similar), fallback to local
      console.error('Supabase session list error, falling back to local:', error.message);
      const sessions = readLocalSessions()
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .map(({ id, title, preview, created_at, updated_at }) => ({ id, title, preview, created_at, updated_at }));
      return sessions;
    }
    return data || [];
  },

  async createSession(title?: string): Promise<NotebookSession> {
    const supabase = getClient();
    if (!supabase) {
      const sessions = readLocalSessions();
      const now = localNow();
      const created: NotebookSession = {
        id: `local-${Date.now()}`,
        title: title?.trim() || 'Untitled Session',
        preview: null,
        payload: { cells: [], liveResult: null, uploadedSources: [] },
        created_at: now,
        updated_at: now,
      };
      writeLocalSessions([created, ...sessions]);
      return created;
    }

    const { data, error } = await supabase
      .from('notebook_sessions')
      .insert({
        title: title?.trim() || 'Untitled Session',
        preview: null,
        payload: { cells: [], liveResult: null, uploadedSources: [] },
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Supabase session create error, falling back to local:', error.message);
      const sessions = readLocalSessions();
      const now = localNow();
      const created: NotebookSession = {
        id: `local-${Date.now()}`,
        title: title?.trim() || 'Untitled Session',
        preview: null,
        payload: { cells: [], liveResult: null, uploadedSources: [] },
        created_at: now,
        updated_at: now,
      };
      writeLocalSessions([created, ...sessions]);
      return created;
    }
    return data;
  },

  async getSession(id: string): Promise<NotebookSession | null> {
    const supabase = getClient();
    if (!supabase) {
      const sessions = readLocalSessions();
      return sessions.find((s) => s.id === id) || null;
    }

    const { data, error } = await supabase
      .from('notebook_sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Supabase session get error, falling back to local:', error.message);
      const sessions = readLocalSessions();
      return sessions.find((s) => s.id === id) || null;
    }
    return data;
  },

  async saveSession(id: string, payload: SessionPayload, title?: string): Promise<NotebookSession> {
    const supabase = getClient();
    const allCells = [...(payload.cells || []), ...(payload.liveResult ? [payload.liveResult] : [])];
    const preview = allCells.length > 0 ? (allCells[allCells.length - 1].prompt || '').slice(0, 180) : null;

    if (!supabase) {
      const sessions = readLocalSessions();
      const index = sessions.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Session not found');
      sessions[index] = {
        ...sessions[index],
        title: title?.trim() || sessions[index].title,
        payload,
        preview,
        updated_at: localNow(),
      };
      writeLocalSessions(sessions);
      return sessions[index];
    }

    const update: any = {
      payload,
      preview,
      updated_at: new Date().toISOString(),
    };
    if (title?.trim()) update.title = title.trim();

    const { data, error } = await supabase
      .from('notebook_sessions')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase session save error, falling back to local:', error.message);
      const sessions = readLocalSessions();
      const index = sessions.findIndex((s) => s.id === id);
      if (index !== -1) {
        sessions[index] = {
          ...sessions[index],
          title: title?.trim() || sessions[index].title,
          payload,
          preview,
          updated_at: localNow(),
        };
        writeLocalSessions(sessions);
        return sessions[index];
      }
      throw error;
    }
    return data;
  },
};

