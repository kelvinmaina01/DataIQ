import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ArrowLeft,
    FileSpreadsheet,
    Users,
    Clock,
    Loader2,
    Check,
    ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

interface GoogleSheet {
    id: string;
    name: string;
    owner: string;
    modifiedTime: string;
    iconLink?: string;
    webViewLink?: string;
}

interface SchemaColumn {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    index: number;
    sampleValues: any[];
}

type ViewState = 'loading' | 'picker' | 'schema' | 'importing';

export function GoogleSheetsPage() {
    const navigate = useNavigate();
    const [viewState, setViewState] = useState<ViewState>('loading');
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [schema, setSchema] = useState<SchemaColumn[]>([]);
    const [preview, setPreview] = useState<any[]>([]);
    const [importProgress, setImportProgress] = useState(0);

    useEffect(() => {
        checkAuthAndLoadSheets();
    }, []);

    const checkAuthAndLoadSheets = async () => {
        const accessToken = localStorage.getItem('google_access_token');

        if (!accessToken) {
            // Not authenticated, initiate OAuth
            initiateOAuth();
            return;
        }

        // Fetch sheets
        try {
            const response = await fetch(
                `/api/integrations/google/sheets/list?access_token=${encodeURIComponent(accessToken)}`
            );
            const data = await response.json();

            if (data.sheets) {
                setSheets(data.sheets);
                setViewState('picker');
            } else {
                throw new Error('Failed to fetch sheets');
            }
        } catch (error) {
            console.error('Error loading sheets:', error);
            toast.error('Failed to load your Google Sheets');
            // Token might be expired, try re-auth
            initiateOAuth();
        }
    };

    const initiateOAuth = async () => {
        try {
            const response = await fetch('/api/integrations/google/auth');
            const data = await response.json();

            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (error) {
            console.error('Error initiating OAuth:', error);
            toast.error('Failed to start authentication');
        }
    };

    const handleSelectSheet = async (sheet: GoogleSheet) => {
        setSelectedSheet(sheet);
        setViewState('loading');

        const accessToken = localStorage.getItem('google_access_token');

        try {
            const response = await fetch(
                `/api/integrations/google/sheets/${sheet.id}/schema?access_token=${encodeURIComponent(accessToken!)}`
            );
            const data = await response.json();

            setSchema(data.schema);
            setPreview(data.preview);
            setViewState('schema');
        } catch (error) {
            console.error('Error fetching schema:', error);
            toast.error('Failed to analyze sheet');
            setViewState('picker');
        }
    };

    const handleImport = async () => {
        if (!selectedSheet) return;

        setViewState('importing');
        setImportProgress(0);

        const accessToken = localStorage.getItem('google_access_token');

        // Simulate progress
        const progressInterval = setInterval(() => {
            setImportProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const response = await fetch(
                `/api/integrations/google/sheets/${selectedSheet.id}/import`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_token: accessToken,
                        datasetName: selectedSheet.name
                    })
                }
            );

            const data = await response.json();

            clearInterval(progressInterval);
            setImportProgress(100);

            if (data.success) {
                toast.success('Sheet imported successfully!');
                setTimeout(() => {
                    navigate('/dashboard/data-processing', {
                        state: { dataset: data.dataset }
                    });
                }, 1000);
            } else {
                throw new Error('Import failed');
            }
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Error importing sheet:', error);
            toast.error('Failed to import sheet');
            setViewState('schema');
        }
    };

    const filteredSheets = sheets.filter(sheet =>
        sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (viewState === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-slate-600 font-medium">Loading your Google Sheets...</p>
                </div>
            </div>
        );
    }

    if (viewState === 'importing') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md w-full">
                    <div className="text-center mb-6">
                        <FileSpreadsheet className="h-16 w-16 text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            Importing Sheet
                        </h3>
                        <p className="text-slate-600">{selectedSheet?.name}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${importProgress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <p className="text-center text-sm text-slate-600">{importProgress}% complete</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => viewState === 'schema' ? setViewState('picker') : navigate('/dashboard/data-ingestion')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Google Sheets</h1>
                        <p className="text-slate-600 mt-1">
                            {viewState === 'picker' ? 'Select a sheet to analyze' : 'Review and import data'}
                        </p>
                    </div>
                </div>

                {viewState === 'picker' && (
                    <div className="text-sm text-slate-500">
                        {localStorage.getItem('google_user_email')}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {viewState === 'picker' && (
                    <motion.div
                        key="picker"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search sheets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-12 text-base"
                                />
                            </div>
                        </div>

                        {/* Sheets Grid */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                                <div className="col-span-6">Name</div>
                                <div className="col-span-3">Owner</div>
                                <div className="col-span-3">Last Modified</div>
                            </div>

                            {/* Sheets List */}
                            <div className="divide-y divide-slate-100">
                                {filteredSheets.map((sheet) => (
                                    <button
                                        key={sheet.id}
                                        onClick={() => handleSelectSheet(sheet)}
                                        className="w-full grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left group"
                                    >
                                        <div className="col-span-6 flex items-center gap-3">
                                            <FileSpreadsheet className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            <span className="font-medium text-slate-900 group-hover:text-primary transition-colors truncate">
                                                {sheet.name}
                                            </span>
                                        </div>
                                        <div className="col-span-3 flex items-center text-slate-600 text-sm truncate">
                                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                                            {sheet.owner}
                                        </div>
                                        <div className="col-span-3 flex items-center justify-between text-slate-600 text-sm">
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                                                {new Date(sheet.modifiedTime).toLocaleDateString()}
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {filteredSheets.length === 0 && (
                                <div className="py-12 text-center text-slate-500">
                                    No sheets found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {viewState === 'schema' && selectedSheet && (
                    <motion.div
                        key="schema"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Sheet Info */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-8 w-8 text-green-500" />
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedSheet.name}</h3>
                                        <p className="text-sm text-slate-600">{schema.length} columns detected</p>
                                    </div>
                                </div>
                                <Button onClick={handleImport} size="lg">
                                    <Check className="h-5 w-5 mr-2" />
                                    Import Sheet
                                </Button>
                            </div>
                        </div>

                        {/* Schema Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200">
                                <h4 className="font-bold text-slate-900">Detected Schema</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    Review the detected columns and data types
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Column Name</th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Data Type</th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Sample Values</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {schema.map((column, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                    {column.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${column.type === 'number' ? 'bg-blue-100 text-blue-700' :
                                                            column.type === 'date' ? 'bg-purple-100 text-purple-700' :
                                                                column.type === 'boolean' ? 'bg-green-100 text-green-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {column.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {column.sampleValues.slice(0, 3).join(', ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200">
                                <h4 className="font-bold text-slate-900">Data Preview</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    First 10 rows of your data
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {schema.map((col, idx) => (
                                                <th key={idx} className="px-4 py-3 text-left font-medium text-slate-600">
                                                    {col.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {preview.map((row, rowIdx) => (
                                            <tr key={rowIdx} className="hover:bg-slate-50">
                                                {row.map((cell: any, cellIdx: number) => (
                                                    <td key={cellIdx} className="px-4 py-3 text-slate-700">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
