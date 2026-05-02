/** Utilities for Session Data Preview — exports, typing, and cell styling */

export type PreviewViewMode = 'table' | 'json' | 'jsonl' | 'tsv';

export type PreviewRow = { originalIndex: number; row: unknown[] };

export function recordsFromTable(table: { headers: string[]; rows: unknown[][] }) {
  return table.rows.map((row) =>
    Object.fromEntries(table.headers.map((h, i) => [h, row[i] ?? '']))
  );
}

export function buildCsv(table: { headers: string[]; rows: unknown[][] }): string {
  const esc = (cell: unknown) => {
    const text = String(cell ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  return [
    table.headers.map(esc).join(','),
    ...table.rows.map((row) => row.map(esc).join(',')),
  ].join('\n');
}

export function buildTsv(table: { headers: string[]; rows: unknown[][] }): string {
  const esc = (cell: unknown) => String(cell ?? '').replace(/\t/g, ' ');
  return [
    table.headers.map(esc).join('\t'),
    ...table.rows.map((row) => row.map(esc).join('\t')),
  ].join('\n');
}

export function buildJson(table: { headers: string[]; rows: unknown[][] }): string {
  return JSON.stringify(recordsFromTable(table), null, 2);
}

export function buildJsonl(table: { headers: string[]; rows: unknown[][] }): string {
  const recs = recordsFromTable(table);
  return recs.map((r) => JSON.stringify(r)).join('\n');
}

/** Tailwind classes for cell background + text to make numeric / categorical data easier to scan */
export function previewCellTone(header: string, raw: unknown): { wrap: string; input: string } {
  const h = header.toLowerCase();
  const str = String(raw ?? '').trim();

  if (str === '' || str === '—' || str === '-') {
    return { wrap: 'bg-slate-50/90', input: 'text-slate-400 italic' };
  }

  const yn = str.toLowerCase();
  if (yn === 'yes' || yn === 'true') {
    return { wrap: 'bg-emerald-50/90', input: 'text-emerald-800 font-semibold' };
  }
  if (yn === 'no' || yn === 'false') {
    return { wrap: 'bg-rose-50/90', input: 'text-rose-800 font-semibold' };
  }

  const compact = str.replace(/,/g, '').replace(/%$/, '');
  const num = parseFloat(compact);
  const looksNumeric =
    /^-?\d[\d,]*\.?\d*%?$/.test(str.replace(/,/g, '')) ||
    /^-?\d+\.?\d*[eE][-+]?\d+$/.test(compact);

  if (looksNumeric && !Number.isNaN(num)) {
    if (num < 0) {
      return { wrap: 'bg-rose-50/70', input: 'text-rose-800 font-mono tabular-nums' };
    }
    if (
      h.includes('profit') ||
      h.includes('revenue') ||
      h.includes('growth') ||
      h.includes('retention') ||
      h.includes('salary')
    ) {
      return { wrap: 'bg-emerald-50/65', input: 'text-emerald-900 font-mono tabular-nums' };
    }
    if (h.includes('expense') || h.includes('cost') || h.includes('churn') || h.includes('loss')) {
      return { wrap: 'bg-amber-50/70', input: 'text-amber-900 font-mono tabular-nums' };
    }
    if (h.includes('rate') || h.includes('ratio') || h.includes('digital')) {
      return { wrap: 'bg-orange-50/70', input: 'text-orange-900 font-mono tabular-nums' };
    }
    return { wrap: 'bg-sky-50/70', input: 'text-sky-900 font-mono tabular-nums' };
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const palettes = [
    { wrap: 'bg-violet-50/80', input: 'text-violet-900' },
    { wrap: 'bg-orange-50/75', input: 'text-orange-900' },
    { wrap: 'bg-blue-50/75', input: 'text-blue-900' },
    { wrap: 'bg-amber-50/60', input: 'text-amber-950' },
  ];
  const p = palettes[Math.abs(hash) % palettes.length];
  return { wrap: p.wrap, input: `${p.input} font-medium` };
}
