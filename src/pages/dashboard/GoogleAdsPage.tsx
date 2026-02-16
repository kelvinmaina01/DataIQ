import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ChevronDown,
    ChevronRight,
    Loader2,
    ShieldAlert,
    LayoutDashboard,
    Globe,
    CheckCircle2,
    BarChart3,
    Users
} from 'lucide-react';
import { AnalysisActionModal } from '../../components/AnalysisActionModal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getGoogleSheetsConnection, isGoogleTokenExpired } from '../../services/connectionService';

interface AdsAccount {
    id: string;
    descriptiveName: string;
    currencyCode: string;
    timeZone: string;
    isManager?: boolean;
    childAccounts?: AdsAccount[];
}

export function GoogleAdsPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [accounts, setAccounts] = useState<AdsAccount[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<AdsAccount | null>(null);
    const [expandedMccs, setExpandedMccs] = useState<Set<string>>(new Set());

    useEffect(() => {
        checkAuthAndLoadAccounts();
    }, []);

    const checkAuthAndLoadAccounts = async () => {
        const connection = getGoogleSheetsConnection();

        if (!connection || isGoogleTokenExpired()) {
            toast.error('Please connect your Google account first');
            navigate('/dashboard/ingestion/connect/google-ads');
            return;
        }

        try {
            const response = await fetch(
                `/api/integrations/google/ads/customers?access_token=${encodeURIComponent(connection.accessToken)}`
            );
            const data = await response.json();

            if (data.customers) {
                setAccounts(data.customers);
                // Auto-expand if there's only one MCC
                if (data.customers.length === 1 && data.customers[0].isManager) {
                    toggleMcc(data.customers[0].id);
                }
            } else {
                throw new Error('Failed to fetch accounts');
            }
        } catch (error) {
            console.error('CRITICAL: Error loading ads accounts:', error);
            toast.error(`Could not load Google Ads accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMcc = (id: string) => {
        const newExpanded = new Set(expandedMccs);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedMccs(newExpanded);
    };

    const hasManagerAccount = accounts.some(acc => acc.isManager);

    const filteredAccounts = accounts.filter(acc =>
        acc.descriptiveName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.id.includes(searchQuery)
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Google Ads Integration</h1>
                    <p className="text-slate-500 mt-1">Select an account for analysis</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search accounts or IDs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-64 bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Requirement: Show MCC message if none connected or as general guidance */}
            {!hasManagerAccount && accounts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                    <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 mb-1">Select a Google Ads account</h3>
                            <p className="text-amber-800 text-sm leading-relaxed">
                                You must connect a Google Ads manager (MCC) account first before you can connect any of the client accounts it manages.
                                Once an MCC is connected it will expand so you can pick one of its child accounts.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {accounts.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Ads Accounts Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        We couldn't find any Google Ads accounts associated with your connection.
                        Make sure you've granted the necessary permissions.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard/ingestion/connect/google-ads')}
                    >
                        Reconnect Google Ads
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAccounts.map((account) => (
                        <div key={account.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            {account.isManager ? (
                                <>
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => toggleMcc(account.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900">{account.descriptiveName}</h3>
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full border border-blue-100">Manager (MCC)</span>
                                                </div>
                                                <p className="text-xs text-slate-500">ID: {account.id} • {account.currencyCode}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-slate-400">{account.childAccounts?.length || 0} child accounts</span>
                                            {expandedMccs.has(account.id) ? (
                                                <ChevronDown className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedMccs.has(account.id) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-100 bg-slate-50/50"
                                            >
                                                <div className="p-2 space-y-1">
                                                    {account.childAccounts?.map((child) => (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => setSelectedAccount(child)}
                                                            className="w-full p-3 pl-14 flex items-center justify-between rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all group text-left"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">{child.descriptiveName}</p>
                                                                    <p className="text-[10px] text-slate-500">ID: {child.id} • {child.currencyCode}</p>
                                                                </div>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button size="sm" variant="ghost" className="h-8 text-[11px] font-bold text-primary">SELECT</Button>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setSelectedAccount(account)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                            <LayoutDashboard className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{account.descriptiveName}</h3>
                                            <p className="text-xs text-slate-500">ID: {account.id} • {account.currencyCode}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 text-[11px] font-bold text-primary">SELECT</Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <AnalysisActionModal
                isOpen={!!selectedAccount}
                onClose={() => setSelectedAccount(null)}
                contextName={selectedAccount?.desriptiveName || ''}
                contextData={{
                    type: 'google_ads_account',
                    id: selectedAccount?.id || '',
                    name: selectedAccount?.descriptiveName || '',
                    source: 'google',
                    currency: selectedAccount?.currencyCode,
                    timeZone: selectedAccount?.timeZone
                }}
            />
        </div>
    );
}
