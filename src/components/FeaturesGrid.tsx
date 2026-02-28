import {
  Sparkles, Database, BarChart3, Search, Users, Shield,
  ArrowRight, FileSpreadsheet, Cloud, Code2, CheckCircle2,
  Lock, AlertCircle, Bot
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ingestionVisual from '../assets/ingestion-visual.png';
import interactiveVisual from '../assets/interactive-visual.png';

// --- Visual Components ---

function AIAnalysisVisual() {
  const [step, setStep] = useState(0); // 0: User typing, 1: AI thinking, 2: AI responding
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [showChart, setShowChart] = useState(false);

  const userPrompt = "Analyze Q3 churn rates";
  const aiResponse = "Churn dropped by 15%. Here is the trend:";

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    // Loop logic with longer pauses for readability
    if (step === 0) {
      setShowChart(false);
      if (userText.length < userPrompt.length) {
        timeout = setTimeout(() => {
          setUserText(userPrompt.substring(0, userText.length + 1));
        }, 50);
      } else {
        timeout = setTimeout(() => setStep(1), 800);
      }
    } else if (step === 1) {
      timeout = setTimeout(() => setStep(2), 1500);
    } else if (step === 2) {
      if (aiText.length < aiResponse.length) {
        timeout = setTimeout(() => {
          setAiText(aiResponse.substring(0, aiText.length + 1));
        }, 30);
      } else {
        // Show chart after text is done
        if (!showChart) {
          timeout = setTimeout(() => setShowChart(true), 100);
        } else {
          timeout = setTimeout(() => {
            setStep(0);
            setUserText("");
            setAiText("");
            setShowChart(false);
          }, 6000);
        }
      }
    }
    return () => clearTimeout(timeout);
  }, [step, userText, aiText, showChart]);

  return (
    <div className="w-full h-full p-6 bg-gradient-to-b from-primary/5 to-transparent flex flex-col justify-start pt-8 gap-4">
      {/* Chat Interface */}
      <div className="w-full flex flex-col gap-4">

        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-medium shadow-md max-w-[85%] animate-in fade-in slide-in-from-right-4 duration-300">
            {userText}
            {step === 0 && <span className="animate-pulse inline-block w-1.5 h-4 bg-primary-foreground/70 ml-1 align-middle" />}
          </div>
        </div>

        {/* AI Message */}
        {(step >= 1) && (
          <div className="flex justify-start items-end gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 shadow-sm flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-white border border-border px-4 py-3 rounded-2xl rounded-tl-sm text-xs sm:text-sm shadow-md max-w-[90%] space-y-3">
              {step === 1 ? (
                <div className="flex gap-1.5 h-5 items-center px-1">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <>
                  <p className="text-foreground leading-relaxed">
                    {aiText}
                  </p>
                  {/* Mini Chart */}
                  {aiText.length > 10 && (
                    <div className="h-24 w-full bg-blue-50/30 rounded-lg p-3 border border-blue-100 flex items-end justify-between gap-1.5">
                      {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                        <div
                          key={i}
                          className="w-full bg-blue-600 rounded-t-[2px] shadow-sm transition-all duration-1000 ease-out"
                          style={{
                            height: showChart ? `${h}%` : '0%',
                            transitionDelay: `${i * 100}ms`
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {showChart && (
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground animate-in fade-in delay-700">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span>Analysis complete</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IngestionVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-cyan-500/5 to-transparent overflow-hidden">
      <img
        src={ingestionVisual}
        alt="Multi-Source Data Ingestion"
        className="w-full h-full object-contain p-4 hover:scale-105 transition-transform duration-500"
      />
    </div>
  );
}

function ChartVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-transparent relative overflow-hidden">
      {/* Background Image */}
      <img
        src={interactiveVisual}
        alt="Interactive Visualization Dashboard"
        className="absolute inset-0 w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
      />

      {/* Overlay Gradient for readability if needed */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

      {/* Floating Donut Chart */}
      <div className="relative z-10 w-28 h-28 bg-card/90 backdrop-blur-sm rounded-full shadow-lg border border-primary/20 p-2 flex items-center justify-center animate-float group hover:scale-110 transition-transform">
        {/* SVG Donut Chart */}
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 text-primary">
          {/* Background Circle */}
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="15" fill="transparent" className="opacity-10" />
          {/* Progress Circle (73%) */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="15"
            fill="transparent"
            strokeDasharray="251.2"
            strokeDashoffset="67.8"
            strokeLinecap="round"
            className="animate-draw-circle drop-shadow-md"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-primary">73%</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes draw-circle { from { stroke-dashoffset: 251.2; } to { stroke-dashoffset: 67.8; } }
          .animate-draw-circle { animation: draw-circle 1.5s ease-out forwards; }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          .animate-float { animation: float 6s ease-in-out infinite; }
       `}} />
    </div>
  );
}

function ProfilingVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-blue-50/5 to-transparent">
      <div className="w-full max-w-[240px] bg-card rounded-xl border border-primary/20 shadow-sm p-5 space-y-5 relative">

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
            <span>Quality Score</span>
            <span className="text-red-500 text-sm">98/100</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary/80 w-[98%] rounded-full shadow-sm" />
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border border-primary/30 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-primary" />
              </div>
              <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-300 rounded-full"
                  style={{ width: `${85 - (i * 10)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function CollaborationVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-orange-500/5 to-transparent">
      <div className="relative">
        <div className="flex -space-x-3 relative z-10">
          {['JD', 'AS', 'MK'].map((initials, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-background border-2 border-primary/10 shadow-sm flex items-center justify-center text-xs font-bold text-primary hover:-translate-y-1 transition-transform cursor-default">
              {initials}
            </div>
          ))}
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground border-2 border-primary/10 flex items-center justify-center text-xs font-bold shadow-sm">
            +4
          </div>
        </div>

        {/* Animated Pop-up Message */}
        <div className="absolute -top-10 -right-8 bg-card border border-primary/20 shadow-lg px-3 py-2 rounded-xl rounded-bl-sm text-[10px] font-medium animate-bounce-slow flex items-center gap-1.5 z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>@Sarah updated the dataset</span>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
         `}} />
      </div>
    </div>
  );
}

function SecurityVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-red-500/5 to-transparent relative overflow-hidden group">
      {/* Holographic Grid Background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at center, hsl(var(--primary)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)'
      }} />

      {/* Animated Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 border border-primary/10 rounded-full animate-spin-veryslow absolute" />
        <div className="w-32 h-32 border border-primary/30 rounded-full animate-spin-reverse-slow absolute border-dashed" />
      </div>

      {/* Central Shield */}
      <div className="relative z-10 w-20 h-20 flex items-center justify-center">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-slow" />

        <div className="relative w-full h-full bg-gradient-to-br from-background via-card to-background rounded-full border border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center overflow-hidden">
          {/* Scanning Light */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-transparent via-primary/20 to-transparent animate-scan-fast pointer-events-none" />

          <Shield className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] fill-primary/10" />

          <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center shadow-sm z-20 animate-bounce-subtle">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
            @keyframes spin-veryslow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-spin-veryslow { animation: spin-veryslow 20s linear infinite; }
            @keyframes spin-reverse-slow { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
            .animate-spin-reverse-slow { animation: spin-reverse-slow 15s linear infinite; }
            @keyframes pulse-slow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
            .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
            @keyframes scan-fast { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
            .animate-scan-fast { animation: scan-fast 2s linear infinite; }
            @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
            .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
         `}} />
    </div>
  );
}


// --- Main Grid ---

export function FeaturesGrid() {
  const features = [
    {
      title: "AI-Powered Analysis",
      description: "Google Gemini AI analyzes your data with AutoML, providing instant insights in analysis, educator, and prediction modes",
      visual: <AIAnalysisVisual />
    },
    {
      title: "Multi-Source Data Ingestion",
      description: "Upload files, connect live device streams, integrate cloud sources, or use our dataset registry with drag-and-drop validation",
      visual: <IngestionVisual />
    },
    {
      title: "Interactive Visualization",
      description: "Charts and dashboards that update in real-time. Track trends, compare groups, and monitor indicators",
      visual: <ChartVisual />
    },
    {
      title: "Smart Data Profiling",
      description: "Understand your dataset's structure, quality, and patterns instantly with automated profiling",
      visual: <ProfilingVisual />
    },
    {
      title: "Team Collaboration",
      description: "Real-time chat, comments, action assignments, and email notifications keep your team synchronized",
      visual: <CollaborationVisual />
    },
    {
      title: "Enterprise Security",
      description: "End-to-end encryption, role-based access control, and complete audit logs for compliance",
      visual: <SecurityVisual />
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-24 bg-transparent animate-fade-in">
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-tight">
          <span className="text-primary">simplify your data analysis</span> experience
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative bg-background border border-primary/20 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 flex flex-col"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Visual Area - Taller (h-72) to accommodate advanced animations */}
            <div className="h-72 w-full border-b border-primary/10 relative overflow-hidden group-hover:bg-primary/5 transition-colors">
              {feature.visual}
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                {feature.description}
              </p>

              <div className="flex items-center text-primary text-sm font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}