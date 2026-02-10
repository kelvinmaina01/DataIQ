import { useEffect, useRef, useState } from 'react';
import image1 from '../assets/afcc58faa7429bb996605d70395eadcd46203350.png';
import image2 from '../assets/68ef41b2b29c59479aaab859caaed19800c882bf.png';
import image3 from '../assets/f1d5ae56d89c2d484b839a11d99436fb096e3b0b.png';

export function ValueProposition() {
  const [isVisible, setIsVisible] = useState<boolean[]>([false, false, false]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger animations sequentially
            setTimeout(() => setIsVisible(prev => [true, prev[1], prev[2]]), 100);
            setTimeout(() => setIsVisible(prev => [prev[0], true, prev[2]]), 300);
            setTimeout(() => setIsVisible(prev => [prev[0], prev[1], true]), 500);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const items = [
    {
      image: image1,
      text: {
        intro: "What if reports were ready",
        main: "when funders asked for them?"
      },
      position: "left"
    },
    {
      image: image2,
      text: {
        intro: "What if analysis took",
        main: "minutes instead of days?"
      },
      position: "right"
    },
    {
      image: image3,
      text: {
        intro: "What if data from different sources",
        main: "just... worked together?"
      },
      position: "left"
    }
  ];

  return (
    <section ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 transition-colors duration-300">
      {/* Main Title */}
      <div className="text-center mb-12 sm:mb-20 animate-slide-up">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-relaxed text-foreground max-w-4xl mx-auto px-4">
          What if every dataset revealed insights you <span className="text-primary">didn't see before?</span>
        </h2>
      </div>

      {/* Scattered Items - Now Horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-16 sm:mb-32">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center transition-all duration-700 animate-slide-up"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            {/* Image in irregular circle */}
            <div className="mb-6">
              <div
                className="relative group"
                style={{
                  transform: `rotate(${index % 2 === 0 ? '-3deg' : '3deg'})`,
                }}
              >
                <div
                  className="relative overflow-hidden bg-background p-3 sm:p-4 transition-all duration-500 group-hover:scale-105 shadow-lg hover:shadow-2xl border border-border"
                  style={{
                    borderRadius: `${60 + index * 5}% ${40 - index * 3}% ${55 + index * 4}% ${45 - index * 2}% / ${50 + index * 3}% ${60 - index * 4}% ${40 + index * 5}% ${50 - index * 2}%`,
                    width: '200px',
                    height: '200px',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.text.main}
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full opacity-60 animate-pulse" />
                <div className="absolute -bottom-3 -left-3 w-5 h-5 bg-purple-500 rounded-full opacity-40" />
              </div>
            </div>

            {/* Text - single line */}
            <div className="px-4">
              <div className="text-lg sm:text-xl font-semibold leading-relaxed">
                <span className="text-muted-foreground">{item.text.intro} </span>
                <span className="text-primary">{item.text.main}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exit Statement */}
      <div className="text-center animate-fade-in px-4">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
          <span className="text-muted-foreground">Stop cleaning spreadsheets.</span>{' '}
          <span className="text-primary">Start understanding your data.</span>
        </h3>
      </div>
    </section>
  );
}