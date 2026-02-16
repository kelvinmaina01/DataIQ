import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    File,
    FileText,
    Image,
    Music,
    Video,
    Folder,
    Loader2,
    Filter,
    LayoutGrid,
    List,
    Presentation,
    Settings,
    Database,
    Table as TableIcon
} from 'lucide-react';
import { AnalysisActionModal } from '../../components/AnalysisActionModal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getGoogleSheetsConnection, isGoogleTokenExpired } from '../../services/connectionService';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    thumbnailLink?: string;
    webViewLink?: string;
    iconLink?: string;
    size?: string;
}

export function GoogleDrivePage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        checkAuthAndLoadFiles();
    }, []);

    const checkAuthAndLoadFiles = async () => {
        // Even though it's called getGoogleSheetsConnection, it's the unified Google Workspace OAuth
        const connection = getGoogleSheetsConnection();

        if (!connection || isGoogleTokenExpired()) {
            toast.error('Please connect your Google Workspace account first');
            navigate('/dashboard/ingestion/connect/google-drive');
            return;
        }

        try {
            const response = await fetch(
                `/api/integrations/google/drive/list?access_token=${encodeURIComponent(connection.accessToken)}`
            );
            const data = await response.json();

            if (data.files) {
                // Filter logic: Allow common working files, exclude media/png as requested
                const filtered = data.files.filter((file: DriveFile) => {
                    const mime = file.mimeType.toLowerCase();
                    const name = file.name.toLowerCase();

                    // Exclusions
                    const isAudio = mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav');
                    const isVideo = mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov');
                    const isPng = mime.includes('png') || name.endsWith('.png');

                    if (isAudio || isVideo || isPng) return false;

                    // Allow folders, docs, spreadsheets, PDFs, Presentations, and common images (JPG)
                    return true;
                });
                setFiles(filtered);
            } else {
                throw new Error('Failed to fetch files');
            }
        } catch (error) {
            console.error('Error loading files:', error);
            // Enhanced Mock data for demonstration
            setFiles([
                { id: '1', name: 'Strategic Roadmap 2026.pdf', mimeType: 'application/pdf', modifiedTime: new Date().toISOString() },
                { id: '2', name: 'Market Analysis.docx', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date().toISOString() },
                { id: '3', name: 'Sales Forecast Q4.xlsx', mimeType: 'application/vnd.google-apps.spreadsheet', modifiedTime: new Date().toISOString() },
                { id: '4', name: 'Brand Identity Specs.jpg', mimeType: 'image/jpeg', modifiedTime: new Date().toISOString() },
                { id: '5', name: 'Product Pitch Deck.pptx', mimeType: 'application/vnd.google-apps.presentation', modifiedTime: new Date().toISOString() },
                { id: '6', name: 'Research Notes.txt', mimeType: 'text/plain', modifiedTime: new Date().toISOString() },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const isDocument = (mimeType: string) => {
        const mime = mimeType.toLowerCase();
        return mime.includes('document') ||
            mime.includes('pdf') ||
            mime.includes('text') ||
            mime.includes('presentation') ||
            mime.includes('application/vnd.google-apps.document') ||
            mime.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    };

    const getFileIcon = (mimeType: string) => {
        const mime = mimeType.toLowerCase();
        if (mime.includes('folder')) return <Folder className="h-5 w-5 text-blue-500" />;
        if (mime.includes('image')) return <Image className="h-5 w-5 text-purple-500" />;
        if (mime.includes('spreadsheet') || mime.includes('sheet') || mime.includes('excel') || mime.includes('csv'))
            return <TableIcon className="h-5 w-5 text-green-600" />;
        if (mime.includes('presentation') || mime.includes('powerpoint') || mime.includes('slides'))
            return <Presentation className="h-5 w-5 text-orange-500" />;
        if (mime.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
        if (isDocument(mime)) return <FileText className="h-5 w-5 text-blue-400" />;
        return <File className="h-5 w-5 text-slate-400" />;
    };

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-slate-600 font-medium">Accessing Google Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Google Drive Explorer</h1>
                    <p className="text-primary mt-1 font-medium">Select any file to launch AI-powered analysis or chat</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search your drive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-64 bg-white border-slate-200 focus:ring-primary/20"
                        />
                    </div>
                    <Button variant="outline" size="icon" className="bg-white">
                        <Filter className="h-4 w-4 text-slate-600" />
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ring-1 ring-slate-200/50">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-6">File Name</div>
                    <div className="col-span-4">MIME Type</div>
                    <div className="col-span-2 text-right">Last Modified</div>
                </div>

                <div className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                        {filteredFiles.length > 0 ? (
                            filteredFiles.map((file) => (
                                <motion.button
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    key={file.id}
                                    onClick={() => setSelectedFile(file)}
                                    className="w-full grid grid-cols-12 gap-4 px-6 py-4 text-left group hover:bg-slate-50/80 transition-all items-center"
                                >
                                    <div className="col-span-6 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {getFileIcon(file.mimeType)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-slate-700 group-hover:text-primary truncate">
                                                {file.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                ID: {file.id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-4 flex items-center text-slate-500 text-sm font-medium truncate">
                                        {file.mimeType.split('.').pop()?.split('/').pop() || 'File'}
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end text-slate-400 text-sm font-medium">
                                        {new Date(file.modifiedTime).toLocaleDateString()}
                                    </div>
                                </motion.button>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No files found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnalysisActionModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                contextName={selectedFile?.name || ''}
                contextData={{
                    type: 'google_drive_file',
                    id: selectedFile?.id || '',
                    name: selectedFile?.name || '',
                    source: 'google',
                    mimeType: selectedFile?.mimeType
                }}
                isDocument={selectedFile ? isDocument(selectedFile.mimeType) : false}
            />
        </div>
    );
}
