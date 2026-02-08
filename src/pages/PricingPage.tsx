import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { DataIQAssistant } from '../components/DataIQAssistant';
import { Check, Info, Shield, Users, Zap, Building, GraduationCap, Minus, ArrowRight, MessageSquare, Play, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from '../components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from 'react-router-dom';

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(true);
    const [api, setApi] = React.useState<import('../components/ui/carousel').CarouselApi>();
    const [current, setCurrent] = React.useState(0);

    React.useEffect(() => {
        if (!api) return;
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const plans = [
        {
            name: "Free",
            description: "For exploration",
            price: "$0",
            features: [
                "5 datasets",
                "100 MB storage",
                "Basic analysis",
                "Community support"
            ],
            buttonText: "Get Started",
            featured: false
        },
        {
            name: "Pro",
            description: "For researchers",
            price: isAnnual ? "$39" : "$49",
            features: [
                "100 datasets",
                "10 GB storage",
                "Full AI analysis",
                "Priority support",
                "Team collaboration",
                "API access"
            ],
            buttonText: "Start Trial",
            featured: true,
            badge: "Most popular"
        },
        {
            name: "Team",
            description: "For organizations",
            price: isAnnual ? "$119" : "$149",
            features: [
                "500 datasets",
                "50 GB storage",
                "Everything in Pro",
                "25 team members",
                "Phone support",
                "99.5% SLA"
            ],
            buttonText: "Start Trial",
            featured: false
        },
        {
            name: "Enterprise",
            description: "For institutions",
            price: "Custom",
            features: [
                "Unlimited everything",
                "On-premise option",
                "Dedicated support",
                "Custom SLA",
                "SSO/SAML",
                "White-label"
            ],
            buttonText: "Contact Sales",
            featured: false
        }
    ];


    const paymentLogos = [
        { name: 'Visa', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' },
        { name: 'Mastercard', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
        { name: 'American Express', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg' },
        { name: 'PayPal', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
        { name: 'Apple Pay', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg' },
        { name: 'Google Pay', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg' },
        { name: 'Stripe', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero Section */}
            <section className="mt-32 pt-16 pb-24 px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display">
                    Simple, <span className="text-primary">transparent</span> pricing
                </h1>
                <p className="text-gray-500 text-lg mb-12">
                    Start free. <span className="text-primary font-medium">Scale as you grow</span>. No hidden fees.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-16">
                    <div className="relative bg-gray-100 p-1 rounded-full flex items-center border border-gray-200 w-72 h-12 overflow-hidden">
                        <button
                            onClick={() => {
                                console.log("Monthly clicked");
                                setIsAnnual(false);
                            }}
                            type="button"
                            className={cn(
                                "relative z-20 flex-1 h-full rounded-full text-base font-bold transition-all duration-300 cursor-pointer",
                                !isAnnual ? "text-gray-900" : "text-gray-400"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => {
                                console.log("Annual clicked");
                                setIsAnnual(true);
                            }}
                            type="button"
                            className={cn(
                                "relative z-20 flex-1 h-full rounded-full text-base font-bold transition-all duration-300 cursor-pointer",
                                isAnnual ? "text-gray-900" : "text-gray-400"
                            )}
                        >
                            Annual
                        </button>
                        {/* Animated Pill */}
                        <div
                            className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white shadow-md transition-all duration-300 ease-out left-[4px] z-10"
                            style={{
                                transform: isAnnual ? 'translateX(100%)' : 'translateX(0%)'
                            }}
                        />
                    </div>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 shadow-sm">
                        -20% SAVE
                    </span>
                </div>

                {/* Pricing Cards Grid */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "relative p-8 rounded-2xl border transition-all duration-300 flex flex-col items-start text-left",
                                plan.featured
                                    ? "border-primary ring-1 ring-primary shadow-xl scale-105 z-10 bg-white"
                                    : "border-gray-200 hover:border-primary/30 bg-white"
                            )}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-primary">{plan.name}</h3>
                                <p className="text-sm text-gray-500">{plan.description}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-gray-500 text-sm">/mo</span>}
                            </div>

                            <div className="space-y-4 mb-10 w-full flex-1">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-2">
                                        <Check className="size-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-600">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.featured ? "default" : "outline"}
                                className={cn(
                                    "w-full rounded-lg py-6 font-semibold transition-all duration-300 hover:scale-[1.02] hover:ring-4 hover:ring-primary/10",
                                    plan.featured
                                        ? "bg-primary hover:bg-primary/90 text-white"
                                        : "border-gray-200 text-gray-900 hover:border-primary hover:text-primary"
                                )}
                            >
                                {plan.buttonText}
                                {plan.featured && <Play className="ml-2 size-4 fill-white" />}
                            </Button>
                        </div>
                    ))}
                </div>
                <p className="mt-8 text-gray-400 text-sm">14-day free trial on Pro & Team. No credit card required.</p>
            </section>

            {/* Supporting Education Section */}
            <section style={{ backgroundColor: '#F9F6FE' }} className="py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col items-center text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-6">
                            <GraduationCap className="size-4" />
                            Supporting Education
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 max-w-2xl text-center">
                            We believe in empowering the next generation
                        </h2>
                        <p className="text-gray-500 max-w-3xl">
                            Science advances through accessible tools. That's why we offer students and academic researchers massive discounts — because breakthrough discoveries shouldn't be limited by budget.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto bg-white p-8 md:p-12 rounded-2xl border border-primary/20 shadow-sm">
                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="size-14 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
                                    <GraduationCap className="size-7 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary mb-1">90% Student Discount</h4>
                                    <p className="text-sm text-gray-500">Full Pro features for just $3.90/month. Same powerful AI, same unlimited analysis.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="size-14 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                                    <Building className="size-7 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary mb-1">50% Academic Institution</h4>
                                    <p className="text-sm text-gray-500">Universities, research institutions, and NGOs qualify for institutional discounts on Team plans.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="size-14 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                                    <Globe className="size-7 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-primary mb-1">Non-Profit Organizations</h4>
                                    <p className="text-sm text-gray-500">Registered non-profits advancing scientific research receive 50% off all plans.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-gray-400 line-through">$39</span>
                                    <span className="text-3xl font-bold text-primary">$3.90</span>
                                    <span className="text-gray-500">/mo</span>
                                </div>
                                <p className="text-xs text-gray-500">Pro plan with student discount</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-2">
                                    <Check className="size-3.5 text-primary" />
                                    <span className="text-xs text-gray-600 font-medium">Full AI analysis suite</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="size-3.5 text-primary" />
                                    <span className="text-xs text-gray-600 font-medium">100 datasets</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="size-3.5 text-primary" />
                                    <span className="text-xs text-gray-600 font-medium">10 GB storage</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="size-3.5 text-primary" />
                                    <span className="text-xs text-gray-600 font-medium">Priority support</span>
                                </div>
                            </div>

                            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:ring-4 hover:ring-primary/10">
                                <Zap className="size-4 mr-2" />
                                Verify Student Status
                            </Button>
                            <p className="text-center text-[10px] text-gray-400 mt-4">Instant verification with .edu email</p>
                        </div>
                    </div>
                </div>
            </section>


            {/* Trust & FAQ Tags Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-12">Secure payments powered by industry leaders</p>

                    {/* Payment Logos Carousel */}
                    <div className="relative mb-16 max-w-4xl mx-auto px-12">
                        <Carousel
                            setApi={setApi}
                            plugins={[
                                Autoplay({
                                    delay: 3000,
                                })
                            ]}
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-8">
                                {[...paymentLogos, ...paymentLogos].map((logo, index) => (
                                    <CarouselItem key={`${logo.name}-${index}`} className="pl-8 basis-1/4">
                                        <div className="flex items-center justify-center p-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                            <img src={logo.icon} alt={logo.name} className="h-10 w-auto" />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 border-none bg-transparent hover:bg-gray-100 text-gray-400" />
                            <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 border-none bg-transparent hover:bg-gray-100 text-gray-400" />
                        </Carousel>

                        {/* Carousel Dots */}
                        <div className="flex items-center justify-center gap-2 mt-8">
                            {paymentLogos.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => api?.scrollTo(index)}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        current === index ? "bg-gray-900 w-3" : "bg-gray-300"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Questions Section */}
            <section
                style={{ backgroundColor: '#FAFAFB' }}
                className="py-24 px-4 overflow-hidden relative"
            >
                {/* Subtle primary grid background */}
                <div
                    className="absolute inset-0 opacity-[0.08] z-0 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #1d4ed8 1px, transparent 1px),
                            linear-gradient(to bottom, #1d4ed8 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    {/* Background Decorative Element */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse-soft" />

                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Questions?</h2>
                        <p className="text-gray-500 mb-10">Our assistant can help with pricing, features, and more.</p>

                        <div className="flex flex-wrap justify-center gap-4 mb-16">
                            {["What's in Pro?", "Student pricing", "Enterprise options", "Data security"].map((tag) => (
                                <button
                                    key={tag}
                                    className="px-8 py-3 rounded-full bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 border border-transparent"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-8">Ready to get started?</h3>
                            <Link to="/faq" className="group w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="h-16 px-12 rounded-full text-lg font-bold bg-white border-2 border-primary text-primary group-hover:bg-primary transition-all duration-300 shadow-lg hover:shadow-primary/20 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-3 group-hover:ring-4 group-hover:ring-primary/10 w-full sm:min-w-[360px]"
                                >
                                    <span className="relative z-10 group-hover:text-white">Frequently asked questions</span>
                                    <ArrowRight className="size-6 transition-transform group-hover:translate-x-1 relative z-10 text-primary group-hover:text-white" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section
                className="px-4 text-center"
                style={{
                    paddingTop: '120px',
                    paddingBottom: '160px',
                    display: 'block'
                }}
            >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 text-center">Ready to get started?</h2>
                    <p className="text-gray-500 text-lg mb-12 text-center">Join thousands of data analysts accelerating their insights.</p>

                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '24px',
                            flexWrap: 'wrap',
                            width: '100%'
                        }}
                    >
                        {/* Wrapper Divs for absolute control */}
                        <div style={{ width: '256px', flexShrink: 0 }}>
                            <Button
                                className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg transition-all hover:scale-[1.02] hover:ring-4 hover:ring-primary/20"
                                style={{ height: '56px', width: '100%', display: 'flex' }}
                            >
                                Start free trial
                                <ArrowRight className="ml-2 size-5" />
                            </Button>
                        </div>

                        <div style={{ width: '256px', flexShrink: 0 }}>
                            <Button
                                variant="outline"
                                className="w-full h-14 text-base font-bold border-gray-200 text-gray-900 hover:border-primary hover:text-primary rounded-xl transition-all hover:scale-[1.02] hover:ring-4 hover:ring-primary/10 bg-white"
                                style={{ height: '56px', width: '100%', display: 'flex' }}
                            >
                                Talk to sales
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dedicated Spacer to ensure margin */}
            <div style={{ height: '100px', width: '100%' }} />

            <DataIQAssistant />
            <Footer />
        </div>
    );
}
