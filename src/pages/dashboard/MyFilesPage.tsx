import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, setSupabaseIdentity } from '../../../backend/supabase/supabaseClient';
import { auth } from '../../lib/firebase';
import {
    FolderOpen,
    Search,
    Filter,
    Download,
    Trash2,
    MoreVertical,
    FileText,
    File,
    FileSpreadsheet,
    FileImage,
    FileVideo,
    FileAudio,
    FileCode,
    FileArchive,
    Clock,
    RefreshCw,
    Upload,
    ChevronDown,
    Grid3X3,
    List,
    HardDrive,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Eye,
    Share2,
    Star,
    StarOff,
    ExternalLink,
    Folder,
    Plus,
    ArrowRight,
    X,
    Check,
    FilePlus
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../components/ui/select";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface FileItem {
    id: string;
    name: string;
    type: string;
    size: number;
    status: 'ready' | 'processing' | 'error';
    is_starred: boolean;
    created_at: string;
    updated_at: string;
    url: string;
    storage_path: string;
}

// File type icons mapping
const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-50' };
    if (lowerType.includes('excel') || lowerType.includes('spreadsheet') || lowerType.includes('xlsx') || lowerType.includes('xls') || lowerType.includes('csv')) return { Icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (lowerType.includes('word') || lowerType.includes('document') || lowerType.includes('doc')) return { Icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' };
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('gif')) return { Icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50' };
    if (lowerType.includes('video')) return { Icon: FileVideo, color: 'text-pink-500', bg: 'bg-pink-50' };
    if (lowerType.includes('audio')) return { Icon: FileAudio, color: 'text-indigo-500', bg: 'bg-indigo-50' };
    if (lowerType.includes('code') || lowerType.includes('json') || lowerType.includes('xml')) return { Icon: FileCode, color: 'text-cyan-500', bg: 'bg-cyan-50' };
    if (lowerType.includes('zip') || lowerType.includes('archive') || lowerType.includes('rar')) return { Icon: FileArchive, color: 'text-amber-500', bg: 'bg-amber-50' };
    return { Icon: File, color: 'text-slate-500', bg: 'bg-slate-50' };
};

// Format file size
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
        }
        return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};

export function MyFilesPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);
            await setSupabaseIdentity(user.uid);

            // Fetch files from datasets table (using it as files storage for now)
            const { data, error } = await supabase
                .from('datasets')
                .select('*')
                .eq('user_id', user.uid)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform datasets to file format
            const fileItems: FileItem[] = (data || []).map(item => ({
                id: item.id,
                name: item.name,
                type: item.method || 'Unknown',
                size: item.file_size || 0,
                status: item.status === 'Ready' ? 'ready' : item.status === 'Processing' ? 'processing' : 'ready',
                is_starred: false,
                created_at: item.created_at,
                updated_at: item.updated_at || item.created_at,
                url: item.url,
                storage_path: item.storage_path || ''
            }));

            setFiles(fileItems);
        } catch (error: any) {
            console.error('Error fetching files:', error);
            toast.error('Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('datasets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setFiles(prev => prev.filter(f => f.id !== id));
            setSelectedFiles(prev => prev.filter(fid => fid !== id));
            toast.success('File deleted successfully');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error('Failed to delete file');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) return;

        try {
            const { error } = await supabase
                .from('datasets')
                .delete()
                .in('id', selectedFiles);

            if (error) throw error;

            setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
            setSelectedFiles([]);
            toast.success(`${selectedFiles.length} files deleted successfully`);
        } catch (error: any) {
            console.error('Bulk delete error:', error);
            toast.error('Failed to delete files');
        }
    };

    const toggleStar = (id: string) => {
        setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, is_starred: !f.is_starred } : f
        ));
    };

    const toggleSelect = (id: string) => {
        setSelectedFiles(prev => 
            prev.includes(id) 
                ? prev.filter(fid => fid !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(filteredFiles.map(f => f.id));
        }
    };

    // Filter and sort files
    const filteredFiles = files.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || 
            (typeFilter === 'documents' && (file.type.includes('pdf') || file.type.includes('doc') || file.type.includes('txt'))) ||
            (typeFilter === 'spreadsheets' && (file.type.includes('excel') || file.type.includes('csv') || file.type.includes('spreadsheet'))) ||
            (typeFilter === 'images' && file.type.includes('image')) ||
            (typeFilter === 'starred' && file.is_starred);
        return matchesSearch && matchesType;
    }).sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
        if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
        if (sortOrder === 'size') return b.size - a.size;
        return 0;
    });

    // Calculate stats
    const totalFiles = files.length;
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const starredFiles = files.filter(f => f.is_starred).length;
    const readyFiles = files.filter(f => f.status === 'ready').length;

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-row items-center justify-between w-full p-0 m-0 border-none mb-8">
                <div className="text-left flex flex-col p-0 m-0">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight p-0 m-0 leading-none">My Files</h1>
                    <p className="text-slate-500 font-medium text-xs md:text-sm p-0 m-0 mt-0.5">
                        Manage and organize your <span className="text-[#0E50F6] font-bold">uploaded files</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 p-0 m-0">
                    <Button
                        variant="outline"
                        onClick={fetchFiles}
                        className="rounded-xl border-slate-200 hover:bg-slate-50 h-10 w-10 p-0 shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={() => navigate('/dashboard/ingestion')}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5 h-10 font-bold shadow-md shadow-primary/20 gap-2 shrink-0 whitespace-nowrap transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Upload Files</span>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'total files', value: totalFiles, icon: FolderOpen, color: 'text-[#0E50F6]', bg: 'bg-blue-50' },
                    { label: 'total size', value: formatFileSize(totalSize), icon: HardDrive, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'starred', value: starredFiles, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'ready', value: readyFiles, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-[#0E50F6]/40 transition-all flex flex-row items-center justify-between h-full group"
                    >
                        <div className="flex flex-col gap-2">
                            <h4 className="text-[13px] font-bold text-primary tracking-wider whitespace-nowrap opacity-100 !lowercase">{stat.label}</h4>
                            <p className="text-3xl font-bold text-slate-900 tracking-tighter">{stat.value}</p>
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-all duration-300 group-hover:scale-110 shadow-inner`}>
                            <stat.icon className="w-7 h-7 stroke-[1.5]" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 rounded-xl border-slate-200 focus:border-[#0E50F6] focus:ring-[#0E50F6]/20"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Type Filter */}
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-slate-200">
                                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Files</SelectItem>
                                <SelectItem value="documents">Documents</SelectItem>
                                <SelectItem value="spreadsheets">Spreadsheets</SelectItem>
                                <SelectItem value="images">Images</SelectItem>
                                <SelectItem value="starred">Starred</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort */}
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-slate-200">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="size">Size</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* View Toggle & Bulk Actions */}
                    <div className="flex items-center gap-2">
                        {selectedFiles.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2"
                            >
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 font-bold">
                                    {selectedFiles.length} selected
                                </Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    className="h-9 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </motion.div>
                        )}
                        
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-[#0E50F6]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-[#0E50F6]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Files Grid/List */}
            {loading ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#0E50F6] rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold text-sm">Loading files...</p>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center bg-white border border-blue-100 rounded-3xl">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        <FolderOpen className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Files Found</h3>
                    <p className="text-slate-500 max-w-xs text-sm font-medium">
                        {searchQuery 
                            ? `No results for "${searchQuery}"` 
                            : typeFilter !== 'all' 
                                ? `No ${typeFilter} files found` 
                                : "Upload your first file to get started."}
                    </p>
                    <Button
                        onClick={() => navigate('/dashboard/ingestion')}
                        className="mt-4 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 font-bold shadow-md shadow-primary/20 gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Files
                    </Button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {filteredFiles.map((file, index) => {
                            const { Icon, color, bg } = getFileIcon(file.type);
                            return (
                                <motion.div
                                    key={file.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    className={`bg-white rounded-2xl border ${selectedFiles.includes(file.id) ? 'border-[#0E50F6] ring-2 ring-[#0E50F6]/20' : 'border-blue-100 hover:border-[#0E50F6]/40'} shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative overflow-hidden`}
                                >
                                    {/* Selection Checkbox */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <button
                                            onClick={() => toggleSelect(file.id)}
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedFiles.includes(file.id) ? 'bg-[#0E50F6] border-[#0E50F6]' : 'border-slate-300 bg-white opacity-0 group-hover:opacity-100'}`}
                                        >
                                            {selectedFiles.includes(file.id) && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    </div>

                                    {/* Star Button */}
                                    <button
                                        onClick={() => toggleStar(file.id)}
                                        className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-all ${file.is_starred ? 'text-amber-500 bg-amber-50' : 'text-slate-300 bg-white opacity-0 group-hover:opacity-100 hover:text-amber-500'}`}
                                    >
                                        {file.is_starred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                                    </button>

                                    {/* File Icon */}
                                    <div className="p-6 pb-4 flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className={`w-8 h-8 ${color}`} />
                                        </div>
                                        
                                        {/* File Name */}
                                        <h3 className="text-sm font-bold text-slate-900 text-center truncate w-full mb-1" title={file.name}>
                                            {file.name}
                                        </h3>
                                        
                                        {/* File Type */}
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                            {file.type.split('/').pop() || 'File'}
                                        </p>
                                    </div>

                                    {/* File Info */}
                                    <div className="px-4 pb-4 mt-auto">
                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                                            <span className="font-medium">{formatFileSize(file.size)}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(file.created_at)}
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between">
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                                                file.status === 'ready' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' :
                                                file.status === 'processing' ? 'border-blue-100 bg-blue-50 text-blue-600' :
                                                'border-rose-100 bg-rose-50 text-rose-600'
                                            }`}>
                                                {file.status === 'ready' && <CheckCircle2 className="w-3 h-3" />}
                                                {file.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                                                {file.status === 'error' && <AlertCircle className="w-3 h-3" />}
                                                {file.status}
                                            </div>

                                            {/* Actions Dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                    <DropdownMenuItem onClick={() => window.open(file.url, '_blank')} className="rounded-lg">
                                                        <Eye className="w-4 h-4 mr-2" /> Preview
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => window.open(file.url, '_blank')} className="rounded-lg">
                                                        <Download className="w-4 h-4 mr-2" /> Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleStar(file.id)} className="rounded-lg">
                                                        {file.is_starred ? <StarOff className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                                                        {file.is_starred ? 'Unstar' : 'Star'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(file.id)} className="text-rose-600 focus:text-rose-600 rounded-lg">
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                /* List View */
                <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* List Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-1 flex items-center">
                            <button
                                onClick={selectAll}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedFiles.length === filteredFiles.length ? 'bg-[#0E50F6] border-[#0E50F6]' : 'border-slate-300'}`}
                            >
                                {selectedFiles.length === filteredFiles.length && <Check className="w-2.5 h-2.5 text-white" />}
                            </button>
                        </div>
                        <div className="col-span-5">Name</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Size</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* List Items */}
                    <AnimatePresence>
                        {filteredFiles.map((file, index) => {
                            const { Icon, color, bg } = getFileIcon(file.type);
                            return (
                                <motion.div
                                    key={file.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 hover:bg-blue-50/50 transition-colors items-center ${selectedFiles.includes(file.id) ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="col-span-1">
                                        <button
                                            onClick={() => toggleSelect(file.id)}
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedFiles.includes(file.id) ? 'bg-[#0E50F6] border-[#0E50F6]' : 'border-slate-300'}`}
                                        >
                                            {selectedFiles.includes(file.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                        </button>
                                    </div>
                                    <div className="col-span-5 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                                            <p className="text-xs text-slate-400">{formatDate(file.created_at)}</p>
                                        </div>
                                        {file.is_starred && <Star className="w-4 h-4 text-amber-500 fill-current shrink-0" />}
                                    </div>
                                    <div className="col-span-2 text-sm text-slate-500 font-medium uppercase">
                                        {file.type.split('/').pop() || 'File'}
                                    </div>
                                    <div className="col-span-2 text-sm text-slate-500 font-medium">
                                        {formatFileSize(file.size)}
                                    </div>
                                    <div className="col-span-1">
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            file.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                                            file.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                                            'bg-rose-50 text-rose-600'
                                        }`}>
                                            {file.status}
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => window.open(file.url, '_blank')}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0E50F6] transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Results Count */}
            {!loading && filteredFiles.length > 0 && (
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-400 font-medium">
                        Showing {filteredFiles.length} of {files.length} files
                    </p>
                </div>
            )}
        </div>
    );
}
