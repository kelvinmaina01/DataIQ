/**
 * DataIQ — Data Loader
 * Builds data context (schema + sample rows) for the AI agent.
 * Only loads metadata + preview, NOT full datasets — those go into the sandbox.
 */

import Papa from 'papaparse';
import { fileStore } from './file-store';
import { createClient } from '@supabase/supabase-js';
import { Client as PgClient } from 'pg';

export interface DataSourceSpec {
  id: string;
  type: 'file' | 'postgres' | 'supabase' | 'mcp';
  name: string;
  filename?: string;
  content?: Buffer;
  connectionString?: string;
  schema?: string;
  mcpServerUrl?: string;
  connectorType?: string;
  table?: string;
}

export interface DataContext {
  name: string;
  type: string;
  columns?: string[];
  rowCount?: number;
  sampleRows?: Record<string, any>[];
  dtypesSummary?: Record<string, string>;
  schema?: Record<string, {
    nulls: number;
    unique: number;
    sample: any[];
  }>;
  error?: string;
}

/**
 * Build a context array from data sources.
 * This is what the AI sees when deciding how to analyze.
 */
export async function buildDataContext(
  dataSources: DataSourceSpec[]
): Promise<DataContext[]> {
  const contexts: DataContext[] = [];

  for (const source of dataSources) {
    try {
      if (source.type === 'file') {
        const ctx = await contextFromFile(source);
        contexts.push(ctx);
      } else if (source.type === 'postgres') {
        contexts.push(await contextFromPostgres(source));
      } else if (source.type === 'supabase') {
        contexts.push(await contextFromSupabase(source));
      } else if (source.type === 'mcp') {
        contexts.push(await contextFromMcp(source));
      } else {
        contexts.push({
          name: source.name || source.type,
          type: source.type,
          error: `Connector type "${source.type}" not yet implemented in data loader`,
        });
      }
    } catch (err: any) {
      contexts.push({
        name: source.name || 'unknown',
        type: source.type,
        error: err.message,
      });
    }
  }

  return contexts;
}

async function contextFromPostgres(source: DataSourceSpec): Promise<DataContext> {
  if (!source.connectionString) {
    return { name: source.name || 'PostgreSQL', type: 'postgres', error: 'Missing connectionString' };
  }

  const client = new PgClient({ connectionString: source.connectionString });
  try {
    await client.connect();
    const schema = source.schema || 'public';
    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name LIMIT 20`,
      [schema]
    );
    const tableNames = tablesRes.rows.map((r: any) => r.table_name as string);
    const sampleTable = source.table || tableNames[0];

    let sampleRows: Record<string, any>[] = [];
    let columns: string[] = [];
    if (sampleTable) {
      const sampleRes = await client.query(`SELECT * FROM "${schema}"."${sampleTable}" LIMIT 5`);
      sampleRows = sampleRes.rows;
      columns = sampleRes.fields.map((f: any) => f.name);
    }

    return {
      name: source.name || 'PostgreSQL',
      type: 'postgres',
      columns,
      rowCount: undefined,
      sampleRows,
      schema: {
        tables: {
          nulls: 0,
          unique: tableNames.length,
          sample: tableNames.slice(0, 5),
        } as any,
      },
    };
  } catch (err: any) {
    return { name: source.name || 'PostgreSQL', type: 'postgres', error: err.message };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function contextFromSupabase(source: DataSourceSpec): Promise<DataContext> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { name: source.name || 'Supabase', type: 'supabase', error: 'SUPABASE_URL/SUPABASE_KEY missing' };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const table = source.table || source.name;
    if (!table) {
      return { name: source.name || 'Supabase', type: 'supabase', error: 'No table name supplied' };
    }

    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) throw error;
    const rows = data || [];
    const columns = rows[0] ? Object.keys(rows[0]) : [];
    return {
      name: source.name || table,
      type: 'supabase',
      columns,
      rowCount: count || rows.length,
      sampleRows: rows,
    };
  } catch (err: any) {
    return { name: source.name || 'Supabase', type: 'supabase', error: err.message };
  }
}

async function contextFromMcp(source: DataSourceSpec): Promise<DataContext> {
  if (!source.mcpServerUrl) {
    return { name: source.name || 'MCP', type: 'mcp', error: 'Missing mcpServerUrl' };
  }
  try {
    const res = await fetch(`${source.mcpServerUrl}/tools`);
    if (!res.ok) throw new Error(`MCP tools fetch failed: ${res.status}`);
    const data: any = await res.json();
    const tools = Array.isArray(data.tools) ? data.tools : [];
    return {
      name: source.name || 'MCP Connector',
      type: 'mcp',
      columns: ['tool'],
      rowCount: tools.length,
      sampleRows: tools.slice(0, 5).map((t: any) => ({ tool: t.name || 'unknown' })),
    };
  } catch (err: any) {
    return { name: source.name || 'MCP', type: 'mcp', error: err.message };
  }
}

/**
 * Build context from an uploaded CSV/Excel file.
 */
async function contextFromFile(source: DataSourceSpec): Promise<DataContext> {
  let content = source.content;

  // If no content attached, load from file store
  if (!content && source.id) {
    try {
      content = await fileStore.get(source.id);
    } catch {
      return {
        name: source.filename || source.name || 'unknown',
        type: 'file',
        error: 'File not found in store',
      };
    }
  }

  if (!content) {
    return {
      name: source.filename || 'unknown',
      type: 'file',
      error: 'No file content available',
    };
  }

  const filename = source.filename || source.name || 'data';

  // Parse CSV (most common case)
  if (filename.endsWith('.csv')) {
    return parseCSVContext(filename, content.toString('utf-8'));
  }

  // For Excel files, return basic info (full parsing happens in sandbox)
  return {
    name: filename,
    type: 'file',
    columns: [],
    rowCount: 0,
    error: 'Excel file — schema will be inferred in sandbox',
  };
}

/**
 * Parse a CSV string and extract schema + sample rows.
 */
function parseCSVContext(filename: string, csvString: string): DataContext {
  const parsed = Papa.parse(csvString, {
    header: true,
    preview: 100, // Only parse first 100 rows for context
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      name: filename,
      type: 'file',
      error: `CSV parse error: ${parsed.errors[0].message}`,
    };
  }

  const data = parsed.data as Record<string, any>[];
  const columns = parsed.meta.fields || [];

  // Build schema info
  const schema: Record<string, { nulls: number; unique: number; sample: any[] }> = {};
  const dtypesSummary: Record<string, string> = {};

  for (const col of columns) {
    const values = data.map(row => row[col]);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const unique = new Set(nonNull);

    // Infer type
    const firstNonNull = nonNull[0];
    let dtype = 'object';
    if (typeof firstNonNull === 'number') {
      dtype = Number.isInteger(firstNonNull) ? 'int64' : 'float64';
    } else if (typeof firstNonNull === 'boolean') {
      dtype = 'bool';
    }

    schema[col] = {
      nulls: values.length - nonNull.length,
      unique: unique.size,
      sample: nonNull.slice(0, 3),
    };
    dtypesSummary[col] = dtype;
  }

  // Count total rows (approximate from the full string)
  const totalLines = csvString.split('\n').length - 1; // minus header

  return {
    name: filename,
    type: 'file',
    columns,
    rowCount: totalLines,
    sampleRows: data.slice(0, 5),
    schema,
    dtypesSummary,
  };
}
