import { Wifi, CloudCog, ClipboardList, FolderUp, DatabaseZap, LineChart, Upload, Cloud, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ConnectData() {
  const navigate = useNavigate();
  const sources = [
    {
      icon: Wifi,
      title: "Wearables & Monitoring",
      description: "IoT sensors, smart devices, real-time monitors",
      delay: 0,
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: CloudCog,
      title: "Cloud Platforms",
      description: "AWS, Google Cloud, Azure, Dropbox",
      delay: 0.1,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: ClipboardList,
      title: "Surveys & Programs",
      description: "Customer surveys, market research, operational logs",
      delay: 0.2,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: FolderUp,
      title: "File Upload",
      description: "CSV, Excel, JSON, XML, and more",
      delay: 0.3,
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: DatabaseZap,
      title: "Database Connect",
      description: "PostgreSQL, MySQL, MongoDB",
      delay: 0.4,
      gradient: "from-blue-600 to-indigo-600"
    },
    {
      icon: LineChart,
      title: "Public Data APIs",
      description: "Financial markets, census data, weather APIs",
      delay: 0.5,
      gradient: "from-cyan-500 to-teal-500"
    }
  ];

  return (
    <section className="w-full py-12 sm:py-20 transition-colors duration-300" style={{ background: 'linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(239,246,255,0.8) 100%)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center animate-slide-up text-foreground">Connect Your Data</h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto animate-fade-in px-4">
            Upload spreadsheets, database exports, and logs from your tools.
            DataIQ supports multiple formats for comprehensive analysis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sources.map((source, index) => {
              const Icon = source.icon;
              // Map gradient strings to actual CSS gradients since Tailwind classes are missing
              const getGradientStyle = (gradientClass: string) => {
                if (gradientClass.includes('cyan-500 to-blue-500')) return 'linear-gradient(135deg, #06b6d4, #3b82f6)';
                if (gradientClass.includes('purple-500 to-pink-500')) return 'linear-gradient(135deg, #a855f7, #ec4899)';
                if (gradientClass.includes('green-500 to-emerald-500')) return 'linear-gradient(135deg, #22c55e, #10b981)';
                if (gradientClass.includes('blue-500 to-indigo-600')) return 'linear-gradient(135deg, #3b82f6, #4f46e5)';
                if (gradientClass.includes('blue-600 to-indigo-600')) return 'linear-gradient(135deg, #2563eb, #4f46e5)';
                if (gradientClass.includes('cyan-500 to-teal-500')) return 'linear-gradient(135deg, #06b6d4, #14b8a6)';
                return 'linear-gradient(135deg, #3b82f6, #2563eb)'; // Default blue
              };

              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:shadow-xl transition-all hover:scale-105 hover:border-primary group animate-fade-in"
                  style={{
                    animationDelay: `${source.delay}s`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md"
                    style={{ background: getGradientStyle(source.gradient) }}
                  >
                    <Icon className="size-7 sm:size-8 text-white" strokeWidth={2} />
                  </div>
                  <h4 className="font-bold mb-3 text-lg sm:text-xl text-foreground">{source.title}</h4>
                  <p className="text-base text-muted-foreground leading-relaxed">{source.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 sm:gap-8 mt-12 sm:mt-16 animate-slide-up px-4">
          <button
            onClick={() => navigate('/dashboard/ingestion')}
            className="bg-primary text-primary-foreground px-8 py-4 text-base rounded-full hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center gap-2 group font-bold shadow-lg active:scale-95"
          >
            <Upload className="size-5 transition-transform group-hover:-translate-y-0.5" />
            Upload Files
          </button>
          <button
            onClick={() => navigate('/dashboard/ingestion')}
            className="border-2 border-border bg-background/50 backdrop-blur-sm px-8 py-4 text-base rounded-full hover:bg-accent hover:text-accent-foreground transition-all hover:scale-105 flex items-center justify-center gap-2 group font-bold active:scale-95 shadow-md"
          >
            <Cloud className="size-5 text-primary" />
            Connect Cloud Sources
          </button>
          <button
            onClick={() => navigate('/dashboard/ingestion')}
            className="border-2 border-border bg-background/50 backdrop-blur-sm px-8 py-4 text-base rounded-full hover:bg-accent hover:text-accent-foreground transition-all hover:scale-105 flex items-center justify-center gap-2 group font-bold active:scale-95 shadow-md"
          >
            <Link className="size-5 text-primary" />
            Link Database
          </button>
        </div>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 italic animate-fade-in">
          For analysis purposes only. Always verify critical decisions.
        </p>
      </div>
    </section>
  );
}