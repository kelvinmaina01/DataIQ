import { Button } from '@/components/ui/button';
import { Github, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = (e: FormEvent) => {
        e.preventDefault();
        console.log("Sign Up with", { name, email });
    };

    return (
        <div className="space-y-6 animate-fade-in w-full">
            <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-[#344054]">Full Name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="flex h-11 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-[#344054]">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
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
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 rounded-lg shadow-sm mt-2 border border-transparent">
                    Create Account
                </Button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or sign up with</span>
                </div>
            </div>

            <div className="space-y-3">
                <Button variant="outline" className="w-full h-11 font-medium border-blue-200 text-[#344054] hover:bg-gray-50 rounded-lg bg-white relative shadow-sm">
                    <svg className="mr-2 h-5 w-5 absolute left-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign up with Google
                </Button>

                <Button variant="outline" className="w-full h-11 font-medium border-blue-200 text-[#344054] hover:bg-gray-50 rounded-lg bg-white shadow-sm">
                    <Github className="mr-2 h-4 w-4" />
                    Sign up with GitHub
                </Button>
            </div>
        </div>
    );
}
