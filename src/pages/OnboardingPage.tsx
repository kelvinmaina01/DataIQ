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
            icon: CheckCircle2,
            action: () => { },
            claimed: true
        },
        {
            id: 'github',
            title: 'Star our GitHub repo',
            description: 'Check out our open source code and contribute',
            icon: Github,
            action: () => window.open('https://github.com/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'discord',
            title: 'Join our Discord',
            description: 'Connect with us and get community help',
            icon: MessageSquare,
            action: () => window.open('https://discord.gg/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'twitter',
            title: 'Follow us on X',
            description: 'Stay updated on new features and launches',
            icon: Twitter,
            action: () => window.open('https://twitter.com/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'linkedin',
            title: 'Follow us on LinkedIn',
            description: 'Discover job opportunities and company updates',
            icon: Linkedin,
            action: () => window.open('https://linkedin.com/company/dataiq', '_blank'),
            claimed: false
        },
        {
            id: 'youtube',
            title: 'Subscribe to our YouTube',
            description: 'Watch tutorials and product demos',
            icon: Youtube,
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

    const handleNext = () => {
        if (currentStep < 6) {
            setCurrentStep(prev => (prev + 1) as OnboardingStep);
        } else {
            // Finish onboarding
            navigate('/dashboard');
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
                            "p-4 rounded-xl border transition-all cursor-pointer h-full flex flex-col justify-between",
                            task.claimed
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-slate-200 hover:border-primary/50 hover:shadow-md"
                        )}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900">{task.title}</h3>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>
                        </div>

                        <div className="pt-4 mt-auto">
                            {task.claimed ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100/50 text-green-700 text-xs font-bold uppercase tracking-wide border border-green-200">
                                    <CheckCircle2 className="size-3.5" />
                                    Claimed
                                </div>
                            ) : (
                                <div className="text-primary text-sm font-medium hover:underline">
                                    Complete task →
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

            <div className="space-y-3">
                {[
                    { id: 'search', label: 'Search (Google/Bing)', icon: Search },
                    { id: 'ai', label: 'AI Search (ChatGPT/Perplexity/etc.)', icon: BrainCircuit },
                    { id: 'docs', label: 'Blog/Docs/Tutorial', icon: BookOpen },
                    { id: 'social', label: 'Social Media', icon: Users },
                ].map((option) => (
                    <div
                        key={option.id}
                        onClick={() => setReferralSource(option.id)}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                            referralSource === option.id
                                ? "bg-primary/5 border-primary ring-1 ring-primary"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        <option.icon className={cn(
                            "size-5",
                            referralSource === option.id ? "text-primary" : "text-slate-400"
                        )} />
                        <span className={cn(
                            "font-medium",
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
