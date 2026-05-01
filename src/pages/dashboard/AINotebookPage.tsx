import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Play, Plus, Share2, Database, ChevronDown, ChevronRight,
  BarChart3, Sparkles, Layers, Loader2, Pin, PanelLeftClose, PanelLeft,
  X, Lock, Link, BrainCircuit, Zap, Plug
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { NotebookCellRenderer } from './notebook/NotebookCell';
import { CELL_1, CELL_2, SAMPLE_DATA, PINNED, matchAnalysis, type CellData } from './notebook/simulations';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export function AINotebookPage() {
  const [cells, setCells] = useState<CellData[]>([{ ...CELL_1 }, { ...CELL_2 }]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [livePrompt, setLivePrompt] = useState('');
  const [liveStatus, setLiveStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [liveResult, setLiveResult] = useState<CellData | null>(null);
  const [progress, setProgress] = useState(0);
  const [mlPopupOpen, setMlPopupOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const nextNum = cells.length + 1;

  const handlePin = (cellId: string, insightIdx: number) => {
    setCells(prev => prev.map(c => {
      if (c.id !== cellId) return c;
      const insights = [...c.insights];
      insights[insightIdx] = { ...insights[insightIdx], pinned: !insights[insightIdx].pinned };
      return { ...c, insights };
    }));
  };

  const runLiveCell = async () => {
    if (!livePrompt.trim()) return;
    setLiveStatus('running');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => { if (p >= 92) { clearInterval(interval); return 92; } return p + Math.random() * 15; });
    }, 200);

    await delay(2800);
    clearInterval(interval);
    setProgress(100);

    const analysis = matchAnalysis(livePrompt);
    const result: CellData = {
      ...analysis,
      id: `cell-${nextNum}`,
      num: nextNum,
      prompt: livePrompt,
      label: 'Analysis',
      status: 'complete',
    };

    setLiveResult(result);
    setLiveStatus('complete');
    toast.success('Analysis complete!');
  };

  const setPromptExample = (text: string) => {
    setLivePrompt(text);
    textareaRef.current?.focus();
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.max(44, el.scrollHeight) + 'px';
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-12">
      {/* Notebook Header */}
      <div className="flex items-center gap-4 px-1 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#0E50F6] flex items-center justify-center text-white text-[11px] font-bold">DQ</div>
        <span className="text-sm font-semibold text-slate-800">DataIQ</span>
        <span className="text-slate-300">›</span>
        <input
          className="text-sm text-slate-500 bg-transparent border-none outline-none font-medium focus:text-slate-800 flex-1"
          defaultValue="Customer Churn Analysis — Q3 2024"
        />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI Kernel Ready</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5 h-8 border-slate-200 bg-white">
            <Share2 className="w-3 h-3" /> Share
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5 h-8 border-slate-200 bg-white">
            <Play className="w-3 h-3" /> Run All
          </Button>
          
          <div className="w-px h-5 bg-slate-200 mx-1" />

          <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5 h-8 border-slate-200 bg-white shadow-sm hover:border-[#0E50F6]/30 hover:text-[#0E50F6] transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <PanelLeftClose className={`w-3.5 h-3.5 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} /> {sidebarOpen ? 'Close View' : 'Shortcut View'}
          </Button>
          
          <Button size="sm" className="rounded-lg text-xs gap-1.5 h-8 bg-gradient-to-r from-[#0E50F6] to-violet-500 hover:from-[#0D44D1] hover:to-violet-600 text-white shadow-md border-0 transition-all hover:shadow-lg"
            onClick={() => textareaRef.current?.focus()}>
            <Plus className="w-3.5 h-3.5" /> New Cell
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-0 relative">

        {/* Overlay Sidebar on Right */}
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: sidebarOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-screen w-[280px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col pt-16"
        >
          <div className="flex-1 overflow-y-auto">
            {/* Nav */}
            <div className="p-4 space-y-0.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notebook Overview</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-[#0E50F6] p-1.5 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm hover:border-[#0E50F6]/30 hover:bg-blue-50">
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
              {[
                { icon: Layers, label: 'Cells', active: true },
                { icon: BarChart3, label: 'Visualizations', active: false },
                { icon: Sparkles, label: `Insights (${PINNED.length})`, active: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-2 rounded-md text-[13px] cursor-pointer transition-colors ${
                  item.active ? 'bg-[#0E50F6]/10 text-[#0E50F6] font-bold' : 'text-slate-600 hover:bg-slate-100 font-medium'
                }`}>
                  <item.icon className="w-4 h-4 opacity-70" />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Data Sources */}
            <div className="px-4 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connected Data</span>
            </div>
            {SAMPLE_DATA.tables.map((t, i) => (
              <div key={i} className={`mx-4 mt-2.5 p-3.5 rounded-xl border shadow-sm ${
                t.type === 'db' ? 'bg-violet-50/50 border-violet-200/60' : 'bg-blue-50/50 border-blue-200/60'
              }`}>
                <div className={`text-sm font-bold ${t.type === 'db' ? 'text-violet-700' : 'text-blue-700'}`}>{t.name}</div>
                <div className="text-[11px] text-slate-500 mt-1">{t.meta}</div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {t.stats.map((s, si) => (
                    <span key={si} className="text-[10px] bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200/60 shadow-sm font-semibold">{s}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Pinned Insights */}
            <div className="px-4 pt-6 pb-2">
              <div className="flex items-center gap-1.5">
                <Pin className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Pinned Insights</span>
              </div>
            </div>
            <div className="px-4 pb-6 space-y-2.5">
              {PINNED.map((p, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200/60 bg-white shadow-sm hover:border-[#0E50F6]/40 hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-xs text-slate-700 font-bold leading-relaxed group-hover:text-[#0E50F6] transition-colors">{p.label}</div>
                  <div className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">{p.type}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Notebook Area */}
        <div className="flex-1 px-2 md:px-6 py-2">
          {/* Notebook Title */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">Customer Churn Analysis — Q3 2024</h1>
            <p className="text-xs text-slate-400 mt-1">AI-powered analysis · 12,847 customers · PostgreSQL + CSV · Last run 4 min ago</p>
          </div>

          {/* Pre-rendered Cells */}
          {cells.map(cell => (
            <div key={cell.id}>
              <NotebookCellRenderer cell={cell} onPin={handlePin} onSuggest={setPromptExample} />
              {/* Add cell divider */}
              <div className="group flex items-center gap-2 py-1 my-1 cursor-pointer opacity-0 hover:opacity-100 transition-opacity pl-10">
                <div className="flex-1 h-px bg-slate-200" />
                <button className="text-[11px] text-slate-400 hover:text-[#0E50F6] px-3 py-1 rounded-md border border-slate-200 hover:border-[#0E50F6]/30 hover:bg-blue-50 bg-white transition-all">
                  + Add Cell
                </button>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </div>
          ))}

          {/* Interactive Cell */}
          <div className="relative pl-10 mb-3">
            <div className="absolute left-0 top-2 flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-400 w-6 text-right block">[{nextNum}]</span>
            </div>
            <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${
              liveStatus === 'running' ? 'border-[#0E50F6] ring-2 ring-[#0E50F6]/10' : 'border-[#0E50F6]/40'
            }`}>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/80">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0E50F6]/10 text-[#0E50F6]">PROMPT</span>
                <span className="text-[11px] text-slate-400">New Analysis</span>
                <div className="flex-1" />
                <button className="text-slate-400 hover:text-slate-600 text-xs p-1" onClick={() => { setLivePrompt(''); setLiveResult(null); setLiveStatus('idle'); }}>✕</button>
              </div>
              <textarea
                ref={textareaRef}
                value={livePrompt}
                onChange={(e) => { setLivePrompt(e.target.value); autoResize(e.target); }}
                placeholder="Ask anything about your data... e.g. 'Which internet service has the highest churn?'"
                className="w-full px-4 py-3 text-[14px] text-slate-800 bg-transparent border-none outline-none resize-none min-h-[44px] leading-relaxed placeholder:text-slate-400"
                rows={2}
                disabled={liveStatus === 'running'}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runLiveCell(); }}
              />
              <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100">
                <Button size="sm" onClick={runLiveCell} disabled={liveStatus === 'running'}
                  className="rounded-lg text-xs gap-1.5 h-7 bg-[#0E50F6] hover:bg-[#0D44D1] text-white font-semibold">
                  {liveStatus === 'running' ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : <><Play className="w-3 h-3" /> Run Analysis</>}
                </Button>
                <button onClick={() => toast.info('Connector modal would open here')}
                  className="text-[11px] text-slate-400 hover:text-[#0E50F6] px-2 py-1 border border-slate-200 rounded-md hover:border-[#0E50F6]/30 transition-colors bg-white flex items-center gap-1.5 font-medium">
                  <Link className="w-3 h-3" /> Add connector
                </button>
                <button onClick={() => toast.info('MCP connection modal coming soon')}
                  className="text-[11px] text-slate-400 hover:text-[#0E50F6] px-2 py-1 border border-slate-200 rounded-md hover:border-[#0E50F6]/30 transition-colors bg-white flex items-center gap-1.5 font-medium">
                  <Plug className="w-3 h-3" /> Connect MCPs
                </button>
                <div className="relative">
                  <button onClick={() => setMlPopupOpen(!mlPopupOpen)}
                    className="text-[11px] text-slate-400 hover:text-[#0E50F6] px-2 py-1 border border-slate-200 rounded-md hover:border-[#0E50F6]/30 transition-colors bg-white flex items-center gap-1.5 font-medium">
                    <BrainCircuit className="w-3 h-3" /> ML model ↗
                  </button>

                  {/* ML Popup Drawer */}
                  <AnimatePresence>
                    {mlPopupOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full mb-3 left-0 w-[300px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 z-50 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                              <div className="bg-slate-800 text-white p-1 rounded">
                                <Zap className="w-3 h-3" />
                              </div>
                              DataIQ ML Toolkit
                            </div>
                            <button onClick={() => setMlPopupOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <h3 className="text-[15px] font-bold text-slate-900 mb-2.5 leading-tight pr-4">Unlock Machine Learning insights in DataIQ</h3>
                          
                          <div className="flex gap-1.5 mb-4">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Pre-trained</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">AutoML</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Real-time</span>
                          </div>
                          
                          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white">
                            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
                                 onClick={() => { setPromptExample('Use a pre-trained model to score churn risk'); setMlPopupOpen(false); }}>
                              <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#0E50F6]">Use Pre-trained Models</span>
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                            <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                                 onClick={() => { setPromptExample('Train a new AutoML model on this dataset'); setMlPopupOpen(false); }}>
                              <span className="text-[13px] font-medium text-slate-700 group-hover:text-[#0E50F6]">Train Custom Model</span>
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          </div>
                          
                          <button className="w-full bg-[#0F172A] hover:bg-black text-white text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md">
                            Connect ML Workspace <ChevronRight className="w-4 h-4" />
                          </button>
                          
                          <div className="text-center text-[10px] text-slate-400 mt-3.5 font-medium">
                            One-click setup · Secure access · Turn it off anytime
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="ml-auto text-[10px] text-slate-300">⌘↵ to run</span>
              </div>
            </div>

            {/* Running indicator */}
            {liveStatus === 'running' && (
              <div className="mt-1 border border-slate-200 rounded-xl bg-white p-4 shadow-sm">
                <div className="text-[11px] text-slate-500 mb-2">🤖 AI Analyst is thinking...</div>
                <div className="h-[3px] bg-slate-100 rounded-full overflow-hidden mb-3">
                  <motion.div className="h-full bg-gradient-to-r from-[#0E50F6] to-violet-400 rounded-full"
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0E50F6]"
                      animate={{ y: [0, -4, 0] }} transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.6 }} />
                  ))}
                </div>
              </div>
            )}

            {/* Live result */}
            {liveResult && liveStatus === 'complete' && (
              <div className="mt-1">
                <NotebookCellRenderer cell={liveResult} onSuggest={setPromptExample} />
              </div>
            )}
          </div>

          {/* New cell placeholder */}
          <div onClick={() => textareaRef.current?.focus()}
            className="ml-10 mt-4 border-2 border-dashed border-slate-200 hover:border-[#0E50F6]/30 rounded-xl py-4 text-center text-sm text-slate-400 hover:text-[#0E50F6] cursor-pointer transition-all hover:bg-blue-50/30">
            + Click to add a new analysis cell — ask a question about your data
          </div>
        </div>
      </div>
    </div>
  );
}
