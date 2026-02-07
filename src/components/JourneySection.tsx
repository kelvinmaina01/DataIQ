import { ArrowRight } from 'lucide-react';

export function JourneySection() {
  return (
    <section className="bg-background border-y border-border py-12 sm:py-20 animate-fade-in transition-colors duration-300">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-slide-up text-foreground">
          Start Your Journey
        </h2>
        <p className="text-xl sm:text-2xl text-muted-foreground mb-8 sm:mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
          By transforming raw data into scientific breakthroughs.
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 sm:mb-12 animate-fade-in px-4 leading-relaxed" style={{ animationDelay: '0.2s' }}>
          Upload your datasets and let our AI-powered engine handle the heavy lifting.
          From quality checks to insights discovery—all automated.
        </p>
        <button className="bg-primary text-primary-foreground px-8 py-4 text-base rounded-full hover:opacity-90 transition-all hover:scale-105 hover:shadow-xl animate-slide-up font-bold active:scale-95 shadow-lg inline-flex items-center gap-2" style={{ animationDelay: '0.3s' }}>
          Begin Analysis
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </section>
  );
}