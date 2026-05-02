import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Github,
    Twitter,
    Linkedin,
    Youtube,
    MessageSquare,
    Search,
    BrainCircuit,
    BookOpen,
    Users,
    ChevronLeft,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';

// Types
type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface RewardTask {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    action: () => void;
    claimed: boolean;
}

export function OnboardingPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);

    // Step 1 State: Rewards
    const [tasks, setTasks] = useState<RewardTask[]>([
        {
            id: 'email',
            title: 'Email Verified',
            description: 'Your email has been verified',
            icon: () => (
                <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="size-6" />
                </div>
            ),
            action: () => { },
            claimed: true
        },
        {
            id: 'github',
            title: 'Star our GitHub repo',
            description: 'Check out our open source code and contribute',
            icon: () => (
                <div className="size-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                    <Github className="size-6" />
                </div>
            ),
            action: () => window.open('https://github.com/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'discord',
            title: 'Join our Discord',
            description: 'Connect with us and get community help',
            icon: () => (
                <div className="size-10 rounded-lg bg-[#5865F2] flex items-center justify-center text-white">
                    <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                </div>
            ),
            action: () => window.open('https://discord.gg/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'twitter',
            title: 'Follow us on X',
            description: 'Stay updated on new features and launches',
            icon: () => (
                <div className="size-10 rounded-lg bg-black flex items-center justify-center text-white">
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                </div>
            ),
            action: () => window.open('https://twitter.com/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'linkedin',
            title: 'Follow us on LinkedIn',
            description: 'Discover job opportunities and company updates',
            icon: () => (
                <div className="size-10 rounded-lg bg-[#0077B5] flex items-center justify-center text-white">
                    <Linkedin className="size-6" />
                </div>
            ),
            action: () => window.open('https://linkedin.com/company/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'youtube',
            title: 'Subscribe to our YouTube',
            description: 'Watch tutorials and product demos',
            icon: () => (
                <div className="size-10 rounded-lg bg-[#FF0000] flex items-center justify-center text-white">
                    <Youtube className="size-6" />
                </div>
            ),
            action: () => window.open('https://youtube.com/@dataiq', '_blank'),
            claimed: false
        }
    ]);

    // Step 2 State: Survey
    const [referralSource, setReferralSource] = useState<string>('');

    // Step 3 State: Legal
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [subscribedToUpdates, setSubscribedToUpdates] = useState(true);

    // Step 4 State: Profile/Org (Filling the gap)
    const [orgName, setOrgName] = useState('Personal');

    // Step 5 State: Team Invite
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');

    const handleClaim = (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, claimed: true } : t
        ));
    };

    const handleNext = async () => {
        if (currentStep < 5) { // Adjusted to match the number of rendered steps
            setCurrentStep(prev => (prev + 1) as OnboardingStep);
        } else {
            // Finish onboarding
            const user = auth.currentUser;
            if (user) {
                try {
                    const onboardingData = {
                        onboardingCompleted: true,
                        onboardingData: {
                            referralSource,
                            subscribedToUpdates,
                            orgName,
                            inviteRole,
                            completedAt: new Date().toISOString()
                        },
                        updatedAt: serverTimestamp()
                    };

                    await setDoc(doc(db, "users", user.uid), onboardingData, { merge: true });
                    toast.success("Onboarding complete! Welcome to DataIQ.");
                    navigate('/dashboard');
                } catch (error) {
                    console.error("DataIQ: Error saving onboarding data:", error);
                    toast.error("Failed to save onboarding progress. Please try again.");
                }
            } else {
                navigate('/login');
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => (prev - 1) as OnboardingStep);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-slate-900">Let's get you started</h1>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Optional</span>
                </div>
                <p className="text-slate-600 text-left">Complete these quick actions to earn bonus credits for your account.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => {
                            if (!task.claimed) {
                                task.action();
                                handleClaim(task.id);
                            }
                        }}
                        className={cn(
                            "p-5 rounded-2xl border transition-all cursor-pointer h-full flex flex-col justify-between group",
                            task.claimed
                                ? "bg-green-50/50 border-green-200"
                                : "bg-white border-slate-200 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
                        )}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <task.icon />
                                {task.claimed && (
                                    <div className="p-1 bg-green-500 rounded-full text-white">
                                        <CheckCircle2 className="size-4" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 tracking-tight">{task.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>
                            </div>
                        </div>

                        <div className="pt-5 mt-auto">
                            {task.claimed ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.25 rounded-full bg-green-100/50 text-green-700 text-[10px] font-bold uppercase tracking-widest border border-green-200 shadow-sm">
                                    Claimed
                                </div>
                            ) : (
                                <div className="text-primary text-sm font-bold flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                    Complete task
                                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-slate-900 text-left">How did you first hear about us?</h1>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Optional</span>
                </div>
                <p className="text-slate-600 text-left">Help us understand how people discover DataIQ.</p>
            </div>

            <div className="space-y-4">
                {[
                    {
                        id: 'search',
                        label: 'Search (Google/Bing)',
                        icon: () => (
                            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.15-1.185 4.12-.95 1.74-2.28 3.18-4.505 4.1a9.25 9.25 0 0 1-12.008-8.22 9.25 9.25 0 0 1 12.008-8.22c2.11.23 3.86 1.07 5.14 2.34l2.42-2.42C19.98 3.13 17.35 1.5 12.06 1.5c-6.19 0-11.06 5.06-11.06 11.25s4.87 11.25 11.06 11.25c3.21 0 6.03-1.16 8.24-3.32 2.13-2.08 3.16-5.06 3.16-7.84 0-.8-.07-1.42-.21-1.92h-10.75z" />
                                </svg>
                            </div>
                        )
                    },
                    {
                        id: 'ai',
                        label: 'AI Search (ChatGPT/Perplexity/etc.)',
                        icon: () => (
                            <div className="size-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.282 9.821a5.984 5.984 0 0 0-1.102-3.863 6.074 6.074 0 0 0-4.044-2.457 6.03 6.03 0 0 0-4.48 1.057A6.033 6.033 0 0 0 8.56 3.501a6.074 6.074 0 0 0-4.044 2.457 5.984 5.984 0 0 0-1.102 3.863 6.033 6.033 0 0 0-1.057 4.48 6.074 6.074 0 0 0 2.457 4.044 6.03 6.03 0 0 0 5.582 0.543l0.046-0.023c0.116-0.058 0.232-0.125 0.353-0.201l0.032-0.017A6.033 6.033 0 0 0 12 19.34a6.074 6.074 0 0 0 4.044-2.457 5.984 5.984 0 0 0 1.102-3.863 6.033 6.033 0 0 0 1.057-4.48l-0.018-0.076a5.94 5.94 0 0 0-0.419-1.22l-0.043-0.088a6.033 6.033 0 0 0-0.441-0.64ZM12.03 14.896c-1.026 0-1.859-0.832-1.859-1.859 0-1.026 0.833-1.859 1.859-1.859 1.026 0 1.859 0.833 1.859 1.859 0 1.027-0.833 1.859-1.859 1.859Z" />
                                </svg>
                            </div>
                        )
                    },
                    {
                        id: 'docs',
                        label: 'Blog/Docs/Tutorial',
                        icon: () => (
                            <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <BookOpen className="size-6" />
                            </div>
                        )
                    },
                    {
                        id: 'social',
                        label: 'Social Media',
                        icon: () => (
                            <div className="size-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <Users className="size-6" />
                            </div>
                        )
                    },
                ].map((option) => (
                    <div
                        key={option.id}
                        onClick={() => setReferralSource(option.id)}
                        className={cn(
                            "flex items-center gap-5 p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg",
                            referralSource === option.id
                                ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md"
                                : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        <option.icon />
                        <span className={cn(
                            "font-bold text-lg tracking-tight",
                            referralSource === option.id ? "text-primary" : "text-slate-700"
                        )}>{option.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-slate-900 text-left">Terms of Service & Privacy Policy</h1>
                </div>
                <p className="text-slate-600 text-left">Please review and accept our terms and privacy policy to continue.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-900">Terms of Service & Privacy Policy</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            I agree to DataIQ's <span className="text-primary underline cursor-pointer">Terms of Service</span> and <span className="text-primary underline cursor-pointer">Privacy Policy</span>.
                        </p>
                    </div>
                    <div
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                        className={cn(
                            "w-12 h-7 rounded-full transition-colors cursor-pointer relative",
                            agreedToTerms ? "bg-primary" : "bg-slate-200"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 size-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                            agreedToTerms ? "left-6" : "left-1"
                        )} />
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-700 font-medium">
                            I want to receive product updates and launch emails. You can unsubscribe at any time.
                        </p>
                    </div>
                    <div
                        onClick={() => setSubscribedToUpdates(!subscribedToUpdates)}
                        className={cn(
                            "w-12 h-7 rounded-full transition-colors cursor-pointer relative shrink-0 ml-4",
                            subscribedToUpdates ? "bg-primary" : "bg-slate-200"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 size-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                            subscribedToUpdates ? "left-6" : "left-1"
                        )} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-slate-900 text-left">Set up your workspace</h1>
                </div>
                <p className="text-slate-600 text-left">Create a home for your data projects.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Workspace Name</label>
                    <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="h-12 text-lg"
                        placeholder="e.g. Acme Corp, Personal"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-slate-900 text-left">Invite your team</h1>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Optional</span>
                </div>
                <p className="text-slate-600 text-left">Invite teammates to collaborate on your projects.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Team Name</label>
                    <Input
                        value={orgName}
                        readOnly
                        className="h-12 bg-slate-50 text-slate-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Invite team members</label>
                    <div className="flex gap-2">
                        <Input
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="h-12"
                        />
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="h-12 px-4 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option>Member</option>
                            <option>Admin</option>
                        </select>
                        <Button variant="outline" className="h-12 px-6">
                            Add
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                        Invited members will receive an email with instructions to join your team when you continue.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header / Progress */}
            <div className="max-w-5xl mx-auto w-full px-6 py-8">
                <div className="flex items-center gap-2 mb-8">
                    {/* Progress Bar */}
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map((step) => (
                            <div
                                key={step}
                                className={cn(
                                    "w-8 h-2 rounded-full transition-colors",
                                    step === currentStep
                                        ? "bg-primary" // Creating the orange-ish look logic from screenshot but using primary
                                        : step < currentStep
                                            ? "bg-primary/30"
                                            : "bg-slate-100"
                                )}
                            />
                        ))}
                    </div>
                    <div className="ml-auto bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider">
                        Step {currentStep} of 6
                    </div>
                </div>

                {/* Content Area */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[400px]"
                >
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                    {currentStep === 5 && renderStep5()}
                    {/* Step 6 handled by completion logic or loading state */}
                </motion.div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-slate-100 bg-white py-6">
                <div className="max-w-5xl mx-auto px-6 w-full flex items-center justify-between">
                    <div>
                        {currentStep > 1 && (
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                className="text-slate-500 hover:text-slate-900 font-medium"
                            >
                                <ChevronLeft className="size-4 mr-2" />
                                Back
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {currentStep !== 3 && currentStep !== 4 && ( // Hide skip on mandatory steps if any
                            <Button
                                variant="ghost"
                                onClick={handleNext}
                                className="text-slate-500 hover:text-slate-900 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    {/* Using a skip icon like functionality */}
                                    Skip
                                </div>
                            </Button>
                        )}

                        <Button
                            onClick={handleNext}
                            disabled={currentStep === 3 && !agreedToTerms}
                            className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                        >
                            Continue
                            <ArrowRight className="size-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
