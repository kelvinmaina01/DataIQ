import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ShieldCheck,
    CheckCircle2,
    ExternalLink,
    Info
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { saveMicrosoftConnection, getMicrosoftConnection } from '../../services/connectionService';

const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback';
const SCOPES = 'Files.Read Files.Read.All Sites.Read.All User.Read offline_access';

export function MicrosoftConnectorPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [existingConnection, setExistingConnection] = useState(getMicrosoftConnection());

    // Read source parameter to determine which connector was clicked
    const source = searchParams.get('source') || 'onedrive';

    // Dynamic content based on source - memoized to prevent recalculation
    const connectorInfo = useMemo(() => {
        switch (source) {
            case 'sharepoint':
                return {
                    name: 'SharePoint',
                    logo: '/logos/sharepoint.svg',
                    description: 'Access your SharePoint sites and OneDrive for Business files in DataIQ.',
                    feature: 'SharePoint sites'
                };
            default: // onedrive
                return {
                    name: 'OneDrive',
                    logo: '/logos/onedrive.svg',
                    description: 'Access your OneDrive files and SharePoint documents in DataIQ.',
                    feature: 'OneDrive files'
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
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: MICROSOFT_CLIENT_ID,
                    client_secret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET,
                    code,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'authorization_code',
                    scope: SCOPES
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for tokens');
            }

            const data = await response.json();

            // Get user info from Microsoft Graph
            const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });
            const userInfo = await userResponse.json();

            // Save connection
            const connection = saveMicrosoftConnection({
                connectorType: 'microsoft',
                connectionName: 'Microsoft',
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
                scope: SCOPES,
                userEmail: userInfo.userPrincipalName || userInfo.mail,
                status: 'connected',
            });

            toast.success(`Successfully connected to ${connectorInfo.name}!`);

            // Clean URL and redirect to connection detail page based on source
            window.history.replaceState({}, '', window.location.pathname);

            setTimeout(() => {
                navigate(`/dashboard/connection/${source}`);
            }, 1000);

        } catch (error) {
            console.error('OAuth error:', error);
            toast.error('Failed to connect. Please try again.');
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        setIsLoading(true);

        const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
        authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('scope', SCOPES);
        authUrl.searchParams.append('response_mode', 'query');
        authUrl.searchParams.append('state', Math.random().toString(36).substring(7));

        // Redirect to Microsoft OAuth
        window.location.href = authUrl.toString();
    };

    if (existingConnection) {
        // Already connected - redirect to connection detail page
        navigate(`/dashboard/connection/${source}`);
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
                            <div className="size-24 bg-gradient-to-br from-[#0078D4] to-[#50E6FF] rounded-3xl shadow-lg flex items-center justify-center">
                                <svg className="size-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            Connect {connectorInfo.name}
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
                            {connectorInfo.description}
                        </p>

                        {/* Secondary indicators - showing both will sync */}
                        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <div className="size-4 rounded bg-slate-100 flex items-center justify-center">
                                    <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623" />
                                    </svg>
                                </div>
                                <span>OneDrive</span>
                            </div>
                            <span className="text-slate-300">+</span>
                            <div className="flex items-center gap-1.5">
                                <div className="size-4 rounded bg-slate-100 flex items-center justify-center">
                                    <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623" />
                                    </svg>
                                </div>
                                <span>SharePoint</span>
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
                        <h3 className="font-semibold text-slate-900 mb-2">Unified Access</h3>
                        <p className="text-sm text-slate-600">
                            Connect once to access both OneDrive personal files and SharePoint business documents.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                        <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <ExternalLink className="size-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">AI-Powered Insights</h3>
                        <p className="text-sm text-slate-600">
                            Ask questions about your files and get instant AI analysis.
                        </p>
                    </div>
                </motion.div>

                {/* Connect Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Button
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-[#0078D4] to-[#00BCF2] hover:from-[#006ABC] hover:to-[#00A8E0] text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connecting...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623" />
                                </svg>
                                Connect with Microsoft
                            </div>
                        )}
                    </Button>

                    <div className="flex items-start gap-2 text-xs text-slate-500 max-w-md">
                        <Info className="size-4 mt-0.5 flex-shrink-0" />
                        <p>
                            You'll be redirected to Microsoft to authorize DataIQ. We'll access your OneDrive and SharePoint files - read-only permissions.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
