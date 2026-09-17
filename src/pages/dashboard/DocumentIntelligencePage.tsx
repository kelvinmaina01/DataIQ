import React, { useState, useEffect } from 'react';
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
    Type,
    Upload,
    CheckCircle2,
    Info,
    Plus,
    Cpu,
    X,
    Eye,
    Settings,
    Brain,
    ChevronRight,
    ChevronDown,
    Code,
    Lightbulb,
    Table,
    List,
    Grid,
    Image as ImageIcon,
    FileJson,
    Copy,
    Check,
    Play,
    Pause,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Save,
    ShieldCheck,
    ArrowLeft,
    PanelLeft,
    PanelRight,
    Globe,
    EyeOff
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { DropzoneArea } from '../../components/upload/DropzoneArea';
import { parseFile, ParseResult } from '../../services/fileParser';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

type UploadState = 'idle' | 'parsing' | 'extraction' | 'error';
type ExtractionMode = 'visual' | 'prompt' | 'schema';
type ViewMode = 'split' | 'document' | 'data';

interface ExtractedField {
    id: string;
    name: string;
    value: string;
    confidence: number;
    type: string;
}

export function DocumentIntelligencePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const context = location.state?.context;
    const [activeView, setActiveView] = useState<'chat' | 'summary' | 'extract'>('chat');
    const [query, setQuery] = useState('');
    const [manualMethod, setManualMethod] = useState<string | null>(null);

    // Upload & Processing State
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);

    // Extraction State
    const [extractionMode, setExtractionMode] = useState<ExtractionMode>('visual');
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [promptText, setPromptText] = useState('');
    const [schemaConfig, setSchemaConfig] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // UI State
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [zoom, setZoom] = useState(100);
    const [showSettings, setShowSettings] = useState(false);
    const [showJson, setShowJson] = useState(false);

    useEffect(() => {
        if (location.state?.method) {
            setManualMethod(location.state.method);
        }
    }, [location.state]);

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        setUploadState('parsing');
        setCurrentFile(files[0]);

        // Set hash to trigger sidebar collapse in DashboardLayout
        window.location.hash = 'extraction';

        try {
            const result = await parseFile(files[0]);
            setParseResult(result);
            setUploadState('extraction');
            toast.success('Document loaded successfully!');

            // Simulate some extracted fields
            setExtractedFields([
                { id: '1', name: 'Document Title', value: 'Invoice #12345', confidence: 0.98, type: 'text' },
                { id: '2', name: 'Date', value: '2024-02-14', confidence: 0.95, type: 'date' },
                { id: '3', name: 'Total Amount', value: '$1,234.56', confidence: 0.99, type: 'number' },
                { id: '4', name: 'Vendor Name', value: 'Acme Corporation', confidence: 0.97, type: 'text' },
            ]);
        } catch (error) {
            console.error('Parsing error:', error);
            toast.error('Failed to parse document');
            setUploadState('idle');
        }
    };

    const handleExtract = async () => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsProcessing(false);
        toast.success('Extraction complete!');
    };

    const copyToClipboard = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success('Copied to clipboard');
    };

    const exportData = () => {
        const data = extractedFields.reduce((acc, field) => {
            acc[field.name] = field.value;
            return acc;
        }, {} as Record<string, string>);

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted-data.json';
        a.click();
        toast.success('Data exported successfully');
    };

    // Landing Interface (Redesigned)
    if (!context && uploadState !== 'extraction' && uploadState !== 'parsing') {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in transition-all duration-500">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                        {manualMethod ? `Analyze ${manualMethod} Documents` : 'Document Intelligence'}
                    </h1>
                </div>

                <div className="flex flex-col gap-10 mb-12 animate-slide-up">
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex gap-2 p-1.5 bg-slate-50/80 rounded-2xl mb-6 w-fit mx-auto border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setManualMethod(null)}
                                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${!manualMethod ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
                            >
                                File Upload
                            </button>
                            <button
                                onClick={() => setManualMethod('url')}
                                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${manualMethod === 'url' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
                            >
                                Web Analysis
                            </button>
                        </div>

                        <p className="text-brand-blue font-bold mb-6 min-h-[2rem] text-center">
                            {manualMethod === 'url'
                                ? 'Paste a URL to extract data from any website or online document.'
                                : 'Upload CSV, Excel, JSON or PDF files with automatic profiling and quality assessment.'}
                        </p>

                        {manualMethod !== 'url' ? (
                            <DropzoneArea
                                onFilesSelected={handleFilesSelected}
                                maxFiles={1}
                                accept={{
                                    'application/pdf': ['.pdf'],
                                    'text/csv': ['.csv'],
                                    'application/json': ['.json'],
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                                }}
                            />
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-4">
                                <div className="relative">
                                    <Input
                                        placeholder="https://example.com/document-or-page"
                                        className="h-14 rounded-2xl bg-white border-slate-200 focus:ring-primary/20 pl-6 pr-32"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <Globe className="h-5 w-5 text-primary mr-2" />
                                        <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6">
                                            Analyze
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-400 font-medium">
                                    Press Enter to analyze • Supports PDFs, docs, and dynamic pages
                                </p>
                            </div>
                        )}

                        {manualMethod !== 'url' && (
                            <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
                                {[
                                    { src: 'https://cdn-icons-png.flaticon.com/512/28/28842.png', alt: 'CSV' },
                                    { src: '/logos/excel.svg', alt: 'Excel' },
                                    { src: 'https://cdn.simpleicons.org/json/000000', alt: 'JSON' },
                                    { src: '/logos/pdf.svg', alt: 'PDF' },
                                    { src: '/logos/word.svg', alt: 'Word' },
                                ].map(f => (
                                    <div key={f.alt} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-brand-blue/20 hover:bg-brand-blue/5 transition-all group cursor-default">
                                        <img src={f.src} alt={f.alt} className="size-6 object-contain" />
                                        <span className="text-xs font-bold text-slate-500 group-hover:text-brand-blue transition-colors">{f.alt}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Features Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <Brain className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">AI-Powered</h3>
                            <p className="text-sm text-slate-500">Smart field detection using advanced AI models</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                <Zap className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Lightning Fast</h3>
                            <p className="text-sm text-slate-500">Process documents in seconds, not minutes</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Secure</h3>
                            <p className="text-sm text-slate-500">Enterprise-grade security for your data</p>
                        </div>
                    </div>

                    {/* Use Cases */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Invoices', icon: FileText },
                            { label: 'Receipts', icon: FileSearch },
                            { label: 'Forms', icon: List },
                            { label: 'Tables', icon: Table },
                        ].map((useCase, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                            >
                                <useCase.icon className="h-5 w-5 text-slate-500" />
                                <span className="font-medium text-slate-700">{useCase.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (uploadState === 'parsing') {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] py-20">
                <div className="size-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Document</h2>
                <p className="text-slate-500 font-medium">Extracting structure and performing quality assessment...</p>
            </div>
        );
    }

    // Context-specific Intelligence view (Redesigned with Sidebar)
    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col max-w-7xl mx-auto px-6 py-4">
            {/* Header */}
            <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => uploadState === 'extraction' ? setUploadState('idle') : navigate(-1)} className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-tight truncate max-w-[300px]">
                            {context?.name || currentFile?.name || 'Document Intelligence'}
                        </h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            <span className="text-teal-600">Document Intelligence</span>
                            <span>•</span>
                            <span>{context?.mimeType?.split('/').pop() || currentFile?.type?.split('/').pop() || 'PDF'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportData} className="rounded-xl gap-2 text-slate-600">
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
                                                I've analyzed <span className="text-teal-600 font-bold">{context?.name || currentFile?.name}</span>. I can help you find specific information, explain complex sections, or generate summaries. What's on your mind?
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

                            {activeView === 'extract' && (
                                <motion.div
                                    key="extract"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col gap-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">Extracted Fields</h3>
                                        <Button size="sm" onClick={handleExtract} disabled={isProcessing}>
                                            {isProcessing ? 'Processing...' : 'Auto-Extract'}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {extractedFields.map(field => (
                                            <div key={field.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{field.name}</p>
                                                    <p className="text-sm font-bold text-slate-900">{field.value}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => copyToClipboard(field.value, field.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    {copiedField === field.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        ))}
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
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
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
