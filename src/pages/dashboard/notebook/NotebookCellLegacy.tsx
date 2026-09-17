// NotebookCellLegacy.tsx — the original CellData renderer preserved intact.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Copy, Check, CheckCircle2, Download } from 'lucide-react';
import { CellChart } from './NotebookChart';
import type { CellData } from './simulations';

const insightColors: Record<string, { bg: string; border: string; title: string; text: string }> = {
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    title: 'text-rose-700',    text: 'text-rose-600' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   title: 'text-amber-700',   text: 'text-amber-600' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    title: 'text-blue-700',    text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-700', text: 'text-emerald-600' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  title: 'text-violet-700',  text: 'text-violet-600' },
};

const DEFAULT_FOLLOW_UPS = [
  'Which internet service type has the highest churn rate?',
  'Build a churn prediction model and show feature importance',
  'Calculate the revenue impact if we reduce churn by 10%',
  'Show me the payment method breakdown for churned customers',
];

function followUps(cell: CellData): string[] {
  const raw = cell.summary?.suggestedPrompts?.filter(Boolean) ?? [];
  const out = [...raw];
  let i = 0;
  while (out.length < 4) { out.push(DEFAULT_FOLLOW_UPS[i++ % DEFAULT_FOLLOW_UPS.length]); }
  return out.slice(0, 4);
}

const contractBadge: Record<string, string> = {
  'Month-to-month': 'bg-amber-100 text-amber-700',
  'Two year': 'bg-emerald-100 text-emerald-700',
  'One year': 'bg-blue-100 text-blue-700',
};

const PY = new Set(['import','from','as','def','class','return','if','elif','else','for','while','in','try','except','finally','with','lambda','and','or','not','True','False','None']);
const SQL = new Set(['select','from','where','group','by','order','having','limit','as','join','left','right','inner','on','case','when','then','else','end','sum','count','avg','min','max','round','distinct']);

function tokClass(t: string, lang: string): string {
  if (/^\s+$/.test(t)) return '';
  if (/^#.*$/.test(t)||/^--.*$/.test(t)) return 'text-emerald-400 italic';
  if (/^['"].*['"]$/.test(t)) return 'text-amber-300';
  if (/^\d+(\.\d+)?$/.test(t)) return 'text-purple-300';
  if (/^[(){}\[\],.:=+\-/*<>!%]+$/.test(t)) return 'text-slate-400';
  if (lang==='SQL'&&SQL.has(t.toLowerCase())) return 'text-fuchsia-300 font-semibold';
  if (PY.has(t)) return 'text-fuchsia-300 font-semibold';
  if (/^[A-Z][A-Za-z0-9_]*$/.test(t)) return 'text-cyan-300';
  return 'text-slate-200';
}

function highlight(code: string, lang: string) {
  const L = lang.toUpperCase()==='SQL'?'SQL':'PY';
  return code.split('\n').map((line,li)=>{
    const toks=line.split(/([\s]+|#[^\n]*|--[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[(){}\[\],.:=+\-/*<>!%]+)/g).filter(Boolean);
    return <div key={li} className="whitespace-pre">{toks.map((t,ti)=><span key={ti} className={tokClass(t,L)}>{t}</span>)}</div>;
  });
}

export function NotebookCellRenderer({ cell, onPin, onPinChart, onSuggest }: {
  cell: CellData;
  onPin?: (cellId: string, idx: number) => void;
  onPinChart?: (cellId: string, chartIdx: number) => void;
  onSuggest?: (prompt: string) => void;
}) {
  const [thinkOpen, setThinkOpen] = useState(cell.thinkingOpen);
  const [copiedIdx, setCopiedIdx] = useState<number|null>(null);
  const copy = (code:string,i:number)=>{ navigator.clipboard.writeText(code); setCopiedIdx(i); setTimeout(()=>setCopiedIdx(null),2000); };

  return (
    <div className="relative pl-10 mb-3">
      <div className="absolute left-0 top-2 flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono text-slate-400 w-6 text-right">[{cell.num}]</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/80">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0E50F6]/10 text-[#0E50F6]">PROMPT</span>
          <span className="text-[11px] text-slate-400">{cell.label}</span>
        </div>
        <div className="px-4 py-3 text-[14px] text-slate-800 leading-relaxed">{cell.prompt}</div>
      </div>
      {cell.status==='complete'&&(
        <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="px-4 py-3 space-y-3">
            <div className="bg-violet-50 border border-violet-200 rounded-lg overflow-hidden">
              <button onClick={()=>setThinkOpen(!thinkOpen)} className="w-full flex items-center gap-2 px-3 py-2 text-left">
                {thinkOpen?<ChevronDown className="w-4 h-4 text-violet-400"/>:<ChevronRight className="w-4 h-4 text-violet-400"/>}
                <span className="text-xs font-semibold text-violet-600">Reasoning</span>
                <span className="text-[10px] text-violet-400">{cell.thinking.length} thoughts{!thinkOpen?' · click to expand':''}</span>
              </button>
              <AnimatePresence>{thinkOpen&&<motion.div initial={{height:0}} animate={{height:'auto'}} exit={{height:0}} className="overflow-hidden"><div className="px-3 pb-3 pt-1 border-t border-violet-100 space-y-1.5">{cell.thinking.map((t,i)=><div key={i} className="flex gap-2 items-start text-xs text-slate-500"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0 opacity-60"/><span>{t}</span></div>)}</div></motion.div>}</AnimatePresence>
            </div>
            {cell.plan.length>0&&<div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500"/><span className="text-xs font-semibold text-blue-600">Implementation Plan</span></div><div className="space-y-1.5">{cell.plan.map((step,i)=><div key={i} className="flex items-center gap-2 text-xs text-slate-600"><span className="w-[18px] h-[18px] rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">✓</span><span>{step}</span></div>)}</div></div>}
            {cell.codeBlocks.map((block,i)=>(
              <div key={i} className="bg-[#0D1117] rounded-lg overflow-hidden border border-slate-700/50">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mr-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"/><div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"/><div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"/></div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${block.lang==='SQL'?'bg-violet-500/15 text-violet-300':'bg-emerald-500/12 text-emerald-300'}`}>{block.lang}</span>
                  <span className="text-[10px] text-slate-500">{block.label}</span>
                  <div className="flex-1"/>
                  <button onClick={()=>{const b=new Blob([block.code],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`script_${i}.${block.lang==='SQL'?'sql':'py'}`;a.click();}} className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 border border-white/10 rounded flex items-center gap-1 transition-colors"><Download className="w-3 h-3"/>Download</button>
                  <button onClick={()=>copy(block.code,i)} className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5 border border-white/10 rounded flex items-center gap-1 transition-colors">{copiedIdx===i?<><Check className="w-3 h-3"/>Copied</>:<><Copy className="w-3 h-3"/>Copy</>}</button>
                </div>
                <pre className="px-4 py-3 text-[12px] leading-[1.7] font-mono overflow-x-auto whitespace-pre-wrap"><code>{highlight(block.code,block.lang)}</code></pre>
              </div>
            ))}
            {cell.tableData&&<div className="border border-slate-200 rounded-lg overflow-hidden"><div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50"><span className="text-xs font-semibold text-slate-600">Results</span>{cell.qualityScore&&<span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded font-bold">Quality: {cell.qualityScore}</span>}</div><div className="overflow-x-auto"><table className="w-full text-[11px]"><thead><tr className="bg-slate-50 border-b border-slate-100">{cell.tableData.headers.map(h=><th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{cell.tableData.rows.map((row,ri)=><tr key={ri} className="border-b border-slate-50 hover:bg-slate-50/50">{row.map((val:string,ci:number)=><td key={ci} className="px-3 py-1.5 whitespace-nowrap font-mono text-slate-600">{val}</td>)}</tr>)}</tbody></table></div></div>}
            {cell.stats.length>0&&<div className="grid grid-cols-4 gap-2">{cell.stats.map((s,i)=><div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3"><div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</div><div className="text-xl font-bold font-mono" style={{color:s.color}}>{s.value}</div><div className="text-[11px] mt-0.5" style={{color:s.deltaColor}}>{s.delta}</div></div>)}</div>}
            {cell.charts.map((ch,i)=><div key={ch.id||i} className="relative">{onPinChart&&<div className="flex justify-end mb-1"><button type="button" onClick={()=>{void onPinChart(cell.id,i);}} className={`text-[10px] px-2 py-1 rounded border font-semibold whitespace-nowrap transition-colors ${ch.pinned?'bg-[#0E50F6]/10 border-[#0E50F6]/30 text-[#0E50F6]':'bg-white/60 border-slate-200 text-slate-400 hover:text-[#0E50F6] hover:border-[#0E50F6]/30'}`}>📌 {ch.pinned?'Pinned':'Pin chart'}</button></div>}<CellChart chartMeta={ch} chartData={cell.chartData}/></div>)}
            {cell.summary&&<div className="rounded-xl border border-slate-200 overflow-hidden"><div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-blue-50/30"><div className="space-y-3">{cell.summary.paragraphs.map((p,i)=><p key={i} className="text-[13px] leading-[1.8] text-slate-700" dangerouslySetInnerHTML={{__html:p.replace(/\*\*(.*?)\*\*/g,'<strong class="text-slate-900 font-bold">$1</strong>').replace(/`(.*?)`/g,'<code class="text-xs bg-slate-200/70 px-1.5 py-0.5 rounded font-mono text-slate-700">$1</code>')}}/>)}{cell.summary.highlights?.length>0&&<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/60">{cell.summary.highlights.map((h,i)=><span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold" style={{backgroundColor:h.color+'10',borderColor:h.color+'30',color:h.color}}><span className="font-medium text-slate-500">{h.label}:</span>{h.value}</span>)}</div>}</div></div></div>}
            {cell.insights.length>0&&<div><div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Insights</div><div className="space-y-2">{cell.insights.map((ins,i)=>{const c=insightColors[ins.color]||insightColors.blue;return(<div key={i} className={`${c.bg} border ${c.border} rounded-lg p-3 flex gap-3 items-start`}><span className="text-base flex-shrink-0">{ins.icon}</span><div className="flex-1 min-w-0"><div className={`text-[13px] font-bold mb-1 ${c.title}`}>{ins.title}</div><div className={`text-xs leading-relaxed ${c.text}`}>{ins.text}</div></div><button onClick={()=>{void onPin?.(cell.id,i);}} className={`flex-shrink-0 text-[10px] px-2 py-1 rounded border font-semibold whitespace-nowrap transition-colors ${ins.pinned?'bg-[#0E50F6]/10 border-[#0E50F6]/30 text-[#0E50F6]':'bg-white/60 border-slate-200 text-slate-400 hover:text-[#0E50F6] hover:border-[#0E50F6]/30'}`}>📌 {ins.pinned?'Pinned':'Pin'}</button></div>);})}</div></div>}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-3">Suggested next steps</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{followUps(cell).map((sp,i)=><button key={i} type="button" onClick={()=>onSuggest?.(sp)} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-[12px] font-medium text-slate-700 shadow-sm transition-colors hover:border-[#0E50F6]/35 hover:bg-blue-50/80 hover:text-[#0E50F6]"><span className="flex items-start justify-between gap-2"><span className="line-clamp-3 min-w-0 flex-1">{sp}</span><span className="shrink-0 text-slate-400">→</span></span></button>)}</div></div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/><span>{cell.execMsg}</span><span className="ml-auto font-mono text-[10px] text-slate-300">{cell.execTime}</span></div>
        </div>
      )}
    </div>
  );
}
