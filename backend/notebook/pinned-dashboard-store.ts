/**
 * Pinned insights & 360 dashboard persistence.
 * Local JSON file (dev) — structure matches production RDBMS rows: user_id, notebook_id, item_type, item_data.
 * Replace with Supabase/Postgres in production; keep the same field names for a drop-in migration.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/** Saved react-grid-layout positions (subset of fields we persist). */
export interface GridLayoutEntry {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export type PinnedItemType = 'chart' | 'insight' | 'stat';

export interface PinnedItem {
  id: string;
  user_id: string;
  notebook_id: string | null;
  item_type: PinnedItemType;
  item_data: Record<string, unknown>;
  pinned_at: string;
  /** Optional per-item default position in the grid (12 cols) */
  layout?: { x: number; y: number; w: number; h: number };
}

export interface UserDashboardState {
  items: PinnedItem[];
  /** react-grid-layout layout for this user (or null = auto) */
  layout: GridLayoutEntry[] | null;
}

interface StoreFile {
  version: 1;
  users: Record<string, UserDashboardState>;
}

const STORE_PATH = path.resolve(process.cwd(), 'uploads', 'pinned-dashboard.json');

const MAX_ITEM_DATA_BYTES = 256_000; // ~256KB per item (prevents runaway payloads)
const MAX_ITEMS_PER_USER = 200;

function ensureFile() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreFile = { version: 1, users: {} };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readStore(): StoreFile {
  ensureFile();
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as StoreFile;
    if (!raw.users) {
      return { version: 1, users: {} };
    }
    return raw;
  } catch {
    return { version: 1, users: {} };
  }
}

function writeStore(store: StoreFile) {
  ensureFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function getUserState(store: StoreFile, userId: string): UserDashboardState {
  if (!store.users[userId]) {
    store.users[userId] = { items: [], layout: null };
  }
  return store.users[userId];
}

function itemDataSize(data: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf-8');
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function normalizeItemType(t: string | undefined): PinnedItemType | null {
  if (t === 'chart' || t === 'insight' || t === 'stat') return t;
  return null;
}

export const pinnedDashboardStore = {
  /**
   * Resolve tenant identity. Prefer authenticated header in production.
   * Override with DASHBOARD_DEFAULT_USER_ID for single-tenant dev.
   */
  resolveUserId(reqUserHeader?: string): string {
    const fromEnv = process.env.DASHBOARD_DEFAULT_USER_ID?.trim();
    if (fromEnv) return fromEnv;
    const h = reqUserHeader?.trim();
    if (h) return h.slice(0, 128);
    return 'default';
  },

  listDashboard(userId: string): UserDashboardState {
    const store = readStore();
    const state = getUserState(store, userId);
    return {
      items: [...state.items].sort(
        (a, b) => new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime()
      ),
      layout: state.layout,
    };
  },

  pin(params: {
    userId: string;
    notebook_id?: string | null;
    item_type: PinnedItemType;
    item_data: Record<string, unknown>;
    layout?: { x: number; y: number; w: number; h: number };
    /** Stable id for dedupe when same logical insight is re-pinned */
    dedupe_key?: string;
  }): PinnedItem {
    if (itemDataSize(params.item_data) > MAX_ITEM_DATA_BYTES) {
      throw new Error('item_data exceeds maximum allowed size');
    }

    const store = readStore();
    const state = getUserState(store, params.userId);

    if (state.items.length >= MAX_ITEMS_PER_USER) {
      throw new Error('Maximum pinned items reached for this user');
    }

    const dedupe = params.dedupe_key?.trim();
    if (dedupe) {
      state.items = state.items.filter(
        (i) =>
          !(
            i.notebook_id === (params.notebook_id ?? null) &&
            (i.item_data as { dedupe_key?: string }).dedupe_key === dedupe
          )
      );
    }

    const item: PinnedItem = {
      id: randomUUID(),
      user_id: params.userId,
      notebook_id: params.notebook_id ?? null,
      item_type: params.item_type,
      item_data: dedupe ? { ...params.item_data, dedupe_key: dedupe } : params.item_data,
      pinned_at: new Date().toISOString(),
      layout: params.layout,
    };

    state.items.push(item);
    writeStore(store);
    return item;
  },

  unpin(userId: string, itemId: string): boolean {
    const store = readStore();
    const state = getUserState(store, userId);
    const before = state.items.length;
    state.items = state.items.filter((i) => i.id !== itemId);
    if (state.items.length === before) return false;
    writeStore(store);
    return true;
  },

  saveLayout(userId: string, layout: GridLayoutEntry[] | null): void {
    const store = readStore();
    const state = getUserState(store, userId);
    state.layout = layout;
    writeStore(store);
  },

  validatePinBody(body: unknown): {
    notebook_id?: string | null;
    item_type: PinnedItemType;
    item_data: Record<string, unknown>;
    layout?: { x: number; y: number; w: number; h: number };
    dedupe_key?: string;
  } {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid JSON body');
    }
    const o = body as Record<string, unknown>;

    // Legacy: { notebookId, insight }
    if (o.insight && typeof o.insight === 'object') {
      const notebookId =
        typeof o.notebookId === 'string'
          ? o.notebookId
          : typeof o.notebook_id === 'string'
            ? o.notebook_id
            : null;
      const insight = o.insight as Record<string, unknown>;
      const inferred =
        insight.chart || insight.chartMeta
          ? 'chart'
          : insight.label && insight.value !== undefined
            ? 'stat'
            : 'insight';
      const item_type = normalizeItemType(typeof o.item_type === 'string' ? (o.item_type as string) : inferred);
      if (!item_type) throw new Error('Could not infer item_type');
      return {
        notebook_id: notebookId,
        item_type,
        item_data: insight,
      };
    }

    const item_type = normalizeItemType(o.item_type as string | undefined);
    if (!item_type) {
      throw new Error('item_type must be chart | insight | stat');
    }

    if (!o.item_data || typeof o.item_data !== 'object' || Array.isArray(o.item_data)) {
      throw new Error('item_data must be an object');
    }

    const notebook_id =
      typeof o.notebook_id === 'string'
        ? o.notebook_id
        : typeof o.notebookId === 'string'
          ? o.notebookId
          : null;

    let layout: { x: number; y: number; w: number; h: number } | undefined;
    const ly = o.layout;
    if (ly && typeof ly === 'object' && !Array.isArray(ly)) {
      const L = ly as Record<string, unknown>;
      if (
        typeof L.x === 'number' &&
        typeof L.y === 'number' &&
        typeof L.w === 'number' &&
        typeof L.h === 'number'
      ) {
        layout = { x: L.x, y: L.y, w: L.w, h: L.h };
      }
    }

    const dedupe_key = typeof o.dedupe_key === 'string' ? o.dedupe_key : undefined;

    return {
      notebook_id,
      item_type,
      item_data: o.item_data as Record<string, unknown>,
      layout,
      dedupe_key,
    };
  },
};
