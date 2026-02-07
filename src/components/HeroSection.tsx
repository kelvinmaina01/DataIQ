import { Button } from './ui/button';
import { Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-16 text-center bg-transparent transition-colors duration-300">
      <div className="mb-6 inline-flex items-center gap-2.5 text-sm text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full border border-border/50 animate-fade-in shadow-sm backdrop-blur-sm">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </div>
        <span className="font-semibold tracking-wide">AI-Powered Data Intelligence Platform</span>
      </div>

      <h1 className="mb-8 font-bold tracking-tight animate-slide-up text-foreground" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: '1.0' }}>
        <span style={{ whiteSpace: 'nowrap' }}>Launch better decisions</span>
        <br />
        <span style={{ whiteSpace: 'nowrap' }}>with <span className="text-primary">intelligent data</span></span>
      </h1>

      <p className="mx-auto max-w-3xl mb-10 leading-relaxed text-muted-foreground animate-slide-up px-4" style={{ animationDelay: '0.1s', fontSize: 'clamp(1.125rem, 2vw, 1.1rem)' }}>
        Turn messy data into insights, dashboards, and reports—no coding required. Upload CSVs from business ops, surveys, and monitoring tools.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-slide-up px-4" style={{ animationDelay: '0.2s' }}>
        <Link to="/signup">
          <Button className="h-12 px-8 rounded-full text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all bg-primary text-white">
            <Play className="w-4 h-4 fill-white" />
            Get Started Free
          </Button>
        </Link>
        <a href="#use-cases">
          <Button variant="outline" className="h-12 px-8 rounded-full text-base font-semibold hover:scale-[1.02] transition-all border-2 border-primary text-primary hover:bg-primary/10">
            Explore Use Cases
            <ArrowRight className="w-4 h-4" />
          </Button>
        </a>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground animate-fade-in px-4" style={{ animationDelay: '0.3s' }}>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-primary font-bold text-lg">✓</span> No credit card required
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-primary font-bold text-lg">✓</span> Free tier for students
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-primary font-bold text-lg">✓</span> Built for research
        </span>
      </div>
    </section>
  );
}