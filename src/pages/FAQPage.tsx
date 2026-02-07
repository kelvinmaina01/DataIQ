import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Smile,
    Layers,
    FileText,
    User,
    Mail,
    MessageCircle,
    PlayCircle,
    CreditCard,
    FileMinus,
    ChevronDown,
    Plus,
    Shield,
    Lock
} from 'lucide-react';

const faqs = [
    {
        question: "Is there a free trial available?",
        answer: "Yes, you can try DataIQ for free for 30 days. If you want, we'll provide you with a free 30-minute onboarding call to get you up and running.",
        icon: Smile
    },
    {
        question: "Can I get a custom plan for my enterprise?",
        answer: "Yes, we offer custom plans for large organizations with advanced security, dedicated support, and higher data limits. Contact our sales team to learn more.",
        icon: User
    },
    {
        question: "Can I change my plan later?",
        answer: "Absolutely. You can upgrade or downgrade your plan at any time from your settings.",
        icon: Layers
    },
    {
        question: "What is your cancellation policy?",
        answer: "You can cancel your subscription at any time. We offering a 30-day money-back guarantee for all paid plans.",
        icon: FileMinus
    },
    {
        question: "Can other info be added to an invoice?",
        answer: "Yes, you can add your company VAT/Tax ID and address to your invoices from the billing settings page.",
        icon: User
    },
    {
        question: "How does billing work?",
        answer: "We offer monthly and annual billing options. You can pay via credit card (Stripe) or invoice for enterprise plans.",
        icon: CreditCard
    },
    {
        question: "How do I change my account email?",
        answer: "You can change your account email from your profile settings. A verification link will be sent to your new address.",
        icon: Mail
    },
    {
        question: "How does support work?",
        answer: "We provide 24/7 chat support for all users. Enterprise customers get a dedicated Customer Success Manager and priority SLAs.",
        icon: MessageCircle
    },
    {
        question: "Do you provide tutorials?",
        answer: "Yes, we have an extensive knowledge base, video tutorials, and interactive guides within the platform to help you master DataIQ.",
        icon: PlayCircle
    },
    {
        question: "How do I export my analysis reports?",
        answer: "You can export your analysis as PDF, CSV, or Interactive Markdown. Simply click the export button at the top right of any analysis view.",
        icon: FileText
    },
    {
        question: "Which AI models are available for research?",
        answer: "We offer access to the latest frontier models including GPT-4o, Claude 3.5 Sonnet, and specialized open-weights models for privacy-sensitive research.",
        icon: Sparkles
    },
    {
        question: "Can I integrate DataIQ with Slack or Microsoft Teams?",
        answer: "Yes, you can configure notifications and AI summaries to be pushed directly to your team's communication channels via our integrations dashboard.",
        icon: MessageCircle
    },
    {
        question: "Do you support automated data ingestion?",
        answer: "Our enterprise plans support webhook listeners and scheduled CRON jobs to automatically sync your data sources every hour.",
        icon: Layers
    },
    {
        question: "What is the difference between Thinking and Fast modes?",
        answer: "Fast mode uses optimized models for quick summaries, while Thinking mode uses reasoning-heavy models for deep research and complex architecture analysis.",
        icon: PlayCircle
    }
];

const integrations = [
    { name: "Supabase", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/supabase.svg" },
    { name: "Databricks", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/databricks.svg" },
    { name: "Airtable", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/airtable.svg" },
    { name: "MotherDuck", logo: "https://motherduck.com/favicon.ico" },
    { name: "Google Ads", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googleads.svg" },
    { name: "Google Analytics", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googleanalytics.svg" },
    { name: "Google Sheets", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googlesheets.svg" },
    { name: "Slack", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/slack.svg" },
    { name: "PostgreSQL", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/postgresql.svg" },
    { name: "BigQuery", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googlecloud.svg" },
    { name: "Amazon Redshift", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/amazonredshift.svg" },
    { name: "Snowflake", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/snowflake.svg" },
    { name: "Stripe", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/stripe.svg" },
    { name: "PostHog", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/posthog.svg" },
    { name: "HubSpot", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/hubspot.svg" }
];

export function FAQPage() {
    const [visibleCount, setVisibleCount] = useState(7);

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + 3, faqs.length));
    };

    const visibleFaqs = faqs.slice(0, visibleCount);
    const hasMore = visibleCount < faqs.length;

    return (
        <div className="min-h-screen bg-white relative overflow-hidden selection:bg-primary/10 selection:text-primary">
            {/* Background Grid Pattern - Fainter and further apart */}
            <div
                className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]"
                aria-hidden="true"
            />

            {/* Radial Gradient to 'soften' the grid in the center/content area - Stronger white patch */}
            <div
                className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,transparent_100%)] md:bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,transparent_60%)]"
                aria-hidden="true"
            />

            <Navigation />

            <main className="relative pt-24 pb-48 md:pb-96 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-4 animate-fade-in relative">
                    <div className="flex justify-center mb-6">
                        <div className="bg-transparent p-0">
                            <Sparkles className="h-8 w-8 text-[#101828]" fill="currentColor" />
                        </div>
                    </div>
                    {/* Highlight 'questions' in primary color and stretch spacing */}
                    <h1 className="text-4xl md:text-5xl font-bold tracking-wider [word-spacing:4px] text-[#101828]">
                        Frequently asked <span className="text-primary">questions</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto tracking-wide [word-spacing:2px]">
                        These are the most commonly asked questions about DataIQ and billing. <br className="hidden md:block" />
                        Can't find what you're looking for? <a href="#" className="text-primary font-medium hover:underline underline-offset-4">Chat to our friendly team!</a>
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <Accordion type="single" collapsible className="w-full space-y-0">
                        {visibleFaqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-0 px-0">
                                <AccordionTrigger className="hover:no-underline py-6 [&[data-state=open]]:text-primary transition-colors group">
                                    <div className="flex items-center gap-5 text-left w-full">
                                        {/* Updated icon color to blue theme */}
                                        <div className="p-2.5 rounded-full border border-primary/20 text-primary shrink-0 bg-blue-50/30 group-hover:border-primary/50 group-hover:bg-blue-50 transition-colors">
                                            <faq.icon className="h-6 w-6" strokeWidth={2} />
                                        </div>
                                        <span className="text-xl font-semibold text-[#101828] flex-1 tracking-wide [word-spacing:1px]">{faq.question}</span>
                                    </div>
                                </AccordionTrigger>
                                {/* Updated answer color to blue as requested - Increased size */}
                                <AccordionContent className="text-lg text-primary pl-[4.25rem] pb-8 leading-relaxed tracking-wide font-medium">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {/* Explore More Button - Intentional Premium Hover + Functional Load More */}
                <div className="flex justify-center mb-16 md:mb-24">
                    {hasMore && (
                        <Button
                            variant="outline"
                            onClick={handleLoadMore}
                            className="rounded-full px-8 h-12 border-primary text-primary font-bold hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-md flex items-center gap-2 group"
                        >
                            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                            Explore more
                        </Button>
                    )}
                </div>

                {/* Integrations Marquee Section */}
                <div className="mb-24 md:mb-32 overflow-hidden py-10 relative">
                    <div className="text-center mb-10">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary/60 mb-2">Powering your entire stack</h2>
                        <p className="text-2xl font-bold text-[#101828]">Seamlessly connect with your favorite tools</p>
                    </div>

                    {/* Marquee Container */}
                    <div className="flex relative items-center">
                        {/* Gradient Fades for the edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        <div className="flex gap-8 animate-marquee whitespace-nowrap min-w-full items-center">
                            {[...integrations, ...integrations].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/50 backdrop-blur-sm border border-gray-100 rounded-2xl px-6 py-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
                                    <div className="w-10 h-10 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
                                        <img src={item.logo} alt={item.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <span className="font-bold text-[#101828] text-lg tracking-tight">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <style>{`
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(calc(-50% - 1rem)); }
                        }
                        .animate-marquee {
                            animation: marquee 40s linear infinite;
                        }
                        .animate-marquee:hover {
                            animation-play-state: paused;
                        }
                    `}</style>
                </div>

                {/* New Security & Compliance Section */}
                <div className="py-24 md:py-32 border-y border-gray-100 bg-gray-50/30 rounded-[3rem] px-8 md:px-16 mb-24 md:mb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left Side: Text */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#101828] leading-tight tracking-tight">
                                    Enterprise-ready security <br />& compliance
                                </h2>
                                <p className="text-xl font-semibold text-primary tracking-wide">
                                    Security isn't a feature—it's our commitment to you.
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                                    We take a proactive approach to security to address any potential concerns before they become vulnerabilities.
                                </p>
                            </div>

                            <Button className="rounded-full px-10 h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300">
                                Learn more
                            </Button>

                            {/* Compliance Badges */}
                            <div className="pt-8 flex flex-wrap gap-8 items-center border-t border-gray-100">
                                <div className="flex items-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-200 group-hover:border-primary/50 transition-colors">
                                        <FileText className="h-5 w-5 text-gray-500 group-hover:text-primary" />
                                    </div>
                                    <span className="font-semibold text-gray-600 group-hover:text-primary transition-colors">SOC2 Compliant</span>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-200 group-hover:border-primary/50 transition-colors">
                                        <Shield className="h-5 w-5 text-gray-500 group-hover:text-primary" />
                                    </div>
                                    <span className="font-semibold text-gray-600 group-hover:text-primary transition-colors">GDPR Ready</span>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-200 group-hover:border-primary/50 transition-colors">
                                        <Lock className="h-5 w-5 text-gray-500 group-hover:text-primary" />
                                    </div>
                                    <span className="font-semibold text-gray-600 group-hover:text-primary transition-colors">CCPA Ready</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Visual */}
                        <div className="relative flex justify-center lg:justify-end">
                            <div className="relative w-full max-w-lg aspect-square bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex items-center justify-center p-8 group">
                                {/* Decorative Grid in visual */}
                                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]"></div>

                                {/* Animated Security Icons */}
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="flex flex-col items-center gap-3 animate-pulse">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 rounded-2xl flex items-center justify-center border border-green-200 shadow-inner">
                                            <Shield className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
                                        </div>
                                        <span className="bg-black text-white text-[10px] uppercase font-bold px-3 py-1 rounded-md tracking-tighter">Secure</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-20 h-24 md:w-24 md:h-32 bg-red-500 rounded-3xl flex items-center justify-center shadow-2xl transform -translate-y-4 hover:scale-110 transition-transform duration-500">
                                            <Lock className="h-10 w-10 md:h-12 md:w-12 text-white" />
                                        </div>
                                        <span className="bg-black text-white text-[10px] uppercase font-bold px-3 py-1 rounded-md tracking-tighter">Restricted</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-3 animate-pulse" style={{ animationDelay: '0.5s' }}>
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-200 shadow-inner">
                                            <User className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                                        </div>
                                        <span className="bg-black text-white text-[10px] uppercase font-bold px-3 py-1 rounded-md tracking-tighter">Private</span>
                                    </div>
                                </div>

                                {/* Floating Eye icon as seen in screenshot */}
                                <div className="absolute top-1/4 right-1/4 animate-bounce duration-[3000ms]">
                                    <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                                        <div className="h-6 w-10 border-2 border-primary rounded-full relative flex items-center justify-center">
                                            <div className="h-3 w-3 bg-primary rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section - Book a 1-on-1 onboarding */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center bg-transparent animate-slide-up max-w-6xl mx-auto mb-48 md:mb-64" style={{ animationDelay: '0.2s' }}>
                    {/* Left Side: Text - Occupying 50% */}
                    <div className="space-y-6 text-center lg:text-left">
                        <h3 className="text-3xl lg:text-4xl font-bold text-[#101828] tracking-tight">Book a 1-on-1 onboarding</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Get up and running as fast as possible with a personalized onboarding call. We'll show you how everything works and how you can get started with DataIQ.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
                            <Button variant="outline" size="lg" className="rounded-full px-8 font-semibold border-2 border-primary text-primary hover:bg-blue-50 hover:text-primary hover:scale-105 transition-all duration-300 h-12">
                                Learn more
                            </Button>
                            <Button size="lg" className="rounded-full px-8 font-semibold bg-primary hover:bg-primary/90 text-white hover:scale-105 hover:shadow-xl transition-all duration-300 h-12 shadow-md">
                                Book 30 minutes
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Avatars Grid - Staggered Portrait Layout (3 Cols) */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="grid grid-cols-3 gap-3 md:gap-4 items-end max-w-md">
                            {/* Column 1: Just Bottom */}
                            <div className="flex flex-col">
                                <div className="w-24 h-32 md:w-28 md:h-40 rounded-xl overflow-hidden shadow-lg border-2 border-white transform hover:scale-105 transition-transform duration-500">
                                    <img src="https://images.unsplash.com/photo-1551288049-bbda6465fba1?auto=format&fit=crop&q=80&w=400" alt="Data Analytics" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Column 2: Middle + Bottom */}
                            <div className="flex flex-col gap-3 md:gap-4">
                                <div className="w-24 h-32 md:w-28 md:h-40 rounded-xl overflow-hidden shadow-lg border-2 border-white transform hover:scale-105 transition-transform duration-500">
                                    <img src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=400" alt="Tech Visual" className="w-full h-full object-cover" />
                                </div>
                                <div className="w-24 h-32 md:w-28 md:h-40 rounded-xl overflow-hidden shadow-lg border-2 border-white transform hover:scale-105 transition-transform duration-500">
                                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400" alt="Dashboard" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Column 3: Highest + Bottom */}
                            <div className="flex flex-col gap-3 md:gap-4">
                                <div className="w-24 h-32 md:w-28 md:h-40 rounded-xl overflow-hidden shadow-lg border-2 border-white transform hover:scale-105 transition-transform duration-500 -translate-y-8 md:-translate-y-12">
                                    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400" alt="Hardware" className="w-full h-full object-cover" />
                                </div>
                                <div className="w-24 h-32 md:w-28 md:h-40 rounded-xl overflow-hidden shadow-lg border-2 border-white transform hover:scale-105 transition-transform duration-500">
                                    <img src="https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=400" alt="Graph" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}
