import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../components/ui/utils';
import { CONNECTORS_INFO } from '../../lib/connectors';
import { getConnectionsByType, deleteConnection, getGoogleSheetsConnection, disconnectGoogleSheets, getMetaAdsConnection, disconnectMetaAds, getMicrosoftConnection, disconnectMicrosoft } from '../../services/connectionService';
import { toast } from 'sonner';
import { AnalysisActionModal } from '../../components/AnalysisActionModal';

type TabType = 'browse' | 'customize' | 'learnings' | 'settings';

export function ConnectionDetailPage() {
    const { connectorId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('browse');
    const [customInstructions, setCustomInstructions] = useState('');
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    const connector = connectorId ? CONNECTORS_INFO[connectorId] : undefined;

    // Handle Google Workspace connections (Sheets, Drive, Ads all use same OAuth)
    const isGoogleWorkspace = connectorId === 'google-sheets' || connectorId === 'gsheets' || connectorId === 'gdrive' || connectorId === 'gads';
    const googleSheetsConnection = isGoogleWorkspace ? getGoogleSheetsConnection() : null;

    // Handle Meta Ads connection
    const isMetaAds = connectorId === 'metaads';
    const metaAdsConnection = isMetaAds ? getMetaAdsConnection() : null;

    // Handle Microsoft connections (OneDrive + SharePoint)
    const isMicrosoft = connectorId === 'onedrive' || connectorId === 'sharepoint';
    const microsoftConnection = isMicrosoft ? getMicrosoftConnection() : null;

    // Handle database/warehouse connections
    const connections = (!isGoogleWorkspace && !isMetaAds && !isMicrosoft) ? getConnectionsByType(connectorId || '') : [];
    const activeConnection = connections[0];

    if (!connector && !isGoogleWorkspace && !isMetaAds && !isMicrosoft) {
        return <div>Connector not found</div>;
    }

    const tabs = [
        { id: 'browse' as TabType, label: 'Browse' },
        { id: 'customize' as TabType, label: 'Customize' },
        { id: 'learnings' as TabType, label: 'Review Learnings' },
        { id: 'settings' as TabType, label: 'Settings' },
    ];

    const handleDelete = () => {
        if (isGoogleWorkspace) {
            if (confirm(`Are you sure you want to disconnect Google Workspace? This will remove access to Sheets, Drive, and Ads data.`)) {
                disconnectGoogleSheets();
                toast.success('Google Workspace disconnected successfully');
                navigate('/dashboard/ingestion');
            }
        } else if (isMetaAds) {
            if (confirm(`Are you sure you want to disconnect Meta Ads? This will remove access to your Facebook and Instagram ad data.`)) {
                disconnectMetaAds();
                toast.success('Meta Ads disconnected successfully');
                navigate('/dashboard/ingestion');
            }
        } else if (isMicrosoft) {
            if (confirm(`Are you sure you want to disconnect Microsoft? This will remove access to OneDrive and SharePoint data.`)) {
                disconnectMicrosoft();
                toast.success('Microsoft disconnected successfully');
                navigate('/dashboard/ingestion');
            }
        } else if (activeConnection && confirm(`Are you sure you want to delete this connector and all learnings associated with it?`)) {
            deleteConnection(activeConnection.id);
            toast.success('Connection deleted successfully');
            navigate('/dashboard/ingestion');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard/ingestion')}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronLeft className="size-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                {isGoogleWorkspace ? (
                                    <div className="size-7">
                                        <svg viewBox="0 0 24 24">
                                            <path fill="#34A853" d="M19.8 10.7L21.35 12.25C21.75 12.65 21.75 13.35 21.35 13.75L13.75 21.35C13.35 21.75 12.65 21.75 12.25 21.35L10.7 19.8" />
                                            <path fill="#00A651" d="M7 14.25L1.65 8.9C1.25 8.5 1.25 7.8 1.65 7.4L8.9 1.65C9.3 1.25 10 1.25 10.4 1.65L19.8 10.7L10.4 21.35C10 21.75 9.3 21.75 8.9 21.35L7 14.25Z" />
                                            <path fill="#FBBC04" d="M14.7 12L21.35 5.35C21.75 4.95 21.75 4.25 21.35 3.85L18.15 0.65C17.75 0.25 17.05 0.25 16.65 0.65L10 7.3L14.7 12Z" />
                                            <path fill="#4285F4" d="M10 7.3L3.35 0.65C2.95 0.25 2.25 0.25 1.85 0.65L0.65 1.85C0.25 2.25 0.25 2.95 0.65 3.35L7.3 10L10 7.3Z" />
                                        </svg>
                                    </div>
                                ) : connector?.logo && (
                                    <div className="size-7">
                                        <img src={connector.logo} alt={connector.name} className="w-full h-full object-contain" />
                                    </div>
                                )}
                                <h1 className="text-lg font-semibold text-slate-900">
                                    {isGoogleWorkspace
                                        ? (connectorId === 'gdrive' ? 'Google Drive' : connectorId === 'gads' ? 'Google Ads' : 'Google Sheets')
                                        : connector?.name}
                                </h1>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAnalysisModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-medium text-sm h-9 px-4 rounded-lg"
                        >
                            Query My Data
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-3 text-[13px] font-medium border-b-2 transition-colors",
                                    activeTab === tab.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Browse Tab */}
                    {activeTab === 'browse' && (
                        <div className="flex flex-col items-center justify-center py-20">
                            {isGoogleWorkspace ? (
                                <div className="text-center max-w-md">
                                    {connectorId === 'gdrive' ? (
                                        <>
                                            <div className="size-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                                <img
                                                    src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
                                                    alt="Drive"
                                                    className="size-8"
                                                />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                                Browse Google Drive
                                            </h3>
                                            <p className="text-slate-600 mb-6">
                                                Select a file to analyze with DataIQ's document intelligence.
                                            </p>
                                            <Button
                                                onClick={() => navigate('/dashboard/google-drive')}
                                                className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                                                style={{ backgroundColor: '#4285F4', color: 'white' }}
                                            >
                                                Open Drive Explorer
                                            </Button>
                                        </>
                                    ) : connectorId === 'gads' ? (
                                        <>
                                            <div className="size-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                                <img
                                                    src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg"
                                                    alt="Ads"
                                                    className="size-8"
                                                />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                                Select Google Ads Account
                                            </h3>
                                            <p className="text-slate-600 mb-6">
                                                Pick an account or MCC to analyze campaigns and performance data.
                                            </p>
                                            <Button
                                                onClick={() => navigate('/dashboard/google-ads')}
                                                className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                                                style={{ backgroundColor: '#4285F4', color: 'white' }}
                                            >
                                                Open Account Picker
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="size-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                                                <img
                                                    src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg"
                                                    alt="Sheets"
                                                    className="size-8"
                                                />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                                Browse Google Sheets
                                            </h3>
                                            <p className="text-slate-600 mb-6">
                                                Select a sheet to view its schema and analyze data in DataIQ.
                                            </p>
                                            <Button
                                                onClick={() => navigate('/dashboard/google-sheets')}
                                                className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-green-600/20 transition-all hover:-translate-y-0.5"
                                                style={{ backgroundColor: '#16a34a', color: 'white' }}
                                            >
                                                Open Sheet Explorer
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center max-w-md">
                                    <h3 className="text-base font-medium text-slate-700 mb-1">
                                        No schema found for this connection.
                                    </h3>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customize Tab */}
                    {activeTab === 'customize' && (
                        <div className="max-w-3xl">
                            <h2 className="text-base font-semibold text-slate-900 mb-1">Custom Instructions</h2>
                            <p className="text-sm text-slate-600 mb-6">
                                Provide instructions and context about this connection so AI can use it effectively.
                            </p>

                            <div className="space-y-4">
                                {/* Instructions hint */}
                                <div className="text-sm text-slate-700 space-y-1.5">
                                    <p className="font-medium">Include details like:</p>
                                    <ul className="space-y-1 text-slate-600 ml-4">
                                        <li className="flex gap-2">
                                            <span>•</span>
                                            <span>Explain the data sources and its purpose</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span>•</span>
                                            <span>Important tables (e.g., <code className="text-blue-600 text-xs bg-blue-50 px-1 py-0.5 rounded">use product_catalog for products</code>)</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span>•</span>
                                            <span>Key table relationships (e.g., <code className="text-blue-600 text-xs bg-blue-50 px-1 py-0.5 rounded">product_catalog.sku → transaction_history.product_sku</code>)</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <span>•</span>
                                            <span>Any business logic notes (e.g., Revenue only counts completed orders)</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Instructions */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Instructions
                                    </label>
                                    <Textarea
                                        value={customInstructions}
                                        onChange={(e) => setCustomInstructions(e.target.value)}
                                        placeholder="e.g., Always filter data by the current fiscal year, use specific table conventions, prioritize certain metrics..."
                                        className="min-h-[180px] text-sm resize-none border-slate-300 focus:border-primary focus:ring-primary/20"
                                    />
                                </div>

                                {/* Character count */}
                                <div className="text-xs text-slate-500">
                                    {customInstructions.length} characters
                                </div>

                                {/* Save button */}
                                <Button
                                    className="bg-primary hover:bg-primary/90 text-white font-medium text-sm h-9 px-6 rounded-lg"
                                    disabled={!customInstructions.trim()}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Review Learnings Tab */}
                    {activeTab === 'learnings' && (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center max-w-md">
                                <div className="size-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="size-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h3>
                                <p className="text-sm text-slate-500">No learnings pending review.</p>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && activeConnection && (
                        <div className="max-w-3xl space-y-8">
                            {/* Connection Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900 mb-2">
                                    Connection Name
                                </label>
                                <Input
                                    defaultValue={activeConnection.connectionName}
                                    className="max-w-md border-slate-300 focus:border-primary focus:ring-primary/20"
                                />
                            </div>

                            {/* Authentication Method */}
                            <div>
                                <label className="block text-sm font-medium text-slate-900 mb-2">
                                    Authentication Method
                                </label>
                                <select className="max-w-md w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option>Direct Connection</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1.5">
                                    Choose how you want to authenticate with this connector
                                </p>
                            </div>

                            {/* Credentials */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 mb-1">Credentials</h3>
                                <p className="text-xs text-red-600 mb-4">
                                    Your credentials are encrypted and never stored in plain text.
                                </p>

                                <div className="space-y-4 max-w-md">
                                    {Object.entries(activeConnection.credentials).map(([key, value]) => {
                                        const isPassword = key.toLowerCase() === 'password';
                                        const isRequired = !isPassword;

                                        return (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                                    {isRequired && <span className="text-red-500 ml-0.5">*</span>}
                                                    {isPassword && <span className="text-slate-500 text-xs ml-1">(leave empty to keep current)</span>}
                                                </label>
                                                <Input
                                                    type={isPassword ? 'password' : 'text'}
                                                    defaultValue={value as string}
                                                    placeholder={isPassword ? 'Enter new value or leave empty' : ''}
                                                    className="border-slate-300 focus:border-primary focus:ring-primary/20"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Require Review for Learnings */}
                            <div className="flex items-start justify-between gap-4 py-4 border-y border-slate-200">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-slate-900 mb-1">Require Review for Learnings</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        When enabled, new learnings must be manually reviewed before being applied.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Delete Connector */}
                            <div className="pt-2">
                                <h3 className="text-sm font-medium text-slate-900 mb-1">Delete Connector</h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Delete this connector and all learnings associated with it
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleDelete}
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium text-sm h-9 px-4 rounded-lg"
                                >
                                    Delete {connector.name.toLowerCase()}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Google Workspace Settings Tab */}
                    {activeTab === 'settings' && isGoogleWorkspace && googleSheetsConnection && (
                        <div className="max-w-3xl space-y-8">
                            {/* Connected Account */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 mb-1">Connected Account</h3>
                                <p className="text-xs text-slate-500 mb-3">
                                    You're connected to {connectorId === 'gdrive' ? 'Google Drive' : connectorId === 'gads' ? 'Google Ads' : 'Google Sheets'} using this account
                                </p>
                                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="size-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="size-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{googleSheetsConnection.userEmail || 'Google Account'}</p>
                                        <p className="text-xs text-slate-500">Connected on {new Date(googleSheetsConnection.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-900 mb-1">Permissions Granted</h3>
                                <p className="text-xs text-slate-500 mb-3">
                                    DataIQ has read-only access to your {connectorId === 'gdrive' ? 'Drive files' : connectorId === 'gads' ? 'Ads campaigns' : 'Spreadsheets'}
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-slate-600">
                                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                                        <span>View your {connectorId === 'gdrive' ? 'files and folders' : connectorId === 'gads' ? 'accounts and campaigns' : 'spreadsheets'}</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-slate-600">
                                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                                        <span>View file metadata in Google Drive</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Require Review for Learnings */}
                            <div className="flex items-start justify-between gap-4 py-4 border-y border-slate-200">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-slate-900 mb-1">Require Review for Learnings</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        When enabled, new learnings must be manually reviewed before being applied.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Disconnect */}
                            <div className="pt-2">
                                <h3 className="text-sm font-medium text-slate-900 mb-1">Disconnect {connectorId === 'gdrive' ? 'Google Drive' : connectorId === 'gads' ? 'Google Ads' : 'Google Sheets'}</h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Remove access to all your {connectorId === 'gdrive' ? 'Drive data' : connectorId === 'gads' ? 'Ads data' : 'Spreadsheets'}
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleDelete}
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium text-sm h-9 px-4 rounded-lg"
                                >
                                    Disconnect {connectorId === 'gdrive' ? 'Google Drive' : connectorId === 'gads' ? 'Google Ads' : 'Google Sheets'}
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div >


            <AnalysisActionModal
                isOpen={showAnalysisModal}
                onClose={() => setShowAnalysisModal(false)}
                contextName={isGoogleWorkspace ? 'Google Workspace' : connector?.name || 'Data Connection'}
                contextData={{
                    type: isGoogleWorkspace ? 'google_workspace' : 'connector',
                    id: isGoogleWorkspace ? 'google-sheets' : connector?.id || '',
                    name: isGoogleWorkspace ? 'Google Workspace' : connector?.name || '',
                    source: isGoogleWorkspace ? 'google' : 'connector'
                }}
            />
        </div >
    );
}
