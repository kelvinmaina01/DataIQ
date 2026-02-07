import { Navigation } from '../components/Navigation';
import { HeroSection } from '../components/HeroSection';
import { StudentBanner } from '../components/StudentBanner';
import { ValueProposition } from '../components/ValueProposition';
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
        <div className="min-h-screen bg-transparent text-foreground transition-colors duration-300">
            <Navigation />
            <HeroSection />
            <StudentBanner />
            <ValueProposition />
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
