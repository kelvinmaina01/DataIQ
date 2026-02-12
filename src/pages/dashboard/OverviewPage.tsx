import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { supabase } from '../../../backend/supabase/supabaseClient';
import {
    TrendingUp,
    Database,
    Zap,
    Activity,
    Plus,
    MoreVertical,
    Table as TableIcon,
    Circle,
    AlertTriangle,
    ChevronDown,
    Bot,
    Telescope,
    CheckCircle2,
    RefreshCw,
    Radio,
    ShieldCheck,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Users,
    ClipboardPen,
    AlertCircle,
    Crown
} from 'lucide-react';
import { getConnectorLogo } from '../../lib/connectors';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../components/ui/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../components/ui/table';

interface StatCardProps {
    title: string;
    value: string;
    unit?: string;
    trend: string;
    trendType: 'up' | 'down' | 'neutral';
    icon: any;
    subtext: string;
    className?: string;
}

function StatCard({ title, value, unit, trend, trendType, icon: Icon, subtext, className }: StatCardProps) {
    if (!Icon) {
        console.warn(`StatCard: Icon for "${title}" is undefined. Using AlertCircle fallback.`);
    }
    const SafeIcon = Icon || AlertCircle;
    const isRed = className?.includes('bg-[#FFF1F2]');

    return (
        <div className={cn(
            "border border-[#0E50F6]/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full group",
            className || "bg-white"
        )}>
            <div className="flex items-center justify-between mb-8">
                <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h4>
                <SafeIcon className={cn("w-5 h-5 stroke-[1.5]", isRed ? "text-rose-400" : "text-slate-400/60")} />
            </div>

            <div className="flex items-end justify-between mt-auto">
                <div className="flex items-baseline gap-1">
                    <span className={cn("text-4xl font-bold tracking-tighter", isRed ? "text-rose-600" : "text-[#0E50F6]")}>{value}</span>
                    {unit && <span className="text-[11px] font-bold text-slate-400 mb-1.5">{unit}</span>}
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold",
                        trendType === 'up' ? 'bg-emerald-50 text-emerald-600' :
                            trendType === 'down' ? 'bg-red-50 text-red-600' :
                                'bg-orange-50 text-orange-600'
                    )}>
                        {trendType === 'up' && <ArrowUpRight className="w-3 h-3" />}
                        {trendType === 'down' && <ArrowDownRight className="w-3 h-3" />}
                        {trend}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400/80 tracking-wide text-right">
                        {subtext}
                    </span>
                </div>
            </div>
        </div>
    );
}

function UsageCard({ title, value, max, unit, percent, plan, className, color = '#0E50F6' }: any) {
    const lightBg = `${color}10`; // 10% opacity

    return (
        <div className={cn(
            "border border-[#0E50F6]/20 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all flex flex-col h-full group ring-1 ring-primary/5",
            className || "bg-white"
        )} style={{ borderColor: `${color}30` }}>
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h4>
                <div className="text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm" style={{ backgroundColor: color }}>
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{plan}</span>
                </div>
            </div>

            <div className="mb-6">
                <div className="text-[15px] font-bold text-slate-400">
                    <span className="text-slate-900">{value}</span> / {max} {unit}
                </div>
            </div>

            <div className="mt-auto">
                <div className="w-full h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/50" style={{ backgroundColor: `${color}05` }}>
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}50`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function IntelligenceCard({ title, subtitle, status, statusDesc, experiments, flow, icon: Icon, priority }: any) {
    const SafeIcon = Icon || AlertCircle;
    const isRed = priority === 'high';
    const brandColor = isRed ? '#ef4444' : '#0E50F6';
    const brandBg = isRed ? 'bg-red-50' : 'bg-[#0E50F6]/10';

    return (
        <div className={cn(
            "bg-white border rounded-[2rem] p-8 shadow-sm flex flex-col h-full ring-1 transition-all hover:shadow-md",
            isRed ? "border-red-400/30 ring-red-500/10" : "border-[#0E50F6]/30 ring-primary/5"
        )}>
            <div className="flex items-start justify-between mb-10">
                <div className="flex gap-4">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", brandBg)}>
                        <SafeIcon className="w-7 h-7" style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold flex items-center gap-2">
                            {title}
                            <div className="w-4 h-4 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-bold cursor-help">i</div>
                        </h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "px-3 py-1 rounded-full flex items-center gap-2 border",
                        isRed ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                    )}>
                        <TrendingUp className={cn("w-3 h-3", isRed ? "text-red-500" : "text-emerald-500")} />
                        <span className={cn("text-[10px] font-bold uppercase", isRed ? "text-red-600" : "text-emerald-600")}>
                            {isRed ? "Priority" : "Active"}
                        </span>
                    </div>
                    <RefreshCw className="w-4 h-4 text-slate-300 cursor-pointer hover:rotate-180 transition-transform duration-700" />
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-1">
                    <h2 className={cn("text-5xl font-bold tracking-tighter", isRed ? "text-red-600" : "text-[#0E50F6]")}>{status}</h2>
                    <span className="text-sm font-bold text-slate-400 uppercase">{statusDesc}</span>
                </div>
            </div>

            <div className="space-y-4 mb-8 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-slate-400">Experiment Velocity</span>
                    <span className={isRed ? "text-red-600" : "text-emerald-600"}>{experiments}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight">
                    <span className="text-slate-400">Pipeline Flow</span>
                    <span style={{ color: brandColor }}>{flow}</span>
                </div>
            </div>

            <div className="mt-auto py-5 border-t border-slate-100 flex items-center gap-3">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", brandBg)}>
                    <Zap className="w-4 h-4" style={{ color: brandColor }} />
                </div>
                <p className="text-xs text-slate-500 font-bold tracking-tight">
                    {isRed ? "Critical limiter detected. Ingestion pathing throttled." : "Pipeline is clear. Ready to ingest new datasets."}
                </p>
            </div>
        </div>
    );
}

function OptimizationCard({ title, subtitle, message, advice, icon: Icon, priority }: any) {
    const SafeIcon = Icon || AlertCircle;
    const isRed = priority === 'high';

    return (
        <div className={cn(
            "bg-white border rounded-[2rem] p-8 shadow-sm flex flex-col h-full ring-1 transition-all hover:shadow-md",
            isRed ? "border-red-400/30 ring-red-500/10" : "border-[#0E50F6]/30 ring-primary/5"
        )}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        isRed ? "bg-red-50" : "bg-emerald-50"
                    )}>
                        <SafeIcon className={cn("w-7 h-7", isRed ? "text-red-500" : "text-emerald-600")} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold flex items-center gap-2">
                            {title}
                            <div className="w-4 h-4 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-bold cursor-help">i</div>
                        </h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{subtitle}</p>
                    </div>
                </div>
                <Badge variant="outline" className={cn(
                    "font-bold text-[10px] uppercase px-3 py-1",
                    isRed ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                    {isRed ? "Priority Alert" : "Detected"}
                </Badge>
            </div>

            <p className="text-base font-bold text-slate-900 leading-tight mb-6">{message}</p>

            <div className={cn(
                "mt-auto p-5 rounded-2xl border",
                isRed ? "bg-red-50/30 border-red-100/50" : "bg-emerald-50/30 border-emerald-100/50"
            )}>
                <div className="flex gap-4">
                    {isRed ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                    <p className="text-[13px] text-slate-700 font-bold leading-relaxed">
                        {advice}
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ title, subtitle, badge, metrics, icon: Icon }: any) {
    const SafeIcon = Icon || AlertCircle;
    return (
        <div className="bg-white border border-[#0E50F6]/20 rounded-[2rem] p-8 shadow-sm group hover:shadow-md transition-all ring-1 ring-[#0E50F6]/5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-[1.25rem] bg-[#0E50F6]/10 flex items-center justify-center">
                    <SafeIcon className="w-8 h-8 text-[#0E50F6]" />
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0E50F6]/10 text-[#0E50F6]">
                        {badge}
                    </span>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-[#0E50F6]" />
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">{title}</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">{subtitle}</p>
            </div>

            {metrics && (
                <div className="mt-auto pt-6 border-t border-slate-50 grid grid-cols-2 gap-6">
                    {metrics.map((m: any, i: number) => (
                        <div key={i}>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">{m.label}</p>
                            <p className={`text-xl font-bold tracking-tight ${m.color === 'red' ? 'text-red-500' : m.color === 'green' ? 'text-emerald-500' : 'text-[#0E50F6]'}`}>{m.value}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



export function OverviewPage() {
    const [user, setUser] = useState<User | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [recentDatasets, setRecentDatasets] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchRecentDatasets(currentUser.uid);
            }
        });
        console.log("DataIQ: OverviewPage mounted successfully.");
        return () => unsubscribe();
    }, []);

    const fetchRecentDatasets = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('datasets')
                .select('name, method, row_count, status, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                if (error.message?.includes('AbortError')) return;
                console.error('Error fetching datasets:', error);
                return;
            }

            // Transform data to match table schema
            const formatted = data?.map(dataset => ({
                name: dataset.name,
                type: dataset.method || 'Manual',
                rows: dataset.row_count?.toLocaleString() || '0',
                date: new Date(dataset.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                status: dataset.status || 'Ready'
            })) || [];

            setRecentDatasets(formatted);
        } catch (err) {
            console.error('Failed to fetch datasets:', err);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return "DS";
        const parts = name.split('.');
        const ext = parts.length > 1 ? parts.pop() : "";
        const baseName = parts.join('.');

        const initials = baseName
            .split(/[\s_-]+/)
            .filter(word => word.length > 0)
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3);

        return initials + (ext ? `.${ext.toLowerCase()}` : "");
    };

    const displayName = user?.displayName || user?.email?.split('@')[0] || "User";

    console.log("DataIQ: OverviewPage rendering...");
    console.log("Verified Icons:", {
        Clock: !!Clock, Users: !!Users, ClipboardPen: !!ClipboardPen,
        AlertCircle: !!AlertCircle, Bot: !!Bot, Telescope: !!Telescope,
        CheckCircle2: !!CheckCircle2, Radio: !!Radio, ShieldCheck: !!ShieldCheck
    });

    if (hasError) {
        return (
            <div className="p-10 text-red-600 bg-red-50 rounded-2xl border border-red-200">
                <h2 className="text-xl font-bold mb-2">Overview Page Error</h2>
                <p className="font-mono text-sm">{errorMsg}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">Reload Page</Button>
            </div>
        );
    }
    return (
        <div className="max-w-[1600px] mx-auto animate-slide-up">
            {/* Welcome Header */}
            <div className="flex flex-row items-start justify-between gap-6 mb-12">
                <div className="text-left py-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                        Welcome <span className="text-[#0E50F6]">{displayName}</span>
                    </h1>
                    <p className="text-slate-500 text-lg font-bold">
                        Manage your <span className="text-[#0E50F6]">data intelligence and account permissions</span> here.
                    </p>
                </div>
                <div className="flex items-center pt-1">
                    <div className="flex items-stretch shadow-md rounded-lg overflow-hidden group hover:opacity-90 transition-opacity">
                        <Button className="rounded-none !bg-[#0E50F6] hover:!bg-[#0D44D1] text-white font-semibold px-5 h-12 border-r border-white/10 text-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            New Dataset
                        </Button>
                        <Button className="rounded-none !bg-[#0E50F6] hover:!bg-[#0D44D1] text-white px-3 h-12">
                            <ChevronDown className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Usage & Plan Summary Tier */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <UsageCard
                    title="Storage"
                    value="3.6"
                    max="10240"
                    unit="MB"
                    percent={35}
                    plan="Pro"
                    className="bg-[#F0F7FF]"
                    color="#0E50F6"
                />
                <UsageCard
                    title="AI Ops"
                    value="0.0"
                    max="10000"
                    unit="req"
                    percent={0}
                    plan="Pro"
                    className="bg-[#F5F3FF]"
                    color="#8B5CF6"
                />
                <UsageCard
                    title="Datasets"
                    value="11.0"
                    max="100"
                    unit="files"
                    percent={11}
                    plan="Pro"
                    className="bg-[#ECFDF5]"
                    color="#10B981"
                />
                <UsageCard
                    title="Models"
                    value="0"
                    max="50"
                    unit="models"
                    percent={0}
                    plan="Pro"
                    className="bg-[#FFF1F2]"
                    color="#F43F5E"
                />
            </div>


            {/* Main Content Grid: Table + Sidebar Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Table Section (Left) */}
                <div className="lg:col-span-8">
                    <div className="bg-white border border-[#0E50F6]/30 rounded-[2rem] p-8 shadow-sm ring-1 ring-primary/5 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#0E50F6]/10 rounded-xl">
                                    <TableIcon className="w-5 h-5 text-[#0E50F6]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-[#0E50F6]">Recent Datasets</h2>
                                    <p className="text-xs font-medium text-muted-foreground">Successfully ingested source files</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow className="border-none hover:bg-transparent">
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] px-2 py-4">Dataset Name</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] px-2 py-4 text-center">Source</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] px-2 py-4 text-center text-nowrap">Rows</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] px-2 py-4 text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentDatasets.map((dataset, idx) => (
                                    <TableRow key={idx} className="group border-b border-border/20 last:border-0 hover:bg-primary/[0.02] transition-colors rounded-2xl">
                                        <TableCell className="px-2 py-4">
                                            <div title={dataset.name}>
                                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{getInitials(dataset.name)}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground/70">{dataset.date}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-2 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {(() => {
                                                    const logo = getConnectorLogo(dataset.type);
                                                    if (logo) {
                                                        return (
                                                            <img
                                                                src={logo}
                                                                alt={dataset.type}
                                                                className="w-5 h-5 object-contain"
                                                            />
                                                        );
                                                    }
                                                    return <Badge variant="outline" className="rounded-lg bg-secondary/50 font-bold text-[10px] px-2 py-0.5 truncate max-w-[80px]">{dataset.type}</Badge>;
                                                })()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-2 py-4 text-center">
                                            <p className="text-sm font-bold text-foreground/80 tracking-tight">{dataset.rows}</p>
                                        </TableCell>
                                        <TableCell className="px-2 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Circle className={`w-2 h-2 fill-current ${dataset.status === 'Ready' ? 'text-green-500' :
                                                    dataset.status === 'Processing' ? 'text-[#0E50F6] animate-pulse' : 'text-amber-500'
                                                    }`} />
                                                <span className="text-[10px] font-bold">{dataset.status}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Button
                            variant="ghost"
                            className="w-full mt-6 text-xs font-bold text-[#0E50F6] hover:bg-[#0E50F6]/5 rounded-xl border border-dashed border-[#0E50F6]/20"
                            onClick={() => window.location.href = '/dashboard/ingestion'}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Dataset
                        </Button>
                    </div>
                </div>

                {/* Sidebar Stats (Right) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <StatCard
                        title="Total Rows Processed"
                        value="1.2"
                        unit="M"
                        trend="+12%"
                        trendType="up"
                        icon={Database}
                        subtext="vs last month"
                        className="bg-[#F0F4FF]"
                    />
                    <StatCard
                        title="AI Insights Generated"
                        value="842"
                        trend="+24%"
                        trendType="up"
                        icon={Zap}
                        subtext="vs last month"
                        className="bg-[#F5F3FF]"
                    />
                    <StatCard
                        title="Active Connectors"
                        value="24"
                        trend="Stable"
                        trendType="neutral"
                        icon={Activity}
                        subtext="Live now"
                        className="bg-[#F0FDF4]"
                    />
                    <StatCard
                        title="Automations"
                        value="12"
                        trend="+1"
                        trendType="up"
                        icon={Bot}
                        subtext="New this week"
                        className="bg-[#FFF7ED]"
                    />
                    <StatCard
                        title="Average Latency"
                        value="48"
                        unit="ms"
                        trend="-12ms"
                        trendType="up"
                        icon={Clock}
                        subtext="Optimization active"
                        className="bg-[#FFF1F2]"
                    />
                </div>
            </div>


        </div>
    );
}
