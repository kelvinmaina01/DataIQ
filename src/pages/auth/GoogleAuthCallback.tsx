import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function GoogleAuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // Forward the code/error to the connector page which handles the exchange
        const params = new URLSearchParams(window.location.search);
        navigate(`/dashboard/ingestion/connect/google-sheets?${params.toString()}`);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-slate-600">Redirecting to setup...</p>
            </div>
        </div>
    );
}
