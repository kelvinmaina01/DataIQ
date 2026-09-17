import { Sparkles, Network, Activity, Cpu, Shield, Workflow, LineChart } from 'lucide-react';
import dashboardPreview from '../assets/dashboard-preview.png';

export function WhatIsDataIQ() {
  return (
    <section className="bg-background py-16 sm:py-24 transition-colors duration-300 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 text-foreground tracking-tight">
            The Intelligence <span className="text-primary">Engine</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Fragmented data tools are obsolete. DataIQ synthesizes raw pipelines into an interactive, omni-channel command center.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
            
          {/* Card 1: Main Feature (Wide) */}
          <div className="md:col-span-2 lg:col-span-2 bg-slate-50 border border-slate-200 rounded-[2rem] p-8 hover:shadow-lg transition-all duration-300 group">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Network className="text-primary size-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Semantic Knowledge Graph</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Auto-discovers relationships across disparate databases, converting isolated tables into a unified cognitive map capable of deep inference.
            </p>
          </div>

          {/* Card 2: AI */}
          <div className="md:col-span-1 lg:col-span-2 bg-primary/5 border border-primary/10 rounded-[2rem] p-8 hover:shadow-lg transition-all duration-300 group">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="text-primary size-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Autonomous Reasoning</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Deploys embedded LLMs to pro-actively query anomalies, forecast trajectories, and extract structured metrics from unstructured noise.
            </p>
          </div>

          {/* Card 3: Workflows */}
          <div className="md:col-span-1 lg:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Workflow className="text-blue-600 size-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Agentic Orchestration</h4>
            <p className="text-sm text-slate-500 font-medium">Chain complex analytical tasks via intelligent triggers and auto-healing data pipelines.</p>
          </div>

          {/* Card 4: Auditing */}
          <div className="md:col-span-1 lg:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <Shield className="text-emerald-600 size-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Immutable Provenance</h4>
            <p className="text-sm text-slate-500 font-medium">Cryptographic state-tracking ensures every transformation and report is fully auditable and reversible.</p>
          </div>

          {/* Card 5: Real-time UI */}
          <div className="md:col-span-1 lg:col-span-2 bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
             <div className="relative z-10 w-full h-full flex flex-col justify-between min-h-[160px]">
                <div>
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/5">
                        <Activity className="text-white size-5" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Synchronous War Room</h4>
                    <p className="text-sm text-slate-300 font-medium max-w-sm">Live collaborative canvases with deterministic state synchronization. Analyze together, instantly.</p>
                </div>
             </div>
          </div>
          
        </div>

        {/* Dynamic Presentation */}
        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200/50 bg-white p-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
            <div className="rounded-[2rem] overflow-hidden relative">
                <img
                    src={dashboardPreview}
                    alt="DataIQ Dashboard Interface"
                    className="w-full h-auto object-cover"
                />
            </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-16 animate-fade-in">
          <button className="bg-slate-900 text-white px-10 py-4 rounded-full hover:bg-slate-800 transition-all hover:scale-105 hover:shadow-xl font-bold text-lg inline-flex items-center gap-3 active:scale-95 shadow-lg">
            <Sparkles className="size-5 text-primary" />
            Deploy Workspace
          </button>
        </div>

      </div>
    </section>
  );
}