import { Cloud, Database, Radio, CheckCircle2, Sparkles, Lock, FileSpreadsheet } from 'lucide-react';

export function AutomationSection() {
  const automationSteps = [
    { text: "Validates & profiles your data", icon: CheckCircle2 },
    { text: "Classifies the data domain", icon: CheckCircle2 },
    { text: "Triggers relevant analysis workflows", icon: CheckCircle2 },
    { text: "Detects anomalies & quality issues", icon: CheckCircle2 },
    { text: "Generates AI insights you didn't ask for", icon: Sparkles }
  ];

  const sources = [
    {
      icon: Cloud,
      title: "Cloud Platforms",
      description: "Google Drive, Dropbox, S3, Azure",
      active: true
    },
    {
      icon: Database,
      title: "Databases & Warehouses",
      description: "PostgreSQL, Snowflake, BigQuery",
      highlight: true,
      active: false
    },
    {
      icon: Radio,
      title: "IoT & Device Streams",
      description: "Wearables, IoT, real-time APIs",
      highlight: true,
      active: false
    },
    {
      icon: FileSpreadsheet,
      title: "Manual File Upload",
      description: "PDF, CSV, Excel, JSON",
      highlight: true,
      active: false
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 bg-transparent transition-colors duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
        {/* Left Side - Automation Description */}
        <div className="animate-slide-up">
          <div className="inline-block bg-primary/10 border border-primary/20 rounded-full px-4 py-1 text-sm text-primary mb-4 sm:mb-6 font-semibold">
            ✨ Automation-First Intelligence
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight text-foreground">
            Your data doesn't just sit there.
            <br />
            <span className="text-primary">It drives the entire system.</span>
          </h2>

          <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
            When you connect a cloud source or upload a dataset, DataIQ doesn't wait for you to click buttons.
            The system <span className="font-bold text-foreground">automatically:</span>
          </p>

          <div className="space-y-3 sm:space-y-4">
            {automationSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 animate-fade-in"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-0.5 shadow-sm">
                    <Icon className="size-4 text-primary-foreground" strokeWidth={3} />
                  </div>
                  <span className="text-foreground font-medium">{step.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Connection Card */}
        <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-lg border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center text-foreground">Connect Your First Data Source</h3>
          <p className="text-muted-foreground text-center mb-6 sm:mb-8 text-sm">Watch the automation unfold</p>

          <div className="space-y-4 mb-6 sm:mb-8">
            {sources.map((source, index) => {
              const Icon = source.icon;
              const isActive = source.active;

              // Render description with highlights if needed
              const renderDescription = () => {
                if (source.highlight) {
                  return source.description.split(', ').map((format, i, arr) => (
                    <span key={i}>
                      <span className={`${isActive ? 'text-primary-foreground font-bold' : 'text-primary font-bold bg-primary/10 px-1 rounded'}`}>
                        {format}
                      </span>
                      {i < arr.length - 1 ? ', ' : ''}
                    </span>
                  ));
                }
                return source.description;
              };

              return (
                <div
                  key={index}
                  className={`rounded-xl p-4 sm:p-5 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-all hover:shadow-md group ${isActive ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary/50 border border-border hover:border-primary/50'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-background shadow-sm'
                    }`}>
                    <Icon className={`size-6 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm sm:text-base mb-0.5 ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {source.title}
                    </h4>
                    <p className={`text-xs sm:text-sm ${isActive ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                      {renderDescription()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground p-3 bg-secondary/30 rounded-lg border border-border/50">
            <Lock className="size-4" />
            <span>End-to-end encrypted. Your data never leaves your control.</span>
          </div>
        </div>
      </div>
    </section>
  );
}