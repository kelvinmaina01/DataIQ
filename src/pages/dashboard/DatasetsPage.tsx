import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, setSupabaseIdentity } from '../../../backend/supabase/supabaseClient';
import { auth } from '../../lib/firebase';
import {
    Database,
    Search,
    Filter,
    Download,
    Trash2,
    MoreVertical,
    FileText,
    Clock,
    Box,
    RefreshCw,
    Plus,
    ChevronDown,
    LayoutGrid,
    List,
    Activity,
    HardDrive,
    Calendar,
    AlertCircle,
    FileStack,
    ShieldCheck,
    CheckCircle2,
    BarChart4,
    Upload,
    Cloud
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

interface Dataset {
    id: string;
    name: string;
    url: string;
    row_count: number;
    column_count: number;
    quality_score: number;
    grade: string;
    domain: string;
    status: string;
    method: string;
    file_size: number;
    created_at: string;
}

export function DatasetsPage() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [showListing, setShowListing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [domainFilter, setDomainFilter] = useState('All Domains');
    const [sortOrder, setSortOrder] = useState('Newest First');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDatasets();
    }, []);

    const fetchDatasets = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);

            // Activate the identity bridge for RLS - REQUIRED for reading data
            await setSupabaseIdentity(user.uid);

            const { data, error } = await supabase
                .from('datasets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDatasets(data || []);
        } catch (error: any) {
            console.error('Error fetching datasets:', error);
            toast.error('Failed to load datasets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this research dataset? This cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('datasets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setDatasets(prev => prev.filter(d => d.id !== id));
            toast.success('Dataset purged successfully');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error('Failed to delete dataset');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredDatasets = datasets.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.domain?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDomain = domainFilter === 'All Domains' || d.domain === domainFilter;
        return matchesSearch && matchesDomain;
    });

    const totalRows = datasets.reduce((acc, curr) => acc + curr.row_count, 0);
    const totalStorage = datasets.reduce((acc, curr) => acc + curr.file_size, 0);
    const healthVerified = datasets.filter(d => d.quality_score > 80).length;

    if (!showListing) {
        return (
            <div className="min-h-[calc(100vh-160px)] w-full flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-6xl aspect-[21/9] rounded-[3rem] shadow-2xl overflow-hidden relative group flex flex-col justify-center px-12 sm:px-24 border border-white/20"
                    style={{
                        background: 'linear-gradient(135deg, #00D2FF 0%, #0E50F6 50%, #9D50BB 100%)'
                    }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_70%)]" />

                    {/* Circular Revolving Icons */}
                    <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[400px] h-[400px] hidden lg:block pointer-events-none">
                        <motion.div
                            className="relative w-full h-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        >
                            {[
                                { Icon: Database, color: 'text-emerald-400', angle: 0 },
                                { Icon: FileText, color: 'text-orange-400', angle: 72 },
                                { Icon: BarChart4, color: 'text-amber-400', angle: 144 },
                                { Icon: ShieldCheck, color: 'text-rose-400', angle: 216 },
                                { Icon: Cloud, color: 'text-cyan-300', angle: 288 },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl hover:bg-white/20 transition-colors"
                                    style={{
                                        left: `calc(50% + ${Math.cos((item.angle * Math.PI) / 180) * 160}px - 32px)`,
                                        top: `calc(50% + ${Math.sin((item.angle * Math.PI) / 180) * 160}px - 32px)`,
                                    }}
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                >
                                    <item.Icon className={`w-8 h-8 ${item.color}`} strokeWidth={1.5} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    <div className="relative z-20 max-w-2xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest mb-8 shadow-lg w-fit">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,211,238,1)]" />
                            Start Your Journey
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-md">
                            Transform raw data into <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">scientific breakthroughs.</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-blue-50/90 font-medium mb-10 leading-relaxed max-w-lg">
                            Upload your datasets and let our AI-powered engine handle the heavy lifting. From quality checks to insights discovery—all automated.
                        </p>

                        {/* CTA Button */}
                        <Button
                            onClick={() => setShowListing(true)}
                            className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-300 h-14 px-8 rounded-full font-bold text-lg shadow-[0_8px_30px_rgba(0,0,0,0.1)] group"
                        >
                            Explore Your Datasets
                            <ChevronDown className="ml-2 w-5 h-5 group-hover:rotate-[-90deg] transition-transform duration-300" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 w-full border-b border-slate-50 pb-8">
                <div className="text-left">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Datasets</h1>
                    <p className="text-slate-500 font-medium mt-1 text-base italic-none">
                        Manage and explore all your <span className="text-[#0E50F6] font-bold">uploaded datasets</span>
                    </p>
                </div>

                <div className="flex items-center gap-3 md:ml-auto shrink-0">
                    <Button
                        variant="outline"
                        onClick={fetchDatasets}
                        className="rounded-xl border-slate-200 hover:bg-slate-50 h-10 w-10 p-0 shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={() => navigate('/dashboard/ingestion')}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5 h-10 font-bold shadow-md shadow-primary/20 gap-2 shrink-0 whitespace-nowrap transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Upload New</span>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Datasets', value: datasets.length, icon: Database, color: 'text-[#0E50F6]', bg: 'bg-blue-50' },
                    { label: 'Total Rows', value: totalRows.toLocaleString(), icon: BarChart4, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'Total Storage', value: formatFileSize(totalStorage), icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Health Verified', value: healthVerified, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex flex-row items-center justify-between h-full group top-aligned-stats"
                    >
                        <div className="flex flex-col gap-2">
                            <h4 className="text-[13px] font-bold text-slate-500 tracking-wider whitespace-nowrap opacity-60 lowercase">{stat.label}</h4>
                            <p className="text-3xl font-bold text-slate-900 tracking-tighter">{stat.value}</p>
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-all duration-300 group-hover:scale-110 shadow-inner`}>
                            <stat.icon className="w-7 h-7 stroke-[1.5]" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-row gap-3 items-center justify-between mb-12">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0E50F6]" />
                    <Input
                        placeholder="Search datasets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 bg-slate-50/30 border-[#0E50F6]/30 focus:border-[#0E50F6] rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-slate-600 font-semibold placeholder:text-slate-400 w-full"
                    />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Select value={domainFilter} onValueChange={setDomainFilter}>
                        <SelectTrigger className="w-[130px] h-9 rounded-xl border-slate-200 bg-white font-bold text-xs text-slate-600 hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="All Domains" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="All Domains">All Domains</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[130px] h-9 rounded-xl border-slate-200 bg-white font-bold text-xs text-slate-600 hover:border-primary/50 transition-colors">
                            <SelectValue placeholder="Newest First" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="Newest First">Newest First</SelectItem>
                            <SelectItem value="Oldest First">Oldest First</SelectItem>
                            <SelectItem value="Highest Quality">Highest Quality</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* Datasets Grid */}
            {loading ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#0E50F6] rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold text-sm">Loading library...</p>
                </div>
            ) : filteredDatasets.length === 0 ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        <Box className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Datasets Found</h3>
                    <p className="text-slate-500 max-w-xs text-sm font-medium">
                        {searchQuery ? `No results for "${searchQuery}"` : "Upload a dataset to get started."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredDatasets.map((dataset) => (
                            <motion.div
                                key={dataset.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col p-6 group relative overflow-hidden"
                            >
                                {/* Selection Border Effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#0E50F6] transition-colors duration-300 rounded-l-2xl"></div>

                                {/* Top Row: Icon + Status */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-cyan-50 rounded-xl">
                                        <Database className="w-6 h-6 text-cyan-500" />
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${dataset.status === 'Ready' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' :
                                        dataset.status === 'Processing' ? 'border-blue-100 bg-blue-50 text-blue-600' : 'border-amber-100 bg-amber-50 text-amber-600'
                                        }`}>
                                        {dataset.status === 'Processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                                        {dataset.status === 'Ready' && <CheckCircle2 className="w-3 h-3" />}
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{dataset.status}</span>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-wider">
                                        {dataset.domain || 'General'}
                                    </span>
                                    {new Date(dataset.created_at).getTime() > Date.now() - 604800000 && (
                                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider">
                                            New
                                        </span>
                                    )}
                                </div>

                                {/* Title & Info */}
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1 truncate" title={dataset.name}>{dataset.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[200px]">{dataset.name}.csv</span>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6 relative">
                                    {/* Vertical Divider */}
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100"></div>

                                    <div className="text-center md:text-left pl-2">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1 lowercase">Rows</p>
                                        <p className="text-lg font-bold text-slate-900 tracking-tight">{dataset.row_count?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="text-center md:text-right pr-2">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1 lowercase">Cols</p>
                                        <p className="text-lg font-bold text-slate-900 tracking-tight">{dataset.column_count || '0'}</p>
                                    </div>
                                    <div className="col-span-2 text-center pt-4 border-t border-slate-50 mt-2">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1 lowercase">Quality Score</p>
                                        <p className={`text-lg font-bold tracking-tight ${(dataset.quality_score || 0) > 80 ? 'text-emerald-500' :
                                            (dataset.quality_score || 0) > 50 ? 'text-amber-500' : 'text-slate-300'
                                            }`}>
                                            {dataset.quality_score ? `${dataset.quality_score}%` : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-slate-100 font-bold text-[10px]">
                                        {formatFileSize(dataset.file_size)}
                                    </Badge>
                                </div>

                                {/* Actions Dropdown */}
                                <div className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => window.open(dataset.url)} className="text-xs font-bold text-slate-600 rounded-lg cursor-pointer">
                                                <Download className="w-3.5 h-3.5 mr-2" />
                                                Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(dataset.id)} className="text-xs font-bold text-rose-600 focus:text-rose-600 rounded-lg cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

// Helper for quality score display if needed
function formattedQuality(score: number) {
    return score + "%";
}
