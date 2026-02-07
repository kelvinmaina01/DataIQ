import { CheckCircle2, Database, Sparkles, MessageSquare, FileText, Users, Zap, Layers, Bot, LineChart } from 'lucide-react';
import dashboardPreview from '../assets/dashboard-preview.png';

export function WhatIsDataIQ() {
  const features = [
    {
      title: "Intelligent Data Analysis",
      items: [
        "AutoML pattern detection",
        "Predictive modeling",
        "Natural language insights",
        "Multi-modal analysis"
      ]
    },
    {
      title: "Research & Program Tracking",
      items: [
        "Analysis workflows",
        "Dataset versioning",
        "Report generation",
        "Version history (Pro)"
      ]
    },
    {
      title: "Collaboration Tools",
      items: [
        "Real-time chat",
        "Threaded comments",
        "Task assignments",
        "Email notifications"
      ]
    }
  ];

  const workspaceFeatures = [
    { text: "Multi-source data ingestion hub", icon: Database, color: "bg-cyan-100 text-cyan-600" },
    { text: "Google Gemini AI integration", icon: Sparkles, color: "bg-purple-100 text-purple-600" },
    { text: "Streaming chat assistant", icon: MessageSquare, color: "bg-cyan-100 text-cyan-600" },
    { text: "Automated report generation", icon: FileText, color: "bg-green-100 text-green-600" },
    { text: "Team collaboration tools", icon: Users, color: "bg-cyan-100 text-cyan-600" },
    { text: "Workflow automation", icon: Zap, color: "bg-blue-100 text-blue-600" }
  ];

  const badges = [
    { label: "10+ Data Sources", icon: Layers },
    { label: "3 AI Modes", icon: Bot },
    { label: "Real-time Charts", icon: LineChart }
  ];

  return (
    <section className="bg-background py-12 sm:py-20 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* What is DataIQ Header */}
        <div className="text-center mb-12 sm:mb-16 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
            What is DataIQ?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            An AI-powered workspace that helps teams clean data, uncover insights,
            collaborate, and generate reports—all in one place
          </p>
        </div>

        {/* Three Feature Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-background border border-primary/20 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'forwards'
              }}
            >
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-foreground">{feature.title}</h3>
              <ul className="space-y-2 sm:space-y-3">
                {feature.items.map((item, i) => (
                  <li key={i} className="text-muted-foreground flex items-start gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Complete Data Analysis Workspace Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
          {/* Left Side - Description */}
          <div className="animate-slide-up">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
              Complete Data Analysis Workspace
            </h3>
            <p className="text-muted-foreground mb-6 sm:mb-8">
              From data upload to insights and reporting, DataIQ gives modern teams
              everything they need to analyze data, collaborate, and communicate results.
            </p>

            <div className="flex flex-wrap gap-3 mb-8 sm:mb-10">
              {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={index}
                    className="bg-primary/10 border border-primary/20 rounded-full px-4 py-2 flex items-center gap-2 animate-fade-in"
                    style={{
                      animationDelay: `${0.2 + index * 0.1}s`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <Icon className="size-5 text-primary" />
                    <span className="font-semibold text-sm text-primary">{badge.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Dashboard Preview Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 group animate-fade-in mt-8" style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={dashboardPreview}
                alt="DataIQ Dashboard Interface"
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Right Side - Feature List */}
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {workspaceFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all hover:scale-[1.02] group animate-fade-in"
                  style={{
                    animationDelay: `${0.4 + index * 0.1}s`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="bg-primary/10 text-primary w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-medium text-foreground text-sm sm:text-base">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12 sm:mt-16 animate-fade-in">
          <button className="bg-primary text-primary-foreground px-8 sm:px-10 py-3 sm:py-4 rounded-full hover:opacity-90 transition-all hover:scale-105 hover:shadow-xl font-semibold inline-flex items-center gap-2 active:scale-95 shadow-md">
            <Sparkles className="size-5" />
            Explore the Platform
          </button>
        </div>
      </div>
    </section>
  );
}