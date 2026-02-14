import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Sheet,
    ShieldCheck,
    CheckCircle2,
    ExternalLink,
    Info
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { saveGoogleSheetsConnection, getGoogleSheetsConnection } from '../../services/connectionService';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

export function GoogleSheetsConnectorPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [existingConnection, setExistingConnection] = useState(getGoogleSheetsConnection());

    // Read source parameter to determine which connector was clicked
    const source = searchParams.get('source') || 'gsheets';

    // Dynamic content based on source - memoized to prevent recalculation
    const connectorInfo = useMemo(() => {
        switch (source) {
            case 'gdrive':
                return {
                    name: 'Google Drive',
                    logo: 'https://www.vectorlogo.zone/logos/google_drive/google_drive-icon.svg',
                    description: 'Access your Drive files, Sheets, and Ads data in DataIQ.',
                    feature: 'Drive files'
                };
            case 'gads':
                return {
                    name: 'Google Ads',
                    logo: 'https://www.vectorlogo.zone/logos/google_ads/google_ads-icon.svg',
                    description: 'Analyze Ads campaigns, Sheets, and Drive data in DataIQ.',
                    feature: 'Ads campaigns'
                };
            default: // gsheets or google-sheets
                return {
                    name: 'Google Sheets',
                    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
                    description: 'Access Sheets, Drive files, and Ads data in DataIQ.',
                    feature: 'Sheets'
                };
        }
    }, [source]);

    useEffect(() => {
        // Check if user is returning from OAuth
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (code) {
            handleOAuthCallback(code);
        } else if (error) {
            toast.error(`Authentication failed: ${error}`);
            setIsLoading(false);
        }
    }, []);

    const handleOAuthCallback = async (code: string) => {
        setIsLoading(true);

        try {
            // Exchange authorization code for tokens
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'authorization_code',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for tokens');
            }

            const data = await response.json();

            // Get user email
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${data.access_token}`,
                },
            });
            const userInfo = await userInfoResponse.json();

            // Save connection
            const connection = saveGoogleSheetsConnection({
                connectorType: 'google-sheets',
                connectionName: 'Google Sheets',
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
                scope: SCOPES,
                userEmail: userInfo.email,
                status: 'connected',
            });

            toast.success('Successfully connected to Google Sheets!');

            // Clean URL and redirect to connection detail page
            window.history.replaceState({}, '', window.location.pathname);

            setTimeout(() => {
                navigate('/dashboard/connection/google-sheets');
            }, 1000);

        } catch (error) {
            console.error('OAuth error:', error);
            toast.error('Failed to connect. Please try again.');
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        setIsLoading(true);

        // Build OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', SCOPES);
        authUrl.searchParams.append('access_type', 'offline');
        authUrl.searchParams.append('prompt', 'consent');

        // Redirect to Google OAuth
        window.location.href = authUrl.toString();
    };

    if (existingConnection) {
        // Already connected - redirect to connection detail page
        navigate('/dashboard/connection/google-sheets');
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => navigate('/dashboard/ingestion')}
                        className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <ChevronLeft className="size-4" />
                        Back to Connectors
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Hero Content */}
                    <div className="text-center py-16 px-6 max-w-4xl mx-auto">
                        {/* Primary Connector Logo (large, centered) */}
                        <div className="flex items-center justify-center mb-6">
                            <div className="size-24 bg-white rounded-3xl shadow-lg border border-slate-200 flex items-center justify-center p-5">
                                <img
                                    src={connectorInfo.logo}
                                    alt={connectorInfo.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            Connect {connectorInfo.name}
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
                            {connectorInfo.description}
                        </p>

                        {/* Secondary indicators - showing all three will sync */}
                        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <div className="size-4 rounded bg-slate-100 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="" className="size-3" />
                                </div>
                                <span>Sheets</span>
                            </div>
                            <span className="text-slate-300">+</span>
                            <div className="flex items-center gap-1.5">
                                <div className="size-4 rounded bg-slate-100 flex items-center justify-center">
                                    <img src="https://www.vectorlogo.zone/logos/google_drive/google_drive-icon.svg" alt="" className="size-3" />
                                </div>
                                <span>Drive</span>
                            </div>
                            <span className="text-slate-300">+</span>
                            <div className="flex items-center gap-1.5">
                                <div className="size-4 rounded bg-slate-100 flex items-center justify-center">
                                    <img src="https://www.vectorlogo.zone/logos/google_ads/google_ads-icon.svg" alt="" className="size-3" />
                                </div>
                                <span>Ads</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid md:grid-cols-3 gap-6 mb-12"
                >
                    <div className="bg-slate-50 rounded-xl p-6">
                        <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <ShieldCheck className="size-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Secure Access</h3>
                        <p className="text-sm text-slate-600">
                            Read-only access via OAuth2. Your credentials are never stored in plain text.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                        <div className="size-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                            >
                                <CheckCircle2 className="size-5 text-green-600" />
                            </motion.div>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">No Data Import</h3>
                        <p className="text-sm text-slate-600">
                            Data stays in Google. We query it on-demand when you chat with AI.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                        <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <ExternalLink className="size-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Unified Access</h3>
                        <p className="text-sm text-slate-600">
                            One connection grants access to both Sheets and Drive for seamless analysis.
                        </p>
                    </div>
                </motion.div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
                >
                    <div className="flex gap-3">
                        <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">What access do we need?</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• <strong>View your spreadsheets</strong> - Read data from your sheets</li>
                                <li>• <strong>View file metadata</strong> - List your sheets in Google Drive</li>
                                <li>• <strong>Your email address</strong> - Identify your account</li>
                            </ul>
                            <p className="text-xs text-blue-700 mt-3">
                                We use <strong>read-only</strong> permissions. We cannot modify or delete your files.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Connect Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Button
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-roboto font-medium px-8 py-6 text-lg rounded-full h-auto shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <div className="size-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-3" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                                    alt="Google"
                                    className="size-6 mr-3"
                                />
                                Sign in with Google
                            </>
                        )}
                    </Button>

                    <p className="text-sm text-slate-500">
                        You'll be redirected to Google to grant permissions
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
