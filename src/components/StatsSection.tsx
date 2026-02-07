import { useEffect, useState, useRef } from 'react';

export function StatsSection() {
  // Stats with numeric values for animation
  const stats = [
    { value: 10, suffix: "x", label: "Faster Analysis", delay: 0 },
    { value: 5, suffix: " min", label: "to First Insight", delay: 0.1 },
    { value: 24, suffix: "/7", label: "AI Assistant", delay: 0.2 },
    { value: 10, suffix: "+", label: "Data Sources", delay: 0.3 }
  ];

  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2500; // Slower animation (2.5s)
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);

    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easeOutQuad = (t: number) => t * (2 - t); // Smooth easing

      const currentCounts = stats.map(stat => {
        if (progress >= 1) return stat.value;
        return Math.floor(stat.value * easeOutQuad(progress));
      });

      setCounts(currentCounts);

      if (frame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="bg-secondary/50 text-foreground py-12 sm:py-20 border-y border-border transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 animate-slide-up text-foreground">
            Every second counts.
            <br />
            <span className="text-primary">Every insight matters.</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground animate-fade-in">
            DataIQ <span className="text-primary font-bold">delivers real-time intelligence</span> for modern teams in{' '}
            <span className="relative inline-block text-foreground font-semibold mx-1">
              seconds
              <svg
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] text-primary pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <style>
                  {`@keyframes draw-circle { to { stroke-dashoffset: 0; } }`}
                </style>
                <path
                  d="M15,50 Q30,25 50,25 T85,50 T50,75 T15,50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                  style={{ animation: 'draw-circle 0.8s ease-out 0.5s forwards' }}
                />
              </svg>
            </span>
            not hours.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-background border border-primary/20 rounded-xl p-6 sm:p-8 text-center shadow-sm hover:shadow-xl transition-all hover:scale-105 animate-fade-in hover:border-primary/40 group"
              style={{
                animationDelay: `${stat.delay}s`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2 transition-all duration-300 group-hover:scale-110">
                {counts[index]}{stat.suffix}
              </div>
              <div className="text-muted-foreground text-sm sm:text-base font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}