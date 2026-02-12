import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, CheckCircle2, ChevronDown, Send, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import logoImage from '../../assets/90c5d6bf4c03d5cb5ffab3af18389097f479007b.png';

export function ConnectorRequestPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        connector: '',
        email: ''
    });

    const handleNext = () => {
        if (step === 1) {
            if (!formData.connector.trim()) {
                toast.error("Please tell us which connector you need");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!formData.email.trim() || !formData.email.includes('@')) {
                toast.error("Please enter a valid email address");
                return;
            }
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setStep(3); // Success step
        toast.success("Request submitted successfully!");
    };

    const stepVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] w-full flex flex-col items-start justify-start p-8 md:p-12 animate-in fade-in duration-500">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-16">
                <img src={logoImage} alt="DataIQ" className="h-10 w-auto object-contain" />
                <span className="font-bold text-2xl text-primary tracking-tight">DataIQ</span>
                <span className="mx-3 h-6 w-px bg-slate-200" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                    <Sparkles className="size-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connectors Roadmap</span>
                </div>
            </div>

            <div className="w-full max-w-3xl">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-12"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary border border-primary/20">1</div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Required Information</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                                    Which data connector would you <br />
                                    <span className="text-primary underline decoration-primary/10 underline-offset-[12px]">like us to add next?</span>
                                </h1>
                                <p className="text-slate-500 font-medium text-lg">We prioritize our roadmap based on direct feedback from our community.</p>
                            </div>

                            <div className="relative group max-w-2xl">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Connector Name</label>
                                <Input
                                    autoFocus
                                    placeholder="e.g. ClickUp, Salesforce, HubSpot..."
                                    value={formData.connector}
                                    onChange={(e) => setFormData(prev => ({ ...prev, connector: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                    className="w-full h-16 text-2xl md:text-3xl border-x-0 border-t-0 border-b-2 border-slate-100 focus:border-primary bg-transparent rounded-none px-0 shadow-none focus-visible:ring-0 transition-all font-bold placeholder:text-slate-200 placeholder:font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-8">
                                <Button
                                    onClick={handleNext}
                                    className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 group transition-all"
                                >
                                    Continue
                                    <ArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <span className="text-sm font-bold text-slate-400">Press <code className="bg-slate-100 px-2 py-1 rounded text-slate-600">Enter</code> to continue</span>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-12"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary border border-primary/20">2</div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Contact Details</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                                    What's your <span className="text-primary underline decoration-primary/10 underline-offset-[12px]">email address?</span>
                                </h1>
                                <p className="text-slate-500 font-medium text-lg">We'll notify you as soon as <span className="text-slate-900 font-bold italic">"{formData.connector || 'the connector'}"</span> starts its beta phase.</p>
                            </div>

                            <div className="relative group max-w-2xl">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Professional Email</label>
                                <Input
                                    autoFocus
                                    type="email"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                    className="w-full h-16 text-2xl md:text-3xl border-x-0 border-t-0 border-b-2 border-slate-100 focus:border-primary bg-transparent rounded-none px-0 shadow-none focus-visible:ring-0 transition-all font-bold placeholder:text-slate-200 placeholder:font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-10 pt-8">
                                <Button
                                    onClick={handleNext}
                                    disabled={isSubmitting}
                                    className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 group transition-all"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Request"}
                                    {!isSubmitting && <Send className="size-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                </Button>
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-all group"
                                >
                                    <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                                    Change connector
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="success"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            className="space-y-10 py-12"
                        >
                            <div className="size-20 bg-green-50 rounded-full flex items-center justify-center shadow-inner border border-green-100">
                                <CheckCircle2 className="size-10 text-green-500" />
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Request Received!</h1>
                                <p className="text-slate-500 font-medium text-xl max-w-xl leading-relaxed">
                                    Thank you for helping us shape the future of DataIQ. Our engineering team has been notified about <span className="text-primary font-bold italic">"{formData.connector}"</span>.
                                </p>
                            </div>
                            <div className="pt-8">
                                <Button
                                    onClick={() => navigate('/dashboard/ingestion')}
                                    className="h-14 px-10 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-lg transition-all shadow-sm"
                                >
                                    Back to Dashboard
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Indicators - Adjusted for left align */}
                {step < 3 && (
                    <div className="flex gap-3 mt-24">
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 1 ? 'bg-primary w-12' : 'bg-slate-100 w-6'}`} />
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary w-12' : 'bg-slate-100 w-6'}`} />
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/dashboard/ingestion')}
                className="mt-20 flex items-center gap-2 text-slate-400 font-bold hover:text-primary transition-colors group"
            >
                <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                Cancel and return
            </button>
        </div>
    );
}
