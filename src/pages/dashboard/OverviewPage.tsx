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
    AlertTriangle
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
        <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group ring-1 ring-primary/5">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trendType === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                    {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">{value}</h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtext}</span>
                </div>
            </div>
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="text-left">
                    <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
                        Welcome <span className="text-primary italic">John</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Manage your data sources and AI insights from one central command center.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="rounded-lg bg-primary text-white font-bold px-6 h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Dataset
                    </Button>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                    title="System Latency"
                    value="142ms"
                    trend="8%"
                    trendType="down"
                    icon={TrendingUp}
                    subtext="average speed"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Table Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/90 backdrop-blur-sm border border-border/50 rounded-[2rem] p-8 shadow-sm">
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

                {/* Sidebar Widgets */}
                <div className="space-y-8">
                    {/* Analysis Widget */}
                    <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
                        <h2 className="text-xl font-bold tracking-tight mb-2">Automated Insights</h2>
                        <p className="text-sm text-muted-foreground/80 mb-6 font-medium leading-relaxed">
                            Your data pipelines are healthy. 4 new anomalies were detected in Global Sales.
                        </p>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-primary/5 shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">A{i}</div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Outlier Detected</p>
                                        <p className="text-[10px] text-muted-foreground">In Dataset "Marketing_Q4"</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 ml-auto text-primary opacity-40" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Sessions Widget */}
                    <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold tracking-tight">System Sessions</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-border/30 pb-3">
                                <span className="text-xs font-medium text-muted-foreground">Active Users</span>
                                <span className="text-sm font-bold">1,204</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Response Time</span>
                                <span className="text-sm font-bold text-primary">24ms</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottlenecks Widget */}
                    <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-8 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg font-bold tracking-tight text-red-900">Bottlenecks</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-white/60 p-3 rounded-2xl border border-red-200/50 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-red-800">S3 Connector Delay</span>
                                <span className="text-[9px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">High</span>
                            </div>
                            <div className="bg-white/60 p-3 rounded-2xl border border-red-200/50 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-red-800">BigQuery Auth</span>
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Med</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Connect Widget */}
                    <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold tracking-tight">System Health</h2>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">Operational</Badge>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-muted-foreground">Database Sync</span>
                                <span className="text-primary">99.9%</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                <div className="w-[99.9%] h-full bg-primary rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-muted-foreground">AI Queue</span>
                                <span className="text-primary">Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
