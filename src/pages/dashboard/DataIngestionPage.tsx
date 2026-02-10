import React, { useState, useMemo } from 'react';
import {
    Search,
    Upload,
    Database,
    Cloud,
    HeartPulse,
    Webhook,
    Plus,
    FileText,
    CheckCircle2,
    ChevronRight,
    Table,
    FileCode,
    FileJson,
    Layers,
    BarChart3,
    Share2,
    HardDrive,
    Activity,
    Stethoscope,
    Info,
    History,
    ExternalLink,
    Clock,
    ShieldCheck,
    Lock,
    Fingerprint
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../components/ui/utils';

// Connector types
type Category = 'All' | 'Manual' | 'Databases' | 'Warehouses' | 'Cloud' | 'Health' | 'Webhooks';

interface Connector {
    id: string;
    name: string;
    description: string;
    category: Category;
    icon?: React.ElementType;
    logo?: string;
    status?: 'Connected' | 'New' | 'Available';
    type: string;
}

const CONNECTORS: Connector[] = [
    // Manual Upload (Consolidated)
    { id: 'csv', name: 'CSV File', description: 'Upload quantitative tabular data', category: 'Manual', logo: 'https://cdn-icons-png.flaticon.com/512/28/28842.png', type: 'File', status: 'Available' },
    { id: 'excel', name: 'Excel', description: 'Microsoft Excel spreadsheets (.xlsx, .xls)', category: 'Manual', logo: '/logos/excel.svg', type: 'File', status: 'Available' },
    { id: 'json', name: 'JSON', description: 'Standard data interchange format', category: 'Manual', logo: 'https://cdn.simpleicons.org/json/000000', type: 'File', status: 'Available' },
    { id: 'pdf', name: 'PDF Document', description: 'Qualitative analysis for research papers and reports', category: 'Manual', logo: '/logos/pdf.svg', type: 'File', status: 'Available' },
    { id: 'docs', name: 'Word Docs', description: 'Microsoft Word and plain text documents', category: 'Manual', logo: '/logos/word.svg', type: 'File', status: 'Available' },

    // Databases
    { id: 'postgres', name: 'PostgreSQL', description: 'Connect your Postgres data for instant AI analysis', category: 'Databases', logo: 'https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg', type: 'Database', status: 'Available' },
    { id: 'mysql', name: 'MySQL', description: 'Connect your MySQL data for instant AI analysis', category: 'Databases', logo: 'https://cdn.simpleicons.org/mysql/4479A1', type: 'Database', status: 'Available' },
    { id: 'sqlserver', name: 'SQL Server', description: 'Connect your SqlServer data for instant AI analysis', category: 'Databases', logo: '/logos/sqlserver.svg', type: 'Database', status: 'Available' },
    { id: 'mongodb', name: 'MongoDB', description: 'NoSQL document-based database connection', category: 'Databases', logo: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg', type: 'Database', status: 'Available' },
    { id: 'supabase', name: 'Supabase', description: 'Direct connection to your Supabase projects', category: 'Databases', logo: 'https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg', type: 'Database', status: 'Available' },
    { id: 'vertica', name: 'Vertica', description: 'Enterprise analytics database connection', category: 'Databases', logo: '/logos/vertica.svg', type: 'Database', status: 'Available' },

    // Warehouses
    { id: 'bigquery', name: 'BigQuery', description: 'Connect your BigQuery data for instant AI analysis', category: 'Warehouses', logo: 'https://www.vectorlogo.zone/logos/google_bigquery/google_bigquery-icon.svg', type: 'Data Warehouse', status: 'Available' },
    { id: 'snowflake', name: 'Snowflake', description: 'Connect your Snowflake data for instant AI analysis', category: 'Warehouses', logo: 'https://www.vectorlogo.zone/logos/snowflake/snowflake-icon.svg', type: 'Data Warehouse', status: 'Available' },
    { id: 'databricks', name: 'Databricks', description: 'Unified analytics platform integration', category: 'Warehouses', logo: 'https://www.vectorlogo.zone/logos/databricks/databricks-icon.svg', type: 'Data Warehouse', status: 'Available' },

    // Cloud Sources
    { id: 'gdrive', name: 'Google Drive', description: 'Analyze your Google Drive files and folders', category: 'Cloud', logo: 'https://www.vectorlogo.zone/logos/google_drive/google_drive-icon.svg', type: 'Integration', status: 'Connected' },
    { id: 'gsheets', name: 'Google Sheets', description: 'Live connection to your Google Sheets', category: 'Cloud', logo: 'https://cdn.simpleicons.org/googlesheets/34A853', type: 'Integration', status: 'Connected' },
    { id: 'onedrive', name: 'Microsoft OneDrive', description: 'Analyze your Personal OneDrive files and folders', category: 'Cloud', logo: '/logos/onedrive.svg', type: 'Integration', status: 'New' },
    { id: 'sharepoint', name: 'SharePoint', description: 'Analyze your SharePoint or OneDrive for Business files', category: 'Cloud', logo: '/logos/sharepoint.svg', type: 'Integration', status: 'New' },
    { id: 'gads', name: 'Google Ads', description: 'Analyze your data and manage your campaigns in Google Ads', category: 'Cloud', logo: 'https://www.vectorlogo.zone/logos/google_ads/google_ads-icon.svg', type: 'Integration', status: 'New' },
    { id: 'metaads', name: 'Meta Ads', description: 'Analyze your data and manage your campaigns in Meta Ads', category: 'Cloud', logo: '/logos/meta.svg', type: 'Integration', status: 'New' },

    // Health
    { id: 'apple-health', name: 'Apple Health', description: 'Vitals, activity, and clinical records via HealthKit', category: 'Health', logo: 'https://www.vectorlogo.zone/logos/apple/apple-tile.svg', type: 'Health', status: 'Available' },
    { id: 'fitbit', name: 'Fitbit', description: 'Sleep and activity data via OAuth sync', category: 'Health', logo: 'https://www.vectorlogo.zone/logos/fitbit/fitbit-icon.svg', type: 'Health', status: 'Available' },
    { id: 'oura', name: 'Oura Ring', description: 'Advanced sleep and recovery biometric sync', category: 'Health', logo: '/logos/oura.svg', type: 'Health', status: 'Available' },
    { id: 'dexcom', name: 'Dexcom CGM', description: 'Real-time glucose monitor streaming', category: 'Health', logo: '/logos/dexcom.svg', type: 'Health', status: 'Available' },
    { id: 'epic', name: 'Epic EHR', description: 'SMART on FHIR clinical integration', category: 'Health', logo: '/logos/epic.svg', type: 'Health', status: 'Available' },
    { id: 'cerner', name: 'Oracle Cerner', description: 'Enterprise medical record synchronization', category: 'Health', logo: 'https://www.vectorlogo.zone/logos/oracle/oracle-icon.svg', type: 'Health', status: 'Available' },

    // Webhooks
    { id: 'iot-webhooks', name: 'IoT Stream', description: 'Real-time data via secure webhook endpoints', category: 'Webhooks', logo: '/logos/iot.svg', type: 'Webhook', status: 'Available' },
    { id: 'wearable-stream', name: 'Wearable Webhook', description: 'Direct stream from custom wearable devices', category: 'Webhooks', icon: Webhook, type: 'Webhook', status: 'Available' },
];

export function DataIngestionPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<Category>('All');
    const [showConnectors, setShowConnectors] = useState(false);

    const filteredConnectors = useMemo(() => {
        return CONNECTORS.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === 'All' || c.category === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [searchQuery, activeTab]);

    const categories: Category[] = ['All', 'Manual', 'Databases', 'Warehouses', 'Cloud', 'Health', 'Webhooks'];

    if (!showConnectors) {
        return (
            <div className="min-h-[calc(100vh-160px)] w-full flex items-center justify-center p-4">
                <div
                    className="w-full max-w-6xl aspect-[21/9] rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(14,80,246,0.3)] overflow-hidden relative group animate-fade-in flex flex-col justify-center px-12 sm:px-24 border border-white/20"
                    style={{
                        background: 'linear-gradient(135deg, #00D2FF 0%, #0E50F6 50%, #9D50BB 100%)'
                    }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_70%)]" />

                    {/* Orbiting Connector Logos - Scattered/Organic System */}
                    <div className="absolute -right-20 lg:right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center pointer-events-none scale-[0.65] lg:scale-100 origin-right transition-all duration-700" style={{ width: '600px', height: '600px' }}>
                        {/* Glow center */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center z-10 shadow-[0_0_80px_rgba(255,255,255,0.3)] animate-pulse-soft">
                            <Database className="size-10 text-white" strokeWidth={1.5} />
                        </div>

                        {/* Orbit ring 1 (outer) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />

                        {/* Orbit ring 2 (inner) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[240px] rounded-full border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]" />

                        {/* Outer orbit - 8 logos */}
                        <div className="absolute top-1/2 left-1/2 size-[400px] animate-[orbitSpin_50s_linear_infinite]">
                            {[
                                { src: 'https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg', alt: 'PostgreSQL', angle: 0 },
                                { src: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg', alt: 'MongoDB', angle: 45 },
                                { src: 'https://www.vectorlogo.zone/logos/google_bigquery/google_bigquery-icon.svg', alt: 'BigQuery', angle: 90 },
                                { src: 'https://www.vectorlogo.zone/logos/google_drive/google_drive-icon.svg', alt: 'Drive', angle: 135 },
                                { src: '/logos/meta.svg', alt: 'Meta', angle: 180 },
                                { src: 'https://www.vectorlogo.zone/logos/fitbit/fitbit-icon.svg', alt: 'Fitbit', angle: 225 },
                                { src: '/logos/excel.svg', alt: 'Excel', angle: 270 },
                                { src: 'https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg', alt: 'Supabase', angle: 315 },
                            ].map((item) => (
                                <div
                                    key={item.alt}
                                    className="absolute size-14 rounded-xl bg-white/90 border border-white/50 flex items-center justify-center shadow-xl animate-[orbitSpinReverse_50s_linear_infinite] pointer-events-auto hover:scale-125 transition-transform"
                                    style={{
                                        left: `calc(50% + ${Math.cos((item.angle * Math.PI) / 180) * 200}px - 28px)`,
                                        top: `calc(50% + ${Math.sin((item.angle * Math.PI) / 180) * 200}px - 28px)`,
                                    }}
                                >
                                    <img src={item.src} alt={item.alt} className="size-10 object-contain drop-shadow-md" />
                                </div>
                            ))}
                        </div>

                        {/* Inner orbit - 4 logos */}
                        <div className="absolute top-1/2 left-1/2 size-[240px] animate-[orbitSpin_30s_linear_infinite_reverse]">
                            {[
                                { src: '/logos/sqlserver.svg', alt: 'SQL Server', angle: 0 },
                                { src: 'https://cdn.simpleicons.org/googlesheets/34A853', alt: 'Sheets', angle: 90 },
                                { src: '/logos/onedrive.svg', alt: 'OneDrive', angle: 180 },
                                { src: '/logos/iot.svg', alt: 'IoT', angle: 270 },
                            ].map((item) => (
                                <div
                                    key={item.alt}
                                    className="absolute size-11 rounded-xl bg-white/90 border border-white/50 flex items-center justify-center shadow-lg animate-[orbitSpin_30s_linear_infinite] pointer-events-auto"
                                    style={{
                                        left: `calc(50% + ${Math.cos((item.angle * Math.PI) / 180) * 120}px - 22px)`,
                                        top: `calc(50% + ${Math.sin((item.angle * Math.PI) / 180) * 120}px - 22px)`,
                                    }}
                                >
                                    <img src={item.src} alt={item.alt} className="size-8 object-contain drop-shadow-md" />
                                </div>
                            ))}
                        </div>




                        {/* Ambient glow rings - Fainter now to let icons pop */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full border border-white/10 opacity-30" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-white/[0.01] blur-3xl" />
                    </div>

                    {/* CSS Keyframes for orbit - includes translate to prevent centering jump */}
                    <style>{`
                        @keyframes orbitSpin {
                            from { transform: translate(-50%, -50%) rotate(0deg); }
                            to { transform: translate(-50%, -50%) rotate(360deg); }
                        }
                        @keyframes orbitSpinReverse {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(-360deg); }
                        }
                    `}</style>


                    <div className="relative z-20 max-w-xl animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-[0.2em] mb-8 shadow-lg">
                            <span className="size-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(74,222,128,1)]" />
                            Start Your Journey
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-sm">
                            Transform raw data into <span className="text-white/90 underline decoration-white/20 underline-offset-8">scientific breakthroughs.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-white/90 font-medium mb-10 max-w-lg leading-relaxed drop-shadow-sm">
                            Upload your datasets and let our AI-powered engine handle the heavy lifting.
                            From quality checks to insights discovery—all automated.
                        </p>

                        <button
                            onClick={() => setShowConnectors(true)}
                            className="bg-white text-primary px-10 h-16 rounded-full font-extrabold text-lg hover:bg-slate-50 transition-colors flex items-center gap-4 w-fit group shadow-xl"
                        >
                            Investigate
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <ChevronRight className="size-5" strokeWidth={3} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in transition-all duration-500">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Connect your <span className="text-primary">favorite datasource</span></h1>
                <p className="text-slate-500 font-medium text-lg">
                    Select a source to start gaining insights and unlocking breakthroughs.
                </p>
            </div>

            {/* Controls: Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={cn(
                                "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                                activeTab === cat
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                            )}
                        >
                            {cat === 'Warehouses' ? 'Data Warehouses' : cat === 'Cloud' ? 'Integrations' : cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                        placeholder="Search connectors..."
                        className="pl-10 h-10 border-slate-200 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Consolidated Manual Upload View */}
            {(activeTab === 'All' || activeTab === 'Manual') && searchQuery === '' && (
                <div className="flex flex-col gap-10 mb-12 animate-slide-up">
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Upload className="size-6 text-primary" />
                            <h2 className="text-xl font-bold text-slate-900">Upload Dataset</h2>
                        </div>
                        <p className="text-slate-500 font-medium mb-4 -mt-4">
                            Upload CSV, Excel, JSON or PDF files with automatic profiling and quality assessment.
                        </p>
                        <div className="flex items-center gap-3 mb-8">
                            {[
                                { src: 'https://cdn-icons-png.flaticon.com/512/28/28842.png', alt: 'CSV' },
                                { src: '/logos/excel.svg', alt: 'Excel' },
                                { src: 'https://cdn.simpleicons.org/json/000000', alt: 'JSON' },
                                { src: '/logos/pdf.svg', alt: 'PDF' },
                                { src: '/logos/word.svg', alt: 'Word' },
                            ].map(f => (
                                <div key={f.alt} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-primary/20 hover:bg-primary/5 transition-all group cursor-default">
                                    <img src={f.src} alt={f.alt} className="size-6 object-contain" />
                                    <span className="text-xs font-bold text-slate-500 group-hover:text-primary transition-colors">{f.alt}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-primary/30 transition-all cursor-pointer group">
                            <div className="size-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="size-8 text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Drop your file here or click to browse</h3>
                            <p className="text-slate-400 font-medium mb-8">Supports CSV, Excel, JSON, PDF and Docs up to 50MB</p>

                            <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-8 h-12 rounded-xl font-bold shadow-sm">
                                Select File
                            </Button>
                        </div>
                    </div>

                    {/* Recent Uploads Section */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock className="size-6 text-primary" />
                            <h2 className="text-xl font-bold text-slate-900">Recent Uploads</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">File</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">Method</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">Status</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm text-center">Progress</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">Size</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">Rows</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">Quality</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">Duration</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm">Created</th>
                                        <th className="pb-4 pt-2 font-semibold text-slate-400 text-sm text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[
                                        {
                                            name: 'impact-of-covid-19-on-sme...',
                                            method: 'File Upload',
                                            status: 'Processing',
                                            progress: 0,
                                            size: '234 B',
                                            rows: '9',
                                            quality: '-',
                                            duration: '1358h 32m',
                                            created: 'about 2 months ago'
                                        },
                                        {
                                            name: 'maven_fuzzy_factory_data_...',
                                            method: 'File Upload',
                                            status: 'Processing',
                                            progress: 0,
                                            size: '2.48 KB',
                                            rows: '36',
                                            quality: '-',
                                            duration: '1461h 25m',
                                            created: '2 months ago'
                                        }
                                    ].map((upload, idx) => (
                                        <tr key={idx} className="group/row hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 font-bold text-slate-700 text-sm">{upload.name}</td>
                                            <td className="py-5">
                                                <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-bold ring-1 ring-slate-100">
                                                    {upload.method}
                                                </span>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary rounded-full text-[11px] font-bold w-fit ring-1 ring-primary/20">
                                                    <span className="size-1.5 bg-primary rounded-full animate-pulse" />
                                                    {upload.status}
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-3 justify-center min-w-[120px]">
                                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{ width: `${upload.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{upload.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-sm font-medium text-slate-500">{upload.size}</td>
                                            <td className="py-5 text-sm font-bold text-slate-700">{upload.rows}</td>
                                            <td className="py-5 text-sm font-medium text-slate-400 text-center">{upload.quality}</td>
                                            <td className="py-5 text-sm font-medium text-slate-500">{upload.duration}</td>
                                            <td className="py-5 text-sm font-medium text-slate-400">{upload.created}</td>
                                            <td className="py-5 text-right">
                                                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                    <ExternalLink className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Health Data Compliance Card */}
            {(activeTab === 'Health') && (
                <div className="mb-8 animate-slide-up">
                    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white p-6">
                        {/* Decorative background elements */}
                        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-blue-100/30 blur-2xl" />
                        <div className="absolute -right-4 -bottom-4 size-24 rounded-full bg-indigo-100/20 blur-xl" />

                        <div className="relative flex items-start gap-5">
                            {/* Shield Icon */}
                            <div className="flex-shrink-0 size-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 flex items-center justify-center">
                                <ShieldCheck className="size-7 text-white" strokeWidth={2} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">Optimized for Health Data</h3>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 ring-1 ring-green-600/10">
                                        <Lock className="size-2.5" />
                                        HIPAA Ready
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    This pipeline is specifically engineered for sensitive medical and research data. It automatically applies{' '}
                                    <span className="font-bold text-slate-800">advanced PII detection</span> and{' '}
                                    <span className="font-bold text-slate-800">anonymization algorithms</span> before processing, ensuring your data remains compliant and secure by design.
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Fingerprint className="size-3.5 text-blue-500" />
                                        <span className="font-semibold">End-to-end encryption</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <ShieldCheck className="size-3.5 text-green-500" />
                                        <span className="font-semibold">SOC 2 Type II</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Lock className="size-3.5 text-indigo-500" />
                                        <span className="font-semibold">GDPR Compliant</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid for other connectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConnectors
                    .filter(c => activeTab === 'Manual' ? false : (activeTab === 'All' ? c.category !== 'Manual' : true))
                    .map((connector) => (
                        <div
                            key={connector.id}
                            className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative flex flex-col h-full"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="size-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:border-primary/10 transition-all duration-300 overflow-hidden p-2 shadow-sm group-hover:shadow-md">
                                    {connector.logo ? (
                                        <img
                                            src={connector.logo}
                                            alt={connector.name}
                                            className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3067/3067451.png'; // Fallback icon
                                            }}
                                        />
                                    ) : connector.icon ? (
                                        <connector.icon className="size-8 text-slate-600 group-hover:text-primary transition-colors" />
                                    ) : (
                                        <Database className="size-8 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-800 truncate">{connector.name}</h3>
                                        {connector.status === 'New' && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded uppercase tracking-wider">New</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] leading-relaxed">
                                        {connector.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                                    {connector.type}
                                </span>

                                {connector.status === 'Connected' ? (
                                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold ring-1 ring-green-600/10">
                                        <CheckCircle2 className="size-3.5" />
                                        Connected
                                    </div>
                                ) : (
                                    <Button variant="ghost" className="h-9 px-4 text-xs font-bold text-primary hover:bg-primary/5 hover:text-primary rounded-lg transition-all group-hover:bg-primary group-hover:text-white">
                                        Connect
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                {filteredConnectors.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info className="size-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No connectors found</h3>
                        <p className="text-slate-500">Try adjusting your search or category filters.</p>
                    </div>
                )}
            </div>

            {/* Support Banner */}
            <div className="mt-16 p-8 rounded-[3rem] bg-primary/[0.03] border border-primary/10 flex flex-row items-center justify-between gap-8 relative overflow-hidden group shadow-sm">
                <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="size-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                        <Plus className="size-8" strokeWidth={3} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">Need another connection?</h3>
                        <p className="text-slate-600 font-medium tracking-tight">Let us know what data you'd like to use in DataIQ.</p>
                    </div>
                </div>

                <Button className="bg-primary hover:bg-primary/90 text-white px-10 rounded-2xl h-14 font-bold shadow-[0_10px_40px_rgba(14,80,246,0.3)] hover:shadow-[0_15px_50px_rgba(14,80,246,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all relative z-10 whitespace-nowrap">
                    Request connector
                </Button>
            </div>
        </div>
    );
}
