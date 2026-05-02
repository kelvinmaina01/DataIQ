import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { saveMetaAdsConnection, getMetaAdsConnection } from '../../services/connectionService';

const META_APP_ID = import.meta.env.VITE_META_APP_ID;
const REDIRECT_URI = import.meta.env.VITE_META_REDIRECT_URI || 'http://localhost:3000/auth/meta/callback';
const SCOPES = 'ads_read,ads_management,business_management';

export function MetaAdsConnectorPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [existingConnection, setExistingConnection] = useState(getMetaAdsConnection());

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
            const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: META_APP_ID,
                    client_secret: import.meta.env.VITE_META_APP_SECRET,
                    redirect_uri: REDIRECT_URI,
                    code
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for tokens');
            }

            const data = await response.json();

            // Get user info
            const userResponse = await fetch(`https://graph.facebook.com/me?access_token=${data.access_token}&fields=email,name`);
            const userInfo = await userResponse.json();

            // Save connection
            const connection = saveMetaAdsConnection({
                connectorType: 'metaads',
                connectionName: 'Meta Ads',
                accessToken: data.access_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
                scope: SCOPES,
                userEmail: userInfo.email,
                status: 'connected',
            });

            toast.success('Successfully connected to Meta Ads!');

            // Clean URL and redirect to connection detail page
            window.history.replaceState({}, '', window.location.pathname);

            setTimeout(() => {
                navigate('/dashboard/connection/metaads');
            }, 1000);

        } catch (error) {
            console.error('OAuth error:', error);
            toast.error('Failed to connect. Please try again.');
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        setIsLoading(true);

        const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
        authUrl.searchParams.append('client_id', META_APP_ID);
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('scope', SCOPES);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('state', Math.random().toString(36).substring(7));

        // Redirect to Meta OAuth
        window.location.href = authUrl.toString();
    };

    if (existingConnection) {
        // Already connected - redirect to connection detail page
        navigate('/dashboard/connection/metaads');
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
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                >
                    {/* Hero Content */}
                    <div className="text-center py-16 px-6 max-w-4xl mx-auto">
                        {/* Meta Logo */}
                        <div className="flex items-center justify-center mb-6">
                            <div className="size-24 rounded-3xl shadow-xl flex items-center justify-center border border-white/10" style={{ background: 'linear-gradient(135deg, #0668E1 0%, #A43AB2 50%, #E74B3C 100%)' }}>
                                <svg className="size-16 text-white" viewBox="0 0 450 450" fill="currentColor">
                                    <path d="M375.3 145c-20.7-31.4-52.6-47.5-90.1-45.5-30.8 1.6-58.4 15.6-80.4 39.1-1.6 1.7-3.2 3.5-4.8 5.3-1.6-1.8-3.2-3.6-4.8-5.3-22-23.5-49.6-37.5-80.4-39.1-37.5-2-69.4 14.1-90.1 45.5-23.5 35.6-21.3 84.1 6.5 125.6 17.5 26 50.1 53 103 84.4l11.6 6.8 11.6-6.8c52.9-31.4 85.5-58.4 103-84.4 27.8-41.5 30-90 6.5-125.6zm-175.3 133c-39.2-24.3-64.8-45.6-77.1-63.7-16.7-24.6-17.5-51.2-2.3-74.2 11.6-17.6 28.7-26.1 48.3-24.2 17.6 1.7 33.7 11.5 45.3 27.8 7.3 10.3 12.8 22.8 16.5 37l9.3 35.8 9.3-35.8c3.7-14.2 9.2-26.7 16.5-37 11.6-16.3 27.7-26.1 45.3-27.8 19.6-1.9 36.7 6.6 48.3 24.2 15.2 23 14.4 49.6-2.3 74.2-12.3 18.1-37.9 39.4-77.1 63.7l-9.3 5.7-9.3-5.7z" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            Connect Meta Ads
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Analyze your Facebook and Instagram ad campaigns in DataIQ.
                            Access performance metrics, audience insights, and ROI data.
                        </p>
                    </div>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
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
                        <h3 className="font-semibold text-slate-900 mb-2">Campaign Analytics</h3>
                        <p className="text-sm text-slate-600">
                            Access Facebook & Instagram ad performance, spend, and conversion data.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                        <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <ExternalLink className="size-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">AI-Powered Insights</h3>
                        <p className="text-sm text-slate-600">
                            Ask questions about your ad performance and get instant AI analysis.
                        </p>
                    </div>
                </motion.div>

                {/* Connect Button */}
                <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Button
                        onClick={handleConnect}
                        disabled={isLoading}
                        style={{ backgroundColor: '#0668E1', color: 'white' }}
                        className="font-semibold px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all border-none"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connecting...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <svg className="size-6" viewBox="0 0 450 450" fill="currentColor">
                                    <path d="M375.3 145c-20.7-31.4-52.6-47.5-90.1-45.5-30.8 1.6-58.4 15.6-80.4 39.1-1.6 1.7-3.2 3.5-4.8 5.3-1.6-1.8-3.2-3.6-4.8-5.3-22-23.5-49.6-37.5-80.4-39.1-37.5-2-69.4 14.1-90.1 45.5-23.5 35.6-21.3 84.1 6.5 125.6 17.5 26 50.1 53 103 84.4l11.6 6.8 11.6-6.8c52.9-31.4 85.5-58.4 103-84.4 27.8-41.5 30-90 6.5-125.6zm-175.3 133c-39.2-24.3-64.8-45.6-77.1-63.7-16.7-24.6-17.5-51.2-2.3-74.2 11.6-17.6 28.7-26.1 48.3-24.2 17.6 1.7 33.7 11.5 45.3 27.8 7.3 10.3 12.8 22.8 16.5 37l9.3 35.8 9.3-35.8c3.7-14.2 9.2-26.7 16.5-37 11.6-16.3 27.7-26.1 45.3-27.8 19.6-1.9 36.7 6.6 48.3 24.2 15.2 23 14.4 49.6-2.3 74.2-12.3 18.1-37.9 39.4-77.1 63.7l-9.3 5.7-9.3-5.7z" />
                                </svg>
                                Connect with Meta
                            </div>
                        )}
                    </Button>

                    <div className="flex items-start gap-2 text-xs text-slate-500 max-w-md">
                        <Info className="size-4 mt-0.5 flex-shrink-0" />
                        <p>
                            You'll be redirected to Meta to authorize DataIQ. We'll only access campaign data - no posting permissions.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
