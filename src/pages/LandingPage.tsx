import { Navigation } from '../components/Navigation';
import { HeroSection } from '../components/HeroSection';
import { ConnectData } from '../components/ConnectData';
import { JourneySection } from '../components/JourneySection';
import { AutomationSection } from '../components/AutomationSection';
import { WhatIsDataIQ } from '../components/WhatIsDataIQ';
import { StatsSection } from '../components/StatsSection';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { QuickStartAndIndustries } from '../components/QuickStartAndIndustries';
import { ExperienceSection } from '../components/ExperienceSection';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';
import { ScrollToTop } from '../components/ScrollToTop';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-transparent text-foreground transition-colors duration-300 relative overflow-hidden">
            {/* Background Grid Pattern - Consistent with FAQ and Pricing pages */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `linear-gradient(to right, #1d4ed8 1px, transparent 1px), linear-gradient(to bottom, #1d4ed8 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    opacity: 0.08,
                }}
                aria-hidden="true"
            />
            <Navigation />
            <HeroSection />
            <ConnectData />
            <JourneySection />
            <AutomationSection />
            <WhatIsDataIQ />
            <StatsSection />
            <FeaturesGrid />
            <QuickStartAndIndustries />
            <ExperienceSection />
            <CTASection />
            <Footer />
            <ScrollToTop />
        </div>
    );
}
