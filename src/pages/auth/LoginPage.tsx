import { Button } from '../../components/ui/button';
import { Wand2, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider } from '../../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.emailVerified) {
                    navigate('/dashboard');
                } else {
                    // Stay on login page or redirect if we came from somewhere else
                    // For now, let's keep them here so they can see the toast from handleLogin
                }
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const checkRateLimit = (): boolean => {
        const now = Date.now();
        const limitWindow = 60 * 1000; // 1 minute
        const maxAttempts = 10;

        try {
            const attemptsData = localStorage.getItem('login_attempts');
            let attempts: number[] = attemptsData ? JSON.parse(attemptsData) : [];

            // Filter attempts within the last minute
            attempts = attempts.filter(timestamp => now - timestamp < limitWindow);

            if (attempts.length >= maxAttempts) {
                const oldestAttempt = attempts[0];
                const secondsRemaining = Math.ceil((limitWindow - (now - oldestAttempt)) / 1000);
                toast.error(`Too many login attempts. Please try again in ${secondsRemaining} seconds.`);
                return false;
            }

            // Add current attempt and save
            attempts.push(now);
            localStorage.setItem('login_attempts', JSON.stringify(attempts));
            return true;
        } catch (e) {
            console.error("Rate limit check failed", e);
            return true; // Fallback to allowing login if storage fails
        }
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();

        if (!checkRateLimit()) return;

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        setIsLoading(true);
        try {
            const cleanEmail = email.trim();
            console.log("DataIQ: Starting login for", cleanEmail);
            const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
            const user = userCredential.user;
            if (!user.emailVerified) {
                console.log("DataIQ: User not verified, attempting to resend email...");
                try {
                    await sendEmailVerification(user);
                    console.log("DataIQ: Verification email resent successfully.");
                    toast.info("Verify your email to continue", {
                        description: "We've sent a fresh verification link to your inbox. Please check your email to activate your account."
                    });
                } catch (sendError: any) {
                    console.error("DataIQ: Error resending verification email:", sendError);
                    toast.error("Account requires verification", {
                        description: "We couldn't send the verification link automatically. Please try again or use the 'Resend' button on the next screen."
                    });
                }

                await signOut(auth);
                navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
                return;
            }

            console.log("DataIQ: Navigating to dashboard...");
            toast.success("Successfully logged in!");
            navigate('/dashboard');
        } catch (error: any) {
            console.error("DataIQ: Login error (Code:", error.code, "):", error.message);
            if (error.code === 'auth/invalid-credential') {
                toast.error("Invalid email or password. Please try again or sign up if you don't have an account.");
            } else if (error.code === 'auth/user-disabled') {
                toast.error("This account has been disabled. Please contact support.");
            } else {
                toast.error(`Error (${error.code}): ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success("Successfully logged in with Google!");
            navigate('/dashboard');
        } catch (error: any) {
            console.error("Google login error:", error);
            if (error.code === 'auth/account-exists-with-different-credential') {
                toast.error("An account already exists with this email using a different login method. Please use your original method.");
            } else if (error.code === 'auth/cancelled-popup-request') {
                // Ignore, as this usually means another request was started or it timed out
                console.log("Concurrent popup request swallowed");
            } else if (error.code === 'auth/popup-closed-by-user') {
                toast.error("Login cancelled. Popup was closed before completion.");
            } else {
                toast.error(error.message || "Failed to log in with Google.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await signInWithPopup(auth, githubProvider);
            toast.success("Successfully logged in with GitHub!");
            navigate('/dashboard');
        } catch (error: any) {
            console.error("GitHub login error:", error);
            if (error.code === 'auth/account-exists-with-different-credential') {
                toast.error("An account already exists with this email using a different login method. Please use your original method.");
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.log("Concurrent popup request swallowed");
            } else if (error.code === 'auth/popup-closed-by-user') {
                toast.error("Login cancelled. Popup was closed before completion.");
            } else {
                toast.error(error.message || "Failed to log in with GitHub.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Please enter your email address first.");
            return;
        }
        try {
            console.log("DataIQ: Sending password reset email to:", email.trim());
            await sendPasswordResetEmail(auth, email.trim());
            toast.success("Password reset email sent! Please check your inbox.");
        } catch (error: any) {
            console.error("DataIQ: Forgot password error:", error);
            if (error.code === 'auth/user-not-found') {
                toast.error("No account found with this email.");
            } else {
                toast.error(error.message || "Failed to send reset email.");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in w-full">
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-[#344054]">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="flex h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-[#344054]">Password</label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="flex h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all pr-10 shadow-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="remember" className="h-4 w-4 rounded border-blue-200 text-primary focus:ring-primary" />
                        <label htmlFor="remember" className="text-sm text-[#344054]">Remember for 30 days</label>
                    </div>
                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-sm font-semibold text-primary hover:text-primary/80"
                    >
                        Forgot password
                    </button>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 rounded-lg shadow-sm mt-2 border border-transparent"
                    disabled={isLoading}
                >
                    {isLoading ? "Signing in..." : "Sign in"}
                </Button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
            </div>

            <div className="space-y-3">
                <Button
                    variant="outline"
                    className="w-full h-11 font-medium border-blue-200 text-[#344054] hover:bg-gray-50 rounded-lg bg-white flex items-center justify-center gap-2 shadow-sm"
                    onClick={handleGoogleLogin}
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </Button>

                <Button
                    variant="outline"
                    className="w-full h-11 font-medium border-blue-200 text-[#344054] hover:bg-gray-50 rounded-lg bg-white flex items-center justify-center gap-2 shadow-sm"
                    onClick={handleGithubLogin}
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    Sign in with GitHub
                </Button>

                {/* Magic link placeholder */}
                <Button
                    variant="outline"
                    className="w-full h-11 font-medium border-blue-200 text-[#344054] hover:bg-gray-50 rounded-lg bg-white flex items-center justify-center gap-2 shadow-sm"
                    onClick={() => toast.info("Magic link will be available soon!")}
                >
                    <Wand2 className="h-4 w-4" />
                    Sign in with Magic Link
                </Button>
            </div>
        </div>
    );
}
