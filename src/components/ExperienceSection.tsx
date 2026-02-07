import { Calendar, Play, Rocket } from 'lucide-react';
import { Button } from './ui/button';

export function ExperienceSection() {
  const options = [
    {
      icon: Calendar,
      title: "Book a Demo",
      description: "See DataIQ's full capabilities in a personalized walkthrough with our team.",
      features: [
        "30-minute personalized demo",
        "Q&A with product experts",
        "Custom use-case discussion"
      ],
      cta: "Schedule Demo",
      delay: 0
    },
    {
      icon: Play,
      title: "Watch Demo",
      description: "See a quick walkthrough of how DataIQ transforms data into insights.",
      features: [
        "5-minute overview video",
        "Real use-case examples",
        "Key features showcase"
      ],
      cta: "Watch Now",
      delay: 0.1
    },
    {
      icon: Rocket,
      title: "Start Free",
      description: "Jump right in and explore DataIQ with your own data. No credit card required.",
      features: [
        "Instant access",
        "Upload your data immediately",
        "Upgrade anytime"
      ],
      cta: "Get Started",
      delay: 0.2
    }
  ];

  return (
    <section className="bg-background border-y border-border py-12 sm:py-20 transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-slide-up text-foreground">
            Experience DataIQ in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto animate-fade-in px-4">
            See how leading teams are transforming their data analysis workflow.
            Choose the best way to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <div
                key={index}
                className="bg-secondary/30 border border-border rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all hover:scale-105 hover:border-primary group animate-fade-in"
                style={{
                  animationDelay: `${option.delay}s`,
                  animationFillMode: 'forwards'
                }}
              >
                <Icon className="size-10 mb-4 text-primary" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">{option.title}</h3>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">{option.description}</p>
                <ul className="space-y-2 mb-6 sm:mb-8">
                  {option.features.map((feature, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1 flex-shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={index === 2 ? "default" : "outline"}
                  className={`w-full rounded-full transition-all hover:scale-105 font-semibold ${index === 2 ? "shadow-lg" : ""
                    }`}
                >
                  {option.cta}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center space-y-4 animate-fade-in">
          <p className="text-muted-foreground">Questions? We're here to help.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Button variant="link" className="text-primary p-0 h-auto font-medium">Chat with Sales</Button>
            <span className="text-border">•</span>
            <Button variant="link" className="text-primary p-0 h-auto font-medium">View Documentation</Button>
            <span className="text-border">•</span>
            <Button variant="link" className="text-primary p-0 h-auto font-medium">See Pricing</Button>
          </div>
        </div>
      </div>
    </section>
  );
}