import {
    TrendingUp,
    Database,
    Zap,
    Activity,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
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
    AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
    trend: string;
    trendType: 'up' | 'down';
    icon: any;
    subtext: string;
}

interface StatCardProps {
    title: string;
    value: string;
    unit?: string;
    trend: string;
    trendType: 'up' | 'down' | 'neutral';
    icon: any;
    subtext: string;
}

function StatCard({ title, value, unit, trend, trendType, icon: Icon, subtext }: StatCardProps) {
    return (
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full ring-1 ring-slate-100/50">
            <div className="flex items-center justify-between mb-8">
                <p className="text-[13px] font-semibold text-slate-500">{title}</p>
                <Icon className="w-5 h-5 text-slate-300 stroke-[1.5]" />
            </div>
            <div className="flex items-end justify-between mt-auto">
                <div className="flex items-baseline gap-1.5">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
                    {unit && <span className="text-[11px] font-medium text-slate-400 mb-1">{unit}</span>}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${trendType === 'up' ? 'bg-emerald-50 text-emerald-600' :
                            trendType === 'down' ? 'bg-red-50 text-red-600' :
                                'bg-orange-50 text-orange-600'
                        }`}>
                        {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
                            trendType === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                        {trend}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{subtext}</span>
                </div>
            </div>
        </div>
    );
}

function IntelligenceCard({ title, subtitle, status, statusDesc, experiments, flow, icon: Icon, color }: any) {
    return (
        <div className="bg-white border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col h-full ring-1 ring-primary/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${color === 'cyan' ? 'bg-cyan-50' : 'bg-emerald-50'} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${color === 'cyan' ? 'text-cyan-600' : 'text-emerald-600'}`} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-1">
                            {title}
                            <div className="w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-bold">i</div>
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-full flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                        <span className="text-[10px] font-bold text-slate-300">0 Active</span>
                    </div>
                    <RefreshCw className="w-4 h-4 text-slate-400 cursor-pointer hover:rotate-180 transition-transform duration-500" />
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{status}</h2>
                    <span className="text-sm font-medium text-slate-400">{statusDesc}</span>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Experiment Velocity</span>
                    <span className="text-emerald-500">{experiments}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Pipeline Flow</span>
                    <span className="text-blue-500">{flow}</span>
                </div>
            </div>

            <div className="mt-auto py-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-50 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <p className="text-xs text-slate-500 font-medium tracking-tight">
                    Pipeline is clear. Ready to ingest new datasets.
                </p>
            </div>
        </div>
    );
}

function OptimizationCard({ title, subtitle, message, advice, icon: Icon }: any) {
    return (
        <div className="bg-white border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col h-full ring-1 ring-primary/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-1">
                            {title}
                            <div className="w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-bold">i</div>
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                    </div>
                </div>
                <RefreshCw className="w-4 h-4 text-slate-400 cursor-pointer hover:rotate-180 transition-transform duration-500" />
            </div>

            <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-5 mb-6">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {message}
                </p>
            </div>

            <div className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                    {advice}
                </p>
            </div>
        </div>
    );
}

function FeatureCard({ title, subtitle, badge, icon: Icon, color }: any) {
    return (
        <div className={`bg-white border ${color === 'cyan' ? 'border-cyan-100' : 'border-purple-100'} rounded-3xl p-6 shadow-sm group hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${color === 'cyan' ? 'bg-cyan-50' : 'bg-purple-50'} flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${color === 'cyan' ? 'text-cyan-600' : 'text-purple-600'}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-4">{subtitle}</p>

            <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold text-white ${color === 'cyan' ? 'bg-purple-500/80' : 'bg-purple-500/80'}`}>
                {badge}
            </span>
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
    console.log("DataIQ: OverviewPage rendering...");
    return (
        <div className="max-w-[1600px] mx-auto animate-slide-up">
            {/* Welcome Header */}
            <div className="flex flex-row items-start justify-between gap-6 mb-12">
                <div className="text-left py-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                        Welcome John
                    </h1>
                    <p className="text-slate-500 text-base font-medium">
                        Manage your patients and their account permissions here.
                    </p>
                </div>
                <div className="flex items-center pt-1">
                    <div className="flex items-stretch shadow-md rounded-lg overflow-hidden group hover:opacity-90 transition-opacity">
                        <Button className="rounded-none bg-[#1d70b8] text-white font-semibold px-5 h-12 border-r border-white/10 text-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            New Record
                        </Button>
                        <Button className="rounded-none bg-[#1d70b8] text-white px-3 h-12">
                            <ChevronDown className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-14">
                <StatCard
                    title="Avg. Consultation Time"
                    value="64"
                    unit="mins"
                    trend="24%"
                    trendType="up"
                    icon={Clock}
                    subtext="vs last month"
                />
                <StatCard
                    title="Patient Avg. Stay"
                    value="4.3"
                    unit="days"
                    trend="54%"
                    trendType="down"
                    icon={Users}
                    subtext="vs last month"
                />
                <StatCard
                    title="Pending Reports"
                    value="54"
                    trend="79%"
                    trendType="up"
                    icon={ClipboardPen}
                    subtext="vs last month"
                />
                <StatCard
                    title="Overdue Tasks"
                    value="7"
                    trend="32%"
                    trendType="up"
                    icon={AlertCircle}
                    subtext="vs last month"
                />
                <StatCard
                    title="Automations"
                    value="12"
                    trend="-1"
                    trendType="neutral"
                    icon={Bot}
                    subtext="Limit"
                />
            </div>

            {/* Dashboard Grid Row 1: IQ Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <IntelligenceCard
                    title="Predictive Intelligence"
                    subtitle="Operational Forecast"
                    status="Standby"
                    statusDesc="System Ready"
                    experiments="0%"
                    flow="100%"
                    icon={Telescope}
                    color="cyan"
                />
                <OptimizationCard
                    title="Optimization Opportunity"
                    subtitle="Detected Limiter"
                    message="High query count may indicate inefficient queries or a large dataset."
                    advice="Optimize queries by reindexing, redefining queries, and indexing columns used in WHERE and JOIN clauses."
                    icon={CheckCircle2}
                />
            </div>

            {/* Dashboard Grid Row 2: Recent Data & Features */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Table Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-border/50 rounded-[2rem] p-8 shadow-sm ring-1 ring-primary/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                    <TableIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Recent Datasets</h2>
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
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 p-4">Dataset Name</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 p-4 text-center">Source</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 p-4 text-center">Row Count</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 p-4 text-center">Status</TableHead>
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
                                                    dataset.status === 'Processing' ? 'text-blue-500 animate-pulse' : 'text-amber-500'
                                                    }`} />
                                                <span className="text-xs font-bold">{dataset.status}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl border border-dashed border-primary/20">
                            View All Datasets
                        </Button>
                    </div>
                </div>

                {/* Spotlight Sidebar */}
                <div className="space-y-8">
                    <FeatureCard
                        title="Medical Device Streams"
                        subtitle="Real-time IoT monitoring"
                        badge="Pro Feature"
                        icon={Radio}
                        color="cyan"
                    />
                    <FeatureCard
                        title="Data Anonymization"
                        subtitle="PII/PHI detection pipeline"
                        badge="Enterprise"
                        icon={ShieldCheck}
                        color="purple"
                    />
                </div>
            </div>
        </div>
    );
}
