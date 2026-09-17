import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Database,
    ShieldCheck,
    Lock,
    ExternalLink,
    PlayCircle,
    CheckCircle2,
    ArrowRight,
    ChevronRight,
    Info,
    HelpCircle,
    Mail,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';
import { CONNECTORS_INFO, ConnectorInfo } from '../../lib/connectors';

// Connector Info now imported from ../../lib/connectors

export function DatabaseConnectorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [view, setView] = useState<'intro' | 'config'>('intro');
    const [isLoading, setIsLoading] = useState(false);
    const [showJson, setShowJson] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Record<string, string>>({});

    const connector = id ? CONNECTORS_INFO[id] : null;

    if (!connector) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Database className="size-8 text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Connector not found</h2>
                <Button variant="ghost" className="mt-4" onClick={() => navigate('/dashboard/ingestion')}>
                    Back to Connectors
                </Button>
            </div>
        );
    }

    const highlightTerms = (text: string) => {
        const terms = ['host', 'port', 'database name', 'credentials', 'IP whitelisting'];
        let parts: (string | React.ReactNode)[] = [text];

        terms.forEach(term => {
            const nextParts: (string | React.ReactNode)[] = [];
            parts.forEach(part => {
                if (typeof part === 'string') {
                    const regex = new RegExp(`(${term})`, 'gi');
                    const split = part.split(regex);
                    split.forEach((s, i) => {
                        if (s.toLowerCase() === term.toLowerCase()) {
                            nextParts.push(<span key={i} className="text-primary font-bold">{s}</span>);
                        } else if (s !== "") {
                            nextParts.push(s);
                        }
                    });
                } else {
                    nextParts.push(part);
                }
            });
            parts = nextParts;
        });

        return parts;
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connector) return;

        setIsLoading(true);
        const loadingToast = toast.loading(`Testing connection to ${connector.name}...`);

        try {
            // Import database connector service
            const { databaseConnectorService } = await import('../../services/databaseConnectorService');

            // Build credentials object based on connector type
            const credentials: any = {
                host: formData.host || '',
                port: parseInt(formData.port) || 5432,
                database: formData.database || '',
                username: formData.username || '',
                password: formData.password || '',
                ssl: formData.ssl === 'true' || false
            };

            // MongoDB-specific: support connection string
            if (connector.id === 'mongodb' && formData.connectionString) {
                credentials.connectionString = formData.connectionString;
            }



            // Step 1: Test the connection
            console.log('[DatabaseConnectorPage] Testing connection:', connector.id);
            const testResult = await databaseConnectorService.testConnection(connector.id, credentials);

            if (!testResult.success) {
                throw new Error(testResult.message || 'Connection test failed');
            }

            // Step 2: Save the connection
            console.log('[DatabaseConnectorPage] Saving connection...');
            const connectionName = formData.connectionName || `${connector.name} Connection`;
            const connectResult = await databaseConnectorService.connect(
                connector.id,
                connectionName,
                credentials
            );

            if (!connectResult.success || !connectResult.connectionId) {
                throw new Error(connectResult.message || 'Failed to save connection');
            }

            toast.dismiss(loadingToast);
            toast.success(
                <div>
                    <p className="font-bold">Connection Successful!</p>
                    <p className="text-sm">Your {connector.name} database is now connected and ready to query.</p>
                </div>
            );

            // Navigate to the processing page with the "virtual batch"
            // We include method: 'Database: ID' so processing page knows to save it with specific mapping
            navigate('/dashboard/ingestion/processing', {
                state: {
                    batch: [{
                        ...connectResult,
                        method: `Database: ${connector.id}`,
                        connectorLogo: connector.logo
                    }]
                }
            });
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error(
                <div>
                    <p className="font-bold">Connection Failed</p>
                    <p className="text-sm">{error.message || 'Please check your credentials and try again.'}</p>
                </div>
            );
            console.error('[DatabaseConnectorPage] Connection error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 mb-10">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-slate-100"
                    onClick={() => view === 'config' ? setView('intro') : navigate('/dashboard/ingestion')}
                >
                    <ChevronLeft className="size-5 text-slate-600" />
                </Button>

                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center p-1.5">
                        <img src={connector.logo} alt={connector.name} className="size-full object-contain" />
                    </div>
                    <h1 className="text-xl font-bold text-primary">
                        {view === 'intro' ? connector.name : `Create ${connector.name} Connector`}
                    </h1>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'intro' ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-3xl ml-14"
                    >
                        <div className="space-y-6">
                            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                                {highlightTerms(connector.setupTitle)}
                            </p>

                            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                                {highlightTerms(connector.setupDescription)}
                            </p>

                            <div className="flex flex-col gap-4 py-4">
                                <div className="flex items-center gap-3 text-slate-600 group cursor-pointer hover:text-primary transition-colors">
                                    <PlayCircle className="size-5" />
                                    <span className="font-semibold text-[15px]">watch our <span className="text-primary underline decoration-primary/30">video walkthrough</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 group cursor-pointer hover:text-primary transition-colors">
                                    <Mail className="size-5" />
                                    <span className="font-semibold text-[15px]">send setup information directly to your IT department below.</span>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                                    onClick={() => setView('config')}
                                >
                                    Set up {connector.name}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="config"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                    >
                        {/* Form Column */}
                        <div className="space-y-10">
                            {connector.fields.includes('Authentication Method') && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Authentication Method</label>
                                    </div>
                                    <select
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        value={formData['Authentication Method'] || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ['Authentication Method']: e.target.value }))}
                                    >
                                        <option value="password">Username / Password</option>
                                        <option value="key">OAuth / Key Pair</option>
                                    </select>
                                    <p className="text-sm font-medium text-slate-400">Choose how you want to authenticate with {connector.name}</p>
                                </div>
                            )}

                            <div className="space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Connection Name *</h3>
                                        <HelpCircle className="size-4 text-slate-300" />
                                    </div>
                                    <Input
                                        placeholder={`e.g. ${connector.name} Production DB`}
                                        className="h-12 border-slate-200 rounded-xl focus:border-primary px-4 font-medium"
                                        value={formData['Connection Name'] || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ['Connection Name']: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-6 pt-2">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Credentials</h3>
                                        <p className="text-sm font-medium text-slate-400">Your credentials are encrypted and never stored in plain text.</p>
                                    </div>

                                    {connector.fields.filter(f => f !== 'Connection Name' && f !== 'Authentication Method').map((field) => (
                                        <div key={field}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{field} *</label>
                                                <HelpCircle className="size-3.5 text-slate-300" />
                                            </div>
                                            {field === 'SERVICE_ACCOUNT_JSON' ? (
                                                <div className="relative">
                                                    <Textarea
                                                        placeholder="Enter your service account json"
                                                        className="min-h-[160px] border-slate-200 rounded-xl focus:border-primary px-4 py-3 font-medium transition-all pr-12 font-mono text-xs"
                                                        value={formData[field] || ''}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowJson(!showJson)}
                                                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        {showJson ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                                    </button>
                                                </div>
                                            ) : (field === 'MFA_TYPE' || field === 'Location') ? (
                                                <select
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    value={formData[field] || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                                                >
                                                    <option value="">Enter your {field.toLowerCase()}</option>
                                                    {field === 'MFA_TYPE' && (
                                                        <>
                                                            <option value="none">None</option>
                                                            <option value="duo">Duo</option>
                                                            <option value="google">Google Authenticator</option>
                                                        </>
                                                    )}
                                                    {field === 'Location' && (
                                                        <>
                                                            <option value="us">US (Multi-region)</option>
                                                            <option value="eu">EU (Multi-region)</option>
                                                            <option value="us-central1">US Central1</option>
                                                        </>
                                                    )}
                                                </select>
                                            ) : (
                                                <Input
                                                    type={(field.toLowerCase().includes('password') || field === 'Private Key') ? 'password' : 'text'}
                                                    placeholder={`Enter your ${field.toLowerCase()}`}
                                                    className="h-12 border-slate-200 rounded-xl focus:border-primary px-4 font-medium"
                                                    value={formData[field] || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6 pt-4">
                                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                    If your database requires IP whitelisting, you need to add IP addresses to your system.
                                    <button className="ml-1 text-primary hover:underline font-bold">Show IPs to whitelist</button>
                                </p>

                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                    <Button
                                        variant="outline"
                                        className="h-12 px-8 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                                        onClick={() => setView('intro')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="h-12 px-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                        onClick={handleConnect}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Connecting...' : 'Connect'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Visual / Info Column (Optional, to balance the grid) */}
                        <div className="hidden lg:block">
                            <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 relative overflow-hidden h-full">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShieldCheck className="size-40 text-primary" />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                        <ShieldCheck className="size-8 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">Secure, Enterprise-Grade Data Connection</h3>
                                    <div className="space-y-6">
                                        {[
                                            { title: 'Read-Only Access', desc: 'DataIQ only requires read access to your data tables.' },
                                            { title: 'End-to-End Encryption', desc: 'Your credentials and data are encrypted in transit and at rest.' },
                                            { title: 'No Data Storage', desc: 'We do not store your raw database data unless explicitly cached.' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="mt-1 size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="size-3 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Compliance Badges */}
                                    <div className="pt-8 border-t border-slate-200/60 mt-8 space-y-4">
                                        {[
                                            {
                                                name: 'SOC 2 Type 2',
                                                logo: '/logos/soc2-badge.png',
                                                color: 'bg-[#0E50F6]'
                                            },
                                            {
                                                name: 'GDPR',
                                                logo: '/logos/gdpr-badge.png',
                                                color: 'bg-[#003399]'
                                            },
                                            {
                                                name: 'HIPAA',
                                                logo: '/logos/hipaa-badge.png',
                                                color: 'bg-[#058b7c]'
                                            },
                                            {
                                                name: 'ISO 27001',
                                                logo: '/logos/iso-badge.png',
                                                color: 'bg-[#e43d30]'
                                            }
                                        ].map((badge, i) => (
                                            <div key={i} className="bg-white border border-slate-100/80 rounded-[1.5rem] p-5 flex items-center justify-between group cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn("size-14 rounded-full flex items-center justify-center p-3 shadow-sm", badge.color)}>
                                                        <img
                                                            src={badge.logo}
                                                            alt={badge.name}
                                                            className="size-full object-contain brightness-0 invert"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.visibility = 'hidden';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <h4 className="font-extrabold text-slate-900 text-[17px] tracking-tight">{badge.name}</h4>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/10 text-[11px] font-bold text-emerald-700 bg-emerald-50/50">
                                                            <div className="size-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                                                <CheckCircle2 className="size-2.5 text-white" strokeWidth={4} />
                                                            </div>
                                                            Compliant
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="size-6 text-slate-200 group-hover:text-primary/40 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
