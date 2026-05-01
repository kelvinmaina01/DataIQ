import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Copy, Check, Pin, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { CellChart } from './NotebookChart';
import type { CellData } from './simulations';

const insightColors: Record<string, { bg: string; border: string; title: string; text: string }> = {
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', title: 'text-rose-700', text: 'text-rose-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-700', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-700', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-700', text: 'text-emerald-600' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', title: 'text-violet-700', text: 'text-violet-600' },
};

const contractBadge: Record<string, string> = {
  'Month-to-month': 'bg-amber-100 text-amber-700',
  'Two year': 'bg-emerald-100 text-emerald-700',
  'One year': 'bg-blue-100 text-blue-700',
};

const highlightCode = (code: string, lang: string) => {
  let highlighted = code
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  if (lang === 'SQL') {
    highlighted = highlighted
      .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|AS|THEN|ELSE|END|CASE|WHEN|SUM|COUNT|AVG|ROUND)\b/gi, '<span class="text-pink-400 font-bold">$1</span>')
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="text-amber-300">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-purple-400">$1</span>');
  } else {
    highlighted = highlighted
      .replace(/(#.*?)$/gm, '<span class="text-slate-500 italic">$1</span>')
      .replace(/("|')(?:(?=(\\?))\2.)*?\1/g, '<span class="text-amber-300">$&</span>')
      .replace(/\b(import|from|def|return|if|else|elif|for|while|class|as|lambda)\b/g, '<span class="text-pink-400 font-bold">$1</span>')
      .replace(/\b(print|pd|np|df|mean|sum|astype|groupby|apply|reset_index|crosstab|chi2_contingency)\b/g, '<span class="text-blue-300">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-purple-400">$1</span>');
  }
  return highlighted;
};

export function NotebookCellRenderer({ cell, onPin, onSuggest }: { cell: CellData; onPin?: (cellId: string, idx: number) => void; onSuggest?: (prompt: string) => void }) {
  const [thinkingOpen, setThinkingOpen] = useState(cell.thinkingOpen);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="relative pl-10 mb-3">
      {/* Gutter */}
      <div className="absolute left-0 top-2 flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono text-slate-400 w-6 text-right">[{cell.num}]</span>
      </div>

      {/* Prompt Cell */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/80">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0E50F6]/10 text-[#0E50F6]">PROMPT</span>
          <span className="text-[11px] text-slate-400">{cell.label}</span>
          <div className="flex-1" />
          <button className="text-slate-400 hover:text-slate-600 text-xs p-1">📌</button>
          <button className="text-slate-400 hover:text-slate-600 text-xs p-1">✕</button>
        </div>
        <div className="px-4 py-3 text-[14px] text-slate-800 leading-relaxed">{cell.prompt}</div>
      </div>

      {/* Output */}
      {cell.status === 'complete' && (
        <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="px-4 py-3 space-y-3">
            {/* Thinking */}
            <div className="bg-violet-50 border border-violet-200 rounded-lg overflow-hidden">
              <button onClick={() => setThinkingOpen(!thinkingOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left">
                {thinkingOpen ? <ChevronDown className="w-4 h-4 text-violet-400" /> : <ChevronRight className="w-4 h-4 text-violet-400" />}
                <span className="text-xs font-semibold text-violet-600">Reasoning</span>
                <span className="text-[10px] text-violet-400">{cell.thinking.length} thoughts{!thinkingOpen ? ' · click to expand' : ''}</span>
              </button>
              <AnimatePresence>
                {thinkingOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-3 pb-3 pt-1 border-t border-violet-100 space-y-1.5">
                      {cell.thinking.map((t, i) => (
                        <div key={i} className="flex gap-2 items-start text-xs text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0 opacity-60" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Plan */}
            {cell.plan.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600">Implementation Plan</span>
                </div>
                <div className="space-y-1.5">
                  {cell.plan.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-[18px] h-[18px] rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">✓</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Blocks */}
            {cell.codeBlocks.map((block, i) => (
              <div key={i} className="bg-[#0D1117] rounded-lg overflow-hidden border border-slate-700/50">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                  {/* Macbook window dots */}
                  <div className="flex items-center gap-1.5 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    block.lang === 'SQL' ? 'bg-violet-500/15 text-violet-300' : 'bg-emerald-500/12 text-emerald-300'
                  }`}>{block.lang}</span>
                  <span className="text-[10px] text-slate-500">{block.label}</span>
                  <div className="flex-1" />
                  <button onClick={() => {
                    const blob = new Blob([block.code], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `script_${i}.${block.lang === 'SQL' ? 'sql' : 'py'}`;
                    a.click();
                  }}
                    className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 border border-white/10 rounded flex items-center gap-1 transition-colors">
                    <Download className="w-3 h-3" /> Download
                  </button>
                  <button onClick={() => copyCode(block.code, i)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 border border-white/10 rounded flex items-center gap-1 transition-colors">
                    {copiedIdx === i ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <pre className="px-4 py-3 text-[12px] leading-[1.7] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap"
                     dangerouslySetInnerHTML={{ __html: highlightCode(block.code, block.lang) }} />
              </div>
            ))}

            {/* Data Table */}
            {cell.tableData && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <span className="text-xs font-semibold text-slate-600">{cell.label === 'Data Preview' ? 'customers.csv' : 'Results'}</span>
                  <span className="text-[10px] text-slate-400">showing {cell.tableData.rows.length} of 12,847 rows · {cell.tableData.headers.length} columns</span>
                  {cell.qualityScore && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded font-bold">
                      Quality: {cell.qualityScore}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {cell.tableData.headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cell.tableData.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-slate-50 hover:bg-slate-50/50">
                          {row.map((val: string, ci: number) => {
                            const header = cell.tableData!.headers[ci];
                            const isChurn = header === 'Churn';
                            const isNum = header === 'Tenure' || header === 'MonthlyCharges' || header === 'TotalCharges';
                            const isContract = header === 'Contract';
                            return (
                              <td key={ci} className={`px-3 py-1.5 whitespace-nowrap font-mono ${isNum ? 'text-blue-600' : isChurn ? (val === 'Yes' ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold') : 'text-slate-600'}`}>
                                {isContract ? (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${contractBadge[val] || 'bg-slate-100 text-slate-600'}`}>{val}</span>
                                ) : val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stats */}
            {cell.stats.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {cell.stats.map((s, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</div>
                    <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: s.deltaColor }}>{s.delta}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts */}
            {cell.charts.map((ch, i) => (
              <CellChart key={i} chartMeta={ch} chartData={cell.chartData} />
            ))}

            {/* AI Summary — narrative report */}
            {cell.summary && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
                  <div className="space-y-3">
                    {cell.summary.paragraphs.map((p, i) => (
                      <p key={i} className="text-[13px] leading-[1.8] text-slate-700"
                        dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>').replace(/`(.*?)`/g, '<code class="text-xs bg-slate-200/70 px-1.5 py-0.5 rounded font-mono text-slate-700">$1</code>') }}
                      />
                    ))}
                  </div>

                  {/* Highlight badges */}
                  {cell.summary.highlights && cell.summary.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/60">
                      {cell.summary.highlights.map((h, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold"
                          style={{ backgroundColor: h.color + '10', borderColor: h.color + '30', color: h.color }}>
                          <span className="font-medium text-slate-500">{h.label}:</span> {h.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested prompts */}
                  {cell.summary.suggestedPrompts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-2">Suggested next steps</div>
                      <div className="flex flex-wrap gap-2">
                        {cell.summary.suggestedPrompts.map((sp, i) => (
                          <button key={i} onClick={() => { onSuggest?.(sp); }}
                            className="text-[11px] text-slate-500 hover:text-[#0E50F6] px-3 py-1.5 border border-slate-200 rounded-lg hover:border-[#0E50F6]/30 hover:bg-blue-50 bg-white transition-all text-left">
                            {sp} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {cell.insights.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Insights</div>
                <div className="space-y-2">
                  {cell.insights.map((ins, i) => {
                    const c = insightColors[ins.color] || insightColors.blue;
                    return (
                      <div key={i} className={`${c.bg} border ${c.border} rounded-lg p-3 flex gap-3 items-start`}>
                        <span className="text-base flex-shrink-0">{ins.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[13px] font-bold mb-1 ${c.title}`}>{ins.title}</div>
                          <div className={`text-xs leading-relaxed ${c.text}`}>{ins.text}</div>
                        </div>
                        <button
                          onClick={() => { onPin?.(cell.id, i); toast.success(ins.pinned ? 'Unpinned' : 'Pinned to insights!'); }}
                          className={`flex-shrink-0 text-[10px] px-2 py-1 rounded border font-semibold whitespace-nowrap transition-colors ${
                            ins.pinned
                              ? 'bg-[#0E50F6]/10 border-[#0E50F6]/30 text-[#0E50F6]'
                              : 'bg-white/60 border-slate-200 text-slate-400 hover:text-[#0E50F6] hover:border-[#0E50F6]/30'
                          }`}
                        >
                          📌 {ins.pinned ? 'Pinned' : 'Pin'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Exec Status */}
          <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{cell.execMsg}</span>
            <span className="ml-auto font-mono text-[10px] text-slate-300">{cell.execTime}</span>
          </div>
        </div>
      )}
    </div>
  );
}
