import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
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

function UsageCard({ title, value, max, unit, percent, plan, className }: any) {
    return (
        <div className={cn(
            "border border-[#0E50F6]/30 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all flex flex-col h-full group ring-1 ring-[#0E50F6]/5",
            className || "bg-white"
        )}>
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h4>
                <div className="bg-[#0E50F6] text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{plan}</span>
                </div>
            </div>

            <div className="mb-6">
                <p className="text-[15px] font-bold text-slate-400">
                    <span className="text-slate-900">{value}</span> / {max} {unit}
                </p>
            </div>

            <div className="mt-auto">
                <div className="w-full bg-white/50 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <div
                        className="bg-[#0E50F6] h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(14,80,246,0.5)]"
                        style={{ width: `${percent}%` }}
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

const recentDatasets = [
    { name: 'Customer_Churn_Q1.csv', type: 'CSV', rows: '45,203', size: '12.4 MB', date: 'Dec 15, 2026', status: 'Ready' },
    { name: 'Marketing_Campaign_Alpha', type: 'SQL', rows: '1.2M', size: 'N/A', date: 'Dec 14, 2026', status: 'Processing' },
    { name: 'Inventory_Logs_Sync_01', type: 'JSON', rows: '678,921', size: '45.1 MB', date: 'Dec 14, 2026', status: 'Ready' },
    { name: 'User_Behavior_Tracking', type: 'BigQuery', rows: '15.4M', size: 'N/A', date: 'Dec 13, 2026', status: 'Ready' },
    { name: 'Sales_Performance_Global', type: 'CSV', rows: '89,450', size: '22.8 MB', date: 'Dec 12, 2026', status: 'Warning' },
];

export function OverviewPage() {
    const [user, setUser] = useState<User | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            }
        });
        console.log("DataIQ: OverviewPage mounted successfully.");
        return () => unsubscribe();
    }, []);

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
                    className="bg-[#F0F4FF]"
                />
                <UsageCard
                    title="AI Ops"
                    value="0.0"
                    max="10000"
                    unit="req"
                    percent={0}
                    plan="Pro"
                    className="bg-[#EEF2FF]"
                />
                <UsageCard
                    title="Datasets"
                    value="11.0"
                    max="100"
                    unit="files"
                    percent={11}
                    plan="Pro"
                    className="bg-[#F0F9FF]"
                />
                <UsageCard
                    title="Models"
                    value="0"
                    max="50"
                    unit="models"
                    percent={0}
                    plan="Pro"
                    className="bg-[#F5F3FF]"
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
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] p-4">Dataset Name</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] p-4 text-center">Source</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] p-4 text-center">Row Count</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-[#0E50F6] p-4 text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentDatasets.map((dataset, idx) => (
                                    <TableRow key={idx} className="group border-b border-border/20 last:border-0 hover:bg-primary/[0.02] transition-colors rounded-2xl">
                                        <TableCell className="p-4">
                                            <div>
                                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{dataset.name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground/70">{dataset.date}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 text-center">
                                            <Badge variant="outline" className="rounded-lg bg-secondary/50 font-bold text-[10px] px-2 py-0.5">{dataset.type}</Badge>
                                        </TableCell>
                                        <TableCell className="p-4 text-center">
                                            <p className="text-sm font-bold text-foreground/80 tracking-tight">{dataset.rows}</p>
                                        </TableCell>
                                        <TableCell className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Circle className={`w-2 h-2 fill-current ${dataset.status === 'Ready' ? 'text-green-500' :
                                                    dataset.status === 'Processing' ? 'text-[#0E50F6] animate-pulse' : 'text-amber-500'
                                                    }`} />
                                                <span className="text-xs font-bold">{dataset.status}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-[#0E50F6] hover:bg-[#0E50F6]/5 rounded-xl border border-dashed border-[#0E50F6]/20">
                            View All Datasets
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
