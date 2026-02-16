import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FileText,
    Bot,
    Sparkles,
    MessageSquare,
    ChevronLeft,
    Download,
    Share2,
    Search,
    BrainCircuit,
    Zap,
    History,
    FileSearch,
    Type
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export function DocumentIntelligencePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const context = location.state?.context;
    const [activeView, setActiveView] = useState<'chat' | 'summary' | 'extract'>('chat');
    const [query, setQuery] = useState('');

    if (!context) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center">
                <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <FileSearch className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">No Document Selected</h1>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Please select a document from Google Drive or your local files to start AI-powered intelligence.
                </p>
                <Button onClick={() => navigate('/dashboard/google-drive')} className="rounded-xl">
                    Go to Google Drive
                </Button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col max-w-7xl mx-auto px-6 py-4">
            {/* Header */}
            <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-tight truncate max-w-[300px]">
                            {context.name}
                        </h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            <span className="text-teal-600">Document Intelligence</span>
                            <span>•</span>
                            <span>{context.mimeType?.split('/').pop() || 'PDF'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 text-slate-600">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 text-slate-600">
                        <Share2 className="h-4 w-4" /> Share
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-64 flex flex-col gap-4 overflow-y-auto pr-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Analysis Modes</p>
                        <ModeButton
                            active={activeView === 'chat'}
                            onClick={() => setActiveView('chat')}
                            icon={<MessageSquare className="h-4 w-4" />}
                            label="Contextual Chat"
                        />
                        <ModeButton
                            active={activeView === 'summary'}
                            onClick={() => setActiveView('summary')}
                            icon={<Zap className="h-4 w-4" />}
                            label="Auto Summary"
                        />
                        <ModeButton
                            active={activeView === 'extract'}
                            onClick={() => setActiveView('extract')}
                            icon={<Sparkles className="h-4 w-4" />}
                            label="Data Extraction"
                        />
                    </div>

                    <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                            <Bot className="h-3 w-3" /> AI Model
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            Currently using <span className="text-primary font-bold">DataIQ Intelligence-v4</span>. Optimized for long-document reasoning and semantic extraction.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Recent Queries</p>
                        <HistoryItem text="Summarize project goals" />
                        <HistoryItem text="Extract key deadlines" />
                        <HistoryItem text="List stakeholders" />
                    </div>
                </div>

                {/* Main Workspace */}
                <main className="flex-1 flex flex-col bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden relative shadow-inner">
                    <div className="flex-1 p-8 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {activeView === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="flex gap-4">
                                        <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm max-w-xl">
                                            <p className="text-slate-700 text-sm leading-relaxed font-medium">
                                                I've analyzed <span className="text-teal-600 font-bold">{context.name}</span>. I can help you find specific information, explain complex sections, or generate summaries. What's on your mind?
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Suggestions */}
                                    <div className="grid grid-cols-2 gap-3 max-w-lg ml-12">
                                        <SuggestionCard text="What are the key takeaways?" />
                                        <SuggestionCard text="Summarize in 3 bullet points" />
                                        <SuggestionCard text="Is there any action required?" />
                                        <SuggestionCard text="Extract all dates & deadlines" />
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'summary' && (
                                <motion.div
                                    key="summary"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm h-full"
                                >
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-amber-500" /> Executive Summary
                                        </h2>
                                        <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Regenerate</Button>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Objective</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Initializing summary engine... Please wait for synchronization.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Chat Input */}
                    <div className="p-6 bg-white border-t border-slate-200">
                        <div className="relative max-w-4xl mx-auto">
                            <Input
                                placeholder="Ask about this document..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-6 pr-32 py-7 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/20 transition-all text-base font-medium"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Button size="sm" className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                                    Send
                                </Button>
                            </div>
                        </div>
                        <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                            AI can make mistakes. Verify important information.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function HistoryItem({ text }: { text: string }) {
    return (
        <button className="w-full text-left px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors truncate">
            {text}
        </button>
    );
}

function SuggestionCard({ text }: { text: string }) {
    return (
        <button className="p-3 text-left rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-sm transition-all text-xs font-semibold text-slate-600">
            {text}
        </button>
    );
}
