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
    MessageSquare,
    ChevronRight,
    Filter
} from 'lucide-react';
import { AnalysisActionModal } from '../../components/AnalysisActionModal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getGoogleSheetsConnection, isGoogleTokenExpired } from '../../services/connectionService';

interface GoogleSheet {
    id: string;
    name: string;
    owner: string;
    modifiedTime: string;
    iconLink?: string;
    webViewLink?: string;
}

export function GoogleSheetsPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    useEffect(() => {
        checkAuthAndLoadSheets();
    }, []);

    const checkAuthAndLoadSheets = async () => {
        const connection = getGoogleSheetsConnection();

        if (!connection || isGoogleTokenExpired()) {
            toast.error('Please connect your Google account first');
            navigate('/dashboard/ingestion/connect/google-sheets');
            return;
        }

        try {
            const response = await fetch(
                `/api/integrations/google/sheets/list?access_token=${encodeURIComponent(connection.accessToken)}`
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response from server:', errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.sheets) {
                setSheets(data.sheets);
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error loading sheets:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load your Google Sheets');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSheetClick = (sheet: GoogleSheet) => {
        setSelectedSheet(sheet);
    };

    const filteredSheets = sheets
        .filter(sheet => sheet.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else {
                return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
            }
        });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-slate-600 font-medium">Loading your sheets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Start Analysis</h1>
                    <p className="text-slate-500 mt-1">Choose a sheet or <button onClick={() => navigate('/dashboard/google-drive')} className="text-primary hover:underline font-medium">browse all Drive files</button></p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-2 text-slate-600 border-slate-200 hidden md:flex"
                        onClick={() => navigate('/dashboard/google-drive')}
                    >
                        Browse all Files
                    </Button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 w-64 bg-white"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className={`h-10 w-10 ${showFilterMenu ? 'bg-slate-100' : ''}`}
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                        <Filter className="h-4 w-4 text-slate-600" />
                    </Button>
                    {showFilterMenu && (
                        <div className="absolute top-12 right-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                            <button
                                onClick={() => { setSortBy('date'); setShowFilterMenu(false); }}
                                className={`w-full px-4 py-2 text-sm text-left hover:bg-slate-50 ${sortBy === 'date' ? 'text-primary font-medium' : 'text-slate-700'}`}
                            >
                                Sort by Date
                            </button>
                            <button
                                onClick={() => { setSortBy('name'); setShowFilterMenu(false); }}
                                className={`w-full px-4 py-2 text-sm text-left hover:bg-slate-50 ${sortBy === 'name' ? 'text-primary font-medium' : 'text-slate-700'}`}
                            >
                                Sort by Name
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sheets List (Clean Table Design) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-4">Owner</div>
                    <div className="col-span-2 text-right">Last Modified</div>
                </div>

                {/* Sheets Rows */}
                <div className="divide-y divide-slate-100">
                    {filteredSheets.length > 0 ? (
                        filteredSheets.map((sheet) => (
                            <motion.button
                                key={sheet.id}
                                onClick={() => handleSheetClick(sheet)}
                                whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                                className="w-full grid grid-cols-12 gap-4 px-6 py-4 text-left group transition-colors"
                            >
                                <div className="col-span-6 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600 group-hover:bg-green-100 transition-colors">
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-slate-700 group-hover:text-primary transition-colors truncate">
                                        {sheet.name}
                                    </span>
                                </div>
                                <div className="col-span-4 flex items-center text-slate-500 text-sm truncate">
                                    <Users className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                    {sheet.owner}
                                </div>
                                <div className="col-span-2 flex items-center justify-end text-slate-500 text-sm">
                                    {new Date(sheet.modifiedTime).toLocaleDateString()}
                                </div>
                            </motion.button>
                        ))
                    ) : (
                        <div className="py-16 text-center">
                            <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-medium">No sheets found</h3>
                            <p className="text-slate-500 text-sm mt-1">Try adjusting your search query</p>
                        </div>
                    )}
                </div>
            </div>


            {/* Action Selection Modal */}
            <AnalysisActionModal
                isOpen={!!selectedSheet}
                onClose={() => setSelectedSheet(null)}
                contextName={selectedSheet?.name || ''}
                contextData={{
                    type: 'google_sheet',
                    id: selectedSheet?.id || '',
                    name: selectedSheet?.name || '',
                    source: 'google'
                }}
            />
        </div>
    );
}
