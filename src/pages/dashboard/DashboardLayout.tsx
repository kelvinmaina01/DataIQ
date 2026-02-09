import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid,
    Import,
    Database,
    BookOpen,
    Zap,
    MessagesSquare,
    Files,
    FileText,
    FileSearch,
    FolderOpen,
    Cpu,
    ShieldCheck,
    PanelLeft,
    PanelRight,
    Search,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../components/ui/tooltip";
import logoImage from 'figma:asset/90c5d6bf4c03d5cb5ffab3af18389097f479007b.png';

interface SidebarItem {
    title: string;
    href: string;
    icon: any;
}

const sidebarItems: SidebarItem[] = [
    { title: 'Overview', href: '/dashboard', icon: LayoutGrid },
    { title: 'Data Ingestion', href: '/dashboard/ingestion', icon: Import },
    { title: 'Datasets', href: '/dashboard/datasets', icon: Database },
    { title: 'AI Notebook', href: '/dashboard/notebook', icon: BookOpen },
    { title: 'Auto Analysis', href: '/dashboard/auto-analysis', icon: Zap },
    { title: 'AI Chat', href: '/dashboard/chat', icon: MessagesSquare },
    { title: 'Pinned Dashboards', href: '/dashboard/pinned', icon: Files },
    { title: 'Reports', href: '/dashboard/reports', icon: FileText },
    { title: 'File Processor', href: '/dashboard/file-processor', icon: FileSearch },
    { title: 'My Files', href: '/dashboard/my-files', icon: FolderOpen },
    { title: 'AI Model Hub', href: '/dashboard/models', icon: Cpu },
    { title: 'Security & Audit', href: '/dashboard/security', icon: ShieldCheck },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    console.log("DataIQ: DashboardLayout rendering. Path:", location.pathname);

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex">

            {/* Sidebar */}
            <TooltipProvider delayDuration={0}>
                <aside
                    className={`${isSidebarOpen ? 'w-72' : 'w-20'
                        } bg-white/80 backdrop-blur-xl border-r border-border/50 z-20 transition-all duration-300 flex flex-col`}
                >
                    {/* Logo & Notifications */}
                    <div className="p-6 mb-2 flex items-center justify-between">
                        {isSidebarOpen ? (
                            <div className="flex items-center justify-between w-full">
                                <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
                                    <img src={logoImage} alt="DataIQ" className="h-10 w-auto object-contain" />
                                    <span className="font-bold text-xl text-primary tracking-tight">DataIQ</span>
                                </Link>
                                <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-primary/10 -mr-2">
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white animate-pulse"></div>
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <img src={logoImage} alt="DataIQ" className="h-8 w-auto mx-auto" />
                                <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-primary/10">
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white animate-pulse"></div>
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                        {sidebarItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            to={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform duration-200'
                                                }`} />
                                            {isSidebarOpen && (
                                                <span className="text-sm font-semibold tracking-tight whitespace-nowrap overflow-hidden">
                                                    {item.title}
                                                </span>
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    {!isSidebarOpen && (
                                        <TooltipContent side="right" sideOffset={10} className="font-semibold">
                                            {item.title}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-border/50">
                        <div className={`flex ${isSidebarOpen ? 'flex-row gap-2' : 'flex-col gap-1'} items-center`}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size={isSidebarOpen ? 'default' : 'icon'}
                                        className={`${isSidebarOpen ? 'flex-1' : 'w-10 h-10'} flex items-center justify-center gap-2 px-3 py-3 h-auto rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary group transition-all`}
                                    >
                                        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                        {isSidebarOpen && <span className="text-sm font-medium">Settings</span>}
                                    </Button>
                                </TooltipTrigger>
                                {!isSidebarOpen && (
                                    <TooltipContent side="right" sideOffset={10} className="font-semibold">
                                        Settings
                                    </TooltipContent>
                                )}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size={isSidebarOpen ? 'default' : 'icon'}
                                        className={`${isSidebarOpen ? 'flex-1' : 'w-10 h-10'} flex items-center justify-center gap-2 px-3 py-3 h-auto rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive group transition-all`}
                                    >
                                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
                                    </Button>
                                </TooltipTrigger>
                                {!isSidebarOpen && (
                                    <TooltipContent side="right" sideOffset={10} className="font-semibold">
                                        Logout
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                </aside>
            </TooltipProvider>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Top Navbar */}
                <header className="h-20 bg-white/60 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-8">
                    <div className="flex items-center gap-6 flex-1 max-w-2xl">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                        >
                            {isSidebarOpen ? <PanelLeft className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
                        </Button>

                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search datasets, insights, reports... (⌘ + F)"
                                className="w-full bg-secondary/30 border border-border/40 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-px bg-border/50 mx-2"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-foreground leading-tight">John Carter</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Enterprise Plan</p>
                            </div>
                            <Avatar className="h-10 w-10 ring-2 ring-primary/10 transition-transform hover:scale-105 cursor-pointer">
                                <AvatarImage src="https://ui-avatars.com/api/?name=John+Carter&background=1d4ed8&color=fff" />
                                <AvatarFallback>JC</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                {/* Content View */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </main>

            {/* Mobile Toggle (Floating) */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed bottom-6 right-6 z-50 p-3 bg-primary text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all md:hidden"
            >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
        </div>
    );
}
