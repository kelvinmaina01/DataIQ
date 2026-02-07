import { Button } from './ui/button';
import { Play, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CTASection() {
  const stats = [
    { value: "10+", label: "Data Sources", delay: 0 },
    { value: "30+", label: "UI Components", delay: 0.1 },
    { value: "5+", label: "AI Functions", delay: 0.2 },
    { value: "99.9%", label: "Uptime", delay: 0.3 }
  ];

  return (
    <section className="bg-secondary/50 text-foreground py-12 sm:py-20 transition-colors duration-300">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-slide-up text-foreground">
            Ready to Transform Your Research?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto animate-fade-in px-4">
            Join researchers worldwide who trust DataIQ for intelligent data analysis.
            Start free today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16 animate-slide-up px-4">
            <Link to="/signup">
              <Button className="h-12 px-8 rounded-full text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all bg-primary text-white">
                <Play className="w-4 h-4 fill-white" />
                Get Started Free
              </Button>
            </Link>
            <Button variant="outline" className="h-12 px-8 rounded-full text-base font-semibold hover:scale-[1.02] transition-all border-2 border-primary text-primary hover:bg-primary/10">
              <Upload className="w-4 h-4" />
              Upload Your Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 border-t border-border pt-8 sm:pt-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fade-in"
              style={{
                animationDelay: `${stat.delay}s`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="text-3xl sm:text-4xl font-bold mb-2 text-primary">{stat.value}</div>
              <div className="text-muted-foreground text-xs sm:text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}