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
    Cloud,
    ArrowRight
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
import { getConnectorLogo } from '../../lib/connectors';

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
                .eq('user_id', user.uid)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter to only show manual uploads (not database/warehouse connections)
            // Manual uploads have methods like: 'CSV', 'Excel', 'JSON', 'PDF', 'Word'
            // Database/warehouse methods look like: 'Database: postgres', 'Database: snowflake'
            const manualUploads = (data || []).filter((dataset: Dataset) => {
                const method = dataset.method?.toLowerCase() || '';
                // Exclude anything with 'database' or 'warehouse' in the method
                return !method.includes('database') && !method.includes('warehouse');
            });

            setDatasets(manualUploads);
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

    // Banner removed to show listing directly

    return (
        <div className="animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-row items-center justify-between w-full p-0 m-0 border-none mb-8">
                <div className="text-left flex flex-col p-0 m-0">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight p-0 m-0 leading-none">Datasets</h1>
                    <p className="text-slate-500 font-medium text-xs md:text-sm p-0 m-0 mt-0.5">
                        Manage and explore all your <span className="text-[#0E50F6] font-bold">uploaded datasets</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 p-0 m-0">
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
                    { label: 'total datasets', value: datasets.length, icon: Database, color: 'text-[#0E50F6]', bg: 'bg-blue-50' },
                    { label: 'total rows', value: totalRows.toLocaleString(), icon: BarChart4, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'total storage', value: formatFileSize(totalStorage), icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'health verified', value: healthVerified, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-[#0E50F6]/40 transition-all flex flex-row items-center justify-between h-full group top-aligned-stats"
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
                                className="bg-white rounded-[24px] border border-blue-100 hover:border-[#0E50F6]/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col p-6 group relative overflow-hidden"
                            >
                                {/* Selection Border Effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#0E50F6] transition-colors duration-300 rounded-l-2xl"></div>

                                {/* Top Row: Icon + Status */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
                                        {(() => {
                                            const logo = getConnectorLogo(dataset.method);
                                            if (logo) {
                                                return (
                                                    <img
                                                        src={logo}
                                                        alt={dataset.method}
                                                        className="w-6 h-6 object-contain"
                                                        onError={(e) => {
                                                            (e.target as any).style.display = 'none';
                                                            (e.target as any).nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                );
                                            }
                                            return <Database className="w-6 h-6 text-[#0E50F6]" />;
                                        })()}
                                        <Database className="w-6 h-6 text-[#0E50F6] hidden" />
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
                                    <h3 className="text-xl font-bold text-[#0E50F6] mb-1 truncate" title={dataset.name}>{dataset.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                        <FileText className="w-3.5 h-3.5 text-[#0E50F6]/70" />
                                        <span className="truncate max-w-[200px]">{dataset.name}.csv</span>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6 relative">
                                    {/* Vertical Divider */}
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100"></div>

                                    <div className="text-center md:text-left pl-2">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1 !lowercase">rows</p>
                                        <p className="text-lg font-bold text-red-600 tracking-tight">{dataset.row_count?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="text-center md:text-right pr-2">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1 !lowercase">cols</p>
                                        <p className="text-lg font-bold text-red-600 tracking-tight">{dataset.column_count || '0'}</p>
                                    </div>
                                    <div className="col-span-2 text-center pt-4 border-t border-slate-50 mt-2">
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1 !lowercase">quality score</p>
                                        <p className={`text-lg font-bold tracking-tight ${(dataset.quality_score || 0) > 80 ? 'text-emerald-500' :
                                            (dataset.quality_score || 0) > 50 ? 'text-amber-500' : 'text-slate-300'
                                            }`}>
                                            {dataset.quality_score ? `${dataset.quality_score}%` : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Explore Button */}
                                <Button
                                    variant="ghost"
                                    className="w-full mb-6 text-[#0E50F6] font-bold hover:bg-blue-50 group/explore border border-blue-100 rounded-xl"
                                    onClick={() => navigate(`/dashboard/datasets/${dataset.id}`)}
                                >
                                    Explore <ArrowRight className="ml-2 w-4 h-4 group-hover/explore:translate-x-1 transition-transform" />
                                </Button>

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

                                {/* Quick Actions */}
                                <div className="absolute top-4 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => window.open(dataset.url)}
                                        className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-[#0E50F6] hover:border-blue-200 transition-all hover:scale-110"
                                        title="Download"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dataset.id)}
                                        className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all hover:scale-110"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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
