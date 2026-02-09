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
    ArrowRight
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

function StatCard({ title, value, trend, trendType, icon: Icon, subtext }: StatCardProps) {
    return (
        <div className="bg-white border border-border/40 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider truncate">{title}</p>
            </div>
            <div className="flex items-end justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{value}</h3>
                    <span className="text-[9px] font-bold text-slate-400 truncate opacity-70 mb-0.5">{subtext}</span>
                </div>
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0 mb-0.5 ${trendType === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {trendType === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                    {trend}
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="text-left">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome John
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                        Manage your data sources and AI insights from one central command center.
                    </p>
                </div>
                <div className="flex items-center">
                    <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden group hover:opacity-90 transition-opacity">
                        <Button className="rounded-none bg-[#0277bd] text-white font-medium px-4 h-10 border-r border-white/10">
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            New Record
                        </Button>
                        <Button className="rounded-none bg-[#0277bd] text-white px-2 h-10">
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <StatCard
                    title="Total Rows Processed"
                    value="182.4M"
                    trend="24%"
                    trendType="up"
                    icon={Database}
                    subtext="vs last month"
                />
                <StatCard
                    title="AI Insights Generated"
                    value="1,402"
                    trend="54%"
                    trendType="up"
                    icon={Zap}
                    subtext="vs last month"
                />
                <StatCard
                    title="Active Connectors"
                    value="12"
                    trend="12%"
                    trendType="up"
                    icon={Activity}
                    subtext="active syncing"
                />
                <StatCard
                    title="Automations"
                    value="12"
                    trend="-1"
                    trendType="down"
                    icon={Bot}
                    subtext="Limit"
                />
                <StatCard
                    title="System Latency"
                    value="142ms"
                    trend="8%"
                    trendType="down"
                    icon={TrendingUp}
                    subtext="average speed"
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
