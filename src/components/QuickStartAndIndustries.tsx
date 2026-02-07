import { BarChart3, Search, LineChart, Wifi, Cog, Microscope, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import architectureDiagram from '../assets/architecture-diagram.png';

export function QuickStartAndIndustries() {
  const steps = [
    { text: "Create your project workspace", icon: "🚀", delay: 0 },
    { text: "Upload your dataset (CSV, Excel, JSON)", icon: "📁", delay: 0.1 },
    { text: "Let AI analyze patterns", icon: "🤖", delay: 0.2 },
    { text: "Review insights & predictions", icon: "📊", delay: 0.3 },
    { text: "Generate & share reports", icon: "📈", delay: 0.4 }
  ];

  return (
    <section className="bg-transparent border-y border-border py-12 sm:py-20 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Left Side - Architecture Diagram */}
          <div className="animate-slide-up flex flex-col h-full">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Built for Modern Teams
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8">
              DataIQ adapts to your workflow, providing a seamless pipeline from ingestion to actionable insights.
            </p>

            <div className="flex-1 flex items-center justify-center bg-white/50 rounded-2xl border border-primary/10 p-4 shadow-sm group hover:shadow-md transition-all">
              <img
                src={architectureDiagram}
                alt="DataIQ Architecture: Ingestion, Cleansing, Harmonization, Analysis"
                className="w-full h-auto object-contain rounded-lg hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>

          {/* Right Side - Quick Start in 5 Steps */}
          <div className="bg-primary/5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-primary/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">Quick Start in 5 Steps</h3>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm">
              Get from raw data to actionable insights in minutes
            </p>

            <div className="space-y-4 mb-6 sm:mb-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 animate-fade-in"
                  style={{
                    animationDelay: `${0.3 + step.delay}s`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex items-start gap-2 pt-2">
                    <span className="text-lg">{step.icon}</span>
                    <p className="text-foreground font-medium text-sm sm:text-base">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/signup" className="w-full">
              <button className="w-full bg-primary text-primary-foreground px-8 py-3 sm:py-4 rounded-full hover:opacity-90 transition-all hover:scale-105 hover:shadow-xl font-semibold flex items-center justify-center gap-2 group active:scale-95 shadow-lg">
                Start Your First Project
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}