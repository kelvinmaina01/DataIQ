import { Button } from '../../components/ui/button';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

export function VerificationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || 'your email';
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        setIsResending(true);
        try {
            // We need a user object to resend. 
            // If they just signed up, they might be signed out, 
            // but Firebase often keeps a reference or we can ask them to log in to resend.
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                toast.success("Verification email resent!");
            } else {
                toast.error("Please log in to resend the verification email.");
                navigate('/login');
            }
        } catch (error: any) {
            console.error("DataIQ: Resend error:", error);
            toast.error(error.message || "Failed to resend email.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in w-full text-center">
            <div className="flex justify-center flex-col items-center gap-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Mail className="h-10 w-10 text-primary animate-bounce" />
                </div>
                <p className="text-[#667085] max-w-[350px] mx-auto text-lg leading-relaxed">
                    We've sent a magic link to <a
                        href={`mailto:${email}`}
                        className="font-bold text-gray-900 border-b-2 border-primary/20 hover:text-primary hover:border-primary transition-all cursor-pointer"
                    >
                        {email}
                    </a>.
                    Click the link in your email to instantly activate your DataIQ workspace.
                </p>
            </div>

            <div className="space-y-4 pt-6">
                <Button
                    onClick={() => navigate('/login')}
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transition-all"
                >
                    Return to Login
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>

                <Button
                    variant="ghost"
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full h-12 text-sm font-medium text-[#667085] hover:text-primary hover:bg-primary/5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    <RefreshCw className={cn("h-4 w-4", isResending && "animate-spin")} />
                    {isResending ? "Sending fresh link..." : "Didn't receive it? Resend magic link"}
                </Button>
            </div>

            <div className="pt-4">
                <p className="text-xs text-[#94A3B8] italic">
                    Tip: Check your spam or promotions folder if it doesn't arrive in a minute.
                </p>
            </div>
        </div>
    );
}
