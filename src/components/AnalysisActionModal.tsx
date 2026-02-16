import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { X, MessageSquare, BookOpen, Zap, Cpu, Sparkles, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface AnalysisContext {
    type: string;
    id: string;
    name: string;
    source: string;
    [key: string]: any;
}

interface AnalysisActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextName: string;
    contextData: AnalysisContext;
    isDocument?: boolean;
}

export function AnalysisActionModal({ isOpen, onClose, contextName, contextData, isDocument = false }: AnalysisActionModalProps) {
    const navigate = useNavigate();

    const handleAction = (action: 'chat' | 'notebook' | 'auto' | 'models' | 'doc_chat') => {
        const routes = {
            chat: '/dashboard/chat',
            notebook: '/dashboard/notebook',
            auto: '/dashboard/auto-analysis',
            models: '/dashboard/models',
            doc_chat: '/dashboard/document-intelligence'
        };

        navigate(routes[action], { state: { context: contextData } });
        toast.success(`Starting ${action} with ${contextName}`);
        onClose();
    };

    // Tabular data is for things like spreadsheets, ads accounts, or databases
    const isTabular = contextData.mimeType?.includes('sheet') ||
        contextData.type === 'google_ads_account' ||
        contextData.mimeType?.includes('spreadsheet') ||
        contextData.mimeType?.includes('csv');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden ring-1 ring-white/20"
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-8 relative">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                    Analyze <span className="text-primary italic">"{contextName}"</span>
                                </h2>
                                <p className="text-slate-500 text-sm mt-1 font-medium">Choose your AI workspace for this asset</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-5 relative">
                            {/* Chat with Data (For Tabular/Sheets) */}
                            {isTabular && (
                                <button
                                    onClick={() => handleAction('chat')}
                                    className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-green-500 hover:bg-green-50 transition-all group text-center space-y-4 shadow-sm hover:shadow-md"
                                >
                                    <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                        <MessageSquare className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-green-700">Chat with Data</h3>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-2">Ask complex questions about your metrics and tables</p>
                                    </div>
                                </button>
                            )}

                            {/* Chat with your files (Document Intelligence for non-tabular) */}
                            {isDocument && (
                                <button
                                    onClick={() => handleAction('doc_chat')}
                                    className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50 transition-all group text-center space-y-4 shadow-sm hover:shadow-md"
                                >
                                    <div className="h-14 w-14 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                                        <Sparkles className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-teal-700">Document Intelligence</h3>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-2">Extract insights, summarize, and query unstructured text</p>
                                    </div>
                                </button>
                            )}

                            {/* Notebook */}
                            <button
                                onClick={() => handleAction('notebook')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-center space-y-4 shadow-sm hover:shadow-md"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <BookOpen className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-blue-700">Python Notebook</h3>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-2">Advanced analysis with code and visualizations</p>
                                </div>
                            </button>

                            {/* Auto Analysis */}
                            <button
                                onClick={() => handleAction('auto')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all group text-center space-y-4 shadow-sm hover:shadow-md"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <Zap className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-purple-700">Auto Insights</h3>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-2">Generate automated reports and trend analysis</p>
                                </div>
                            </button>

                            {/* ML Models */}
                            <button
                                onClick={() => handleAction('models')}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all group text-center space-y-4 shadow-sm hover:shadow-md"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                    <Cpu className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-orange-700">Predictive ML</h3>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-2">Train custom models on this dataset</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
