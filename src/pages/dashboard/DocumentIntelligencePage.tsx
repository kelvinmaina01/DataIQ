import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    CheckCircle2,
    Info,
    Plus,
    Cpu,
    X,
    Download,
    Eye,
    Settings,
    Zap,
    Brain,
    Sparkles,
    ChevronRight,
    ChevronDown,
    FileSearch,
    Code,
    MessageSquare,
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
    Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { DropzoneArea } from '../../components/upload/DropzoneArea';
import { parseFile, ParseResult } from '../../services/fileParser';
import { toast } from 'sonner';

type UploadState = 'idle' | 'parsing' | 'review' | 'uploading' | 'processing' | 'success' | 'error' | 'extraction';
type ExtractionMode = 'visual' | 'prompt' | 'schema';
type ViewMode = 'split' | 'document' | 'output';

interface ExtractedField {
    id: string;
    name: string;
    value: string;
    confidence: number;
    type: 'text' | 'number' | 'date' | 'table' | 'image';
    boundingBox?: { x: number; y: number; width: number; height: number };
}

export function DocumentIntelligencePage() {
    const navigate = useNavigate();
    const location = useLocation();
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

    const toggleSidebar = () => {
        if (window.location.hash === 'extraction') {
            window.location.hash = '';
        } else {
            window.location.hash = 'extraction';
        }
    };

    // Extraction Interface - Full Screen within Dashboard
    if (uploadState === 'extraction') {
        return (
            <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white">
                {/* Premium Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="Toggle Sidebar"
                        >
                            <PanelLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => {
                                setUploadState('idle');
                                setCurrentFile(null);
                                setExtractedFields([]);
                                window.location.hash = '';
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-lg">
                                <Brain className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-900 text-lg">Document Intelligence</h1>
                                <p className="text-xs text-slate-500">{currentFile?.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('document')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'document'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'split'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Grid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('output')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'output'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Code className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <Button
                            onClick={exportData}
                            variant="outline"
                            className="border-slate-300"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>

                        <Button
                            onClick={handleExtract}
                            disabled={isProcessing}
                            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Extract
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden bg-slate-50">
                    {/* Left Panel - Document Preview */}
                    {(viewMode === 'split' || viewMode === 'document') && (
                        <div
                            className="border-r border-slate-200 bg-white overflow-hidden flex flex-col"
                            style={{ width: viewMode === 'split' ? `${leftPanelWidth}%` : '100%' }}
                        >
                            {/* Document Toolbar */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Document Preview</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                                        className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </button>
                                    <span className="text-xs text-slate-600 min-w-[3rem] text-center font-medium">{zoom}%</span>
                                    <button
                                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                                        className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        <Maximize2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Document Display */}
                            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-50">
                                <div
                                    className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-3xl w-full"
                                    style={{ transform: `scale(${zoom / 100})` }}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center mb-8">
                                            <ImageIcon className="h-32 w-32 text-slate-300" />
                                        </div>
                                        <div className="text-center text-slate-400">
                                            <p className="font-medium">Document Preview</p>
                                            <p className="text-sm mt-1">PDF/Image rendering will appear here</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resize Handle */}
                    {viewMode === 'split' && (
                        <div
                            className="w-1 bg-slate-200 hover:bg-primary cursor-col-resize transition-colors relative group"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                const startX = e.clientX;
                                const startWidth = leftPanelWidth;

                                const handleMouseMove = (e: MouseEvent) => {
                                    const deltaX = e.clientX - startX;
                                    const containerWidth = window.innerWidth;
                                    const deltaPercent = (deltaX / containerWidth) * 100;
                                    const newWidth = Math.min(Math.max(startWidth + deltaPercent, 30), 70);
                                    setLeftPanelWidth(newWidth);
                                };

                                const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                            }}
                        >
                            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/10" />
                        </div>
                    )}

                    {/* Right Panel - Extraction Configuration & Results */}
                    {(viewMode === 'split' || viewMode === 'output') && (
                        <div
                            className="flex flex-col bg-white overflow-hidden"
                            style={{ width: viewMode === 'split' ? `${100 - leftPanelWidth}%` : '100%' }}
                        >
                            {/* Extraction Mode Tabs */}
                            <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-200 bg-slate-50">
                                {[
                                    { id: 'visual' as ExtractionMode, label: 'Visual Selection', icon: Eye },
                                    { id: 'prompt' as ExtractionMode, label: 'Prompt', icon: MessageSquare },
                                    { id: 'schema' as ExtractionMode, label: 'Schema', icon: Code },
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setExtractionMode(mode.id)}
                                        className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-2 ${extractionMode === mode.id
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <mode.icon className="h-4 w-4" />
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {/* Extraction Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-white">
                                {extractionMode === 'visual' && (
                                    <div className="space-y-6">
                                        {/* Instructions */}
                                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 mb-1">Visual Extraction</h3>
                                                    <p className="text-sm text-slate-600">
                                                        Click on the document to select fields, or use AI-powered auto-detection
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Auto-detect Button */}
                                        <Button
                                            onClick={handleExtract}
                                            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold py-6"
                                        >
                                            <Brain className="h-5 w-5 mr-2" />
                                            Auto-Detect Fields
                                        </Button>

                                        {/* Extracted Fields */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-slate-900">Extracted Fields</h3>
                                                <span className="text-xs text-slate-500 font-medium">{extractedFields.length} fields</span>
                                            </div>

                                            {extractedFields.map((field) => (
                                                <motion.div
                                                    key={field.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`bg-slate-50 border rounded-lg p-4 transition-all cursor-pointer ${selectedField === field.id
                                                            ? 'border-primary shadow-md shadow-primary/10'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    onClick={() => setSelectedField(field.id)}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-medium text-slate-600">{field.name}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${field.confidence > 0.95 ? 'bg-green-500' :
                                                                            field.confidence > 0.85 ? 'bg-yellow-500' :
                                                                                'bg-red-500'
                                                                        }`} />
                                                                    <span className="text-xs text-slate-500">
                                                                        {Math.round(field.confidence * 100)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-slate-900 font-medium truncate">{field.value}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyToClipboard(field.value, field.id);
                                                            }}
                                                            className="p-2 hover:bg-slate-200 rounded transition-colors text-slate-500 hover:text-slate-900"
                                                        >
                                                            {copiedField === field.id ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {extractionMode === 'prompt' && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <MessageSquare className="h-5 w-5 text-purple-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 mb-1">Prompt-Based Extraction</h3>
                                                    <p className="text-sm text-slate-600">
                                                        Describe what you want to extract in natural language
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-slate-700">Extraction Prompt</label>
                                            <textarea
                                                value={promptText}
                                                onChange={(e) => setPromptText(e.target.value)}
                                                placeholder="Example: Extract all invoice details including invoice number, date, vendor name, line items with quantities and prices, and total amount..."
                                                className="w-full h-40 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Example Prompts</label>
                                            {[
                                                'Extract all personal information including name, email, phone, and address',
                                                'Find all dates, amounts, and transaction IDs from this receipt',
                                                'Extract table data with headers and all rows',
                                            ].map((example, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setPromptText(example)}
                                                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-sm text-slate-700 transition-all"
                                                >
                                                    {example}
                                                </button>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={handleExtract}
                                            disabled={!promptText.trim()}
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-6"
                                        >
                                            <Zap className="h-5 w-5 mr-2" />
                                            Extract with Prompt
                                        </Button>
                                    </div>
                                )}

                                {extractionMode === 'schema' && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <Code className="h-5 w-5 text-green-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 mb-1">Schema-Based Extraction</h3>
                                                    <p className="text-sm text-slate-600">
                                                        Define a structured schema for precise data extraction
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-slate-700">JSON Schema</label>
                                            <textarea
                                                placeholder={`{\n  "invoice_number": "string",\n  "date": "date",\n  "total": "number"\n}`}
                                                className="w-full h-64 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Templates</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Invoice', 'Receipt', 'Form', 'Table'].map((template) => (
                                                    <button
                                                        key={template}
                                                        className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-sm text-slate-700 font-medium transition-all"
                                                    >
                                                        {template}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleExtract}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6"
                                        >
                                            <FileJson className="h-5 w-5 mr-2" />
                                            Extract with Schema
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Upload Interface - Keep original design
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

                    {manualMethod !== 'url' && (
                        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
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

                    {/* Input Area - Original Design */}
                    {uploadState === 'idle' && (
                        manualMethod === 'url' ? (
                            <div className="max-w-2xl mx-auto space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="https://example.com/document-or-page"
                                        className="block w-full px-4 pr-20 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary transition-all font-medium"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                                        <Globe className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-400 font-medium">
                                    Press Enter to analyze • Supports PDFs, docs, and dynamic pages
                                </p>
                            </div>
                        ) : (
                            <DropzoneArea onFilesSelected={handleFilesSelected} />
                        )
                    )}

                    {uploadState === 'parsing' && (
                        <div className="flex flex-col items-center justify-center p-12">
                            <div className="size-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Parsing and analyzing file...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-3 gap-6 mt-8">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
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
    );
}
