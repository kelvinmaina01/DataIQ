import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
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
    MessageSquare,
    UserCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../components/ui/tooltip";
import logoImage from '../../assets/90c5d6bf4c03d5cb5ffab3af18389097f479007b.png';

interface SidebarGroup {
    category: string;
    items: { title: string; href: string; icon: any }[];
}

const sidebarGroups: SidebarGroup[] = [
    {
        category: "Dashboard & Assets",
        items: [
            { title: 'Overview', href: '/dashboard', icon: LayoutGrid },
            { title: 'Datasets', href: '/dashboard/datasets', icon: Database },
            { title: 'My Files', href: '/dashboard/my-files', icon: FolderOpen },
        ]
    },
    {
        category: "Data Collection",
        items: [
            { title: 'Data Ingestion', href: '/dashboard/ingestion', icon: Import },
            { title: 'Document Intelligence', href: '/dashboard/document-intelligence', icon: FileSearch },
        ]
    },
    {
        category: "AI & Analysis",
        items: [
            { title: 'AI Chat', href: '/dashboard/chat', icon: MessagesSquare },
            { title: 'Auto Analysis', href: '/dashboard/auto-analysis', icon: Zap },
            { title: 'AI Notebook', href: '/dashboard/notebook', icon: BookOpen },
            { title: 'AI Model Hub', href: '/dashboard/models', icon: Cpu },
        ]
    },
    {
        category: "Visualization",
        items: [
            { title: 'Pinned Dashboards', href: '/dashboard/pinned', icon: Files },
            { title: 'Reports', href: '/dashboard/reports', icon: FileText },
        ]
    },
    {
        category: "Administration",
        items: [
            { title: 'Security & Audit', href: '/dashboard/security', icon: ShieldCheck },
        ]
    }
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // Auto-collapse sidebar for Document Intelligence page when in extraction mode
    useEffect(() => {
        const isDocIntelPage = location.pathname === '/dashboard/document-intelligence';
        const isExtractionMode = window.location.hash === '#extraction';
        if (isDocIntelPage && isExtractionMode) {
            setIsSidebarOpen(false);
        }
    }, [location]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                if (currentUser.emailVerified) {
                    // Check onboarding status
                    try {
                        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            if (!userData.onboardingCompleted && location.pathname !== '/onboarding') {
                                navigate('/onboarding');
                                return;
                            }
                        } else {
                            // If doc doesn't exist (social login/legacy), they need to onboard
                            if (location.pathname !== '/onboarding') {
                                navigate('/onboarding');
                                return;
                            }
                        }
                    } catch (error) {
                        console.error("DataIQ: Error checking onboarding status:", error);
                    }

                    setUser(currentUser);
                    setLoading(false);
                } else {
                    // Block access if email not verified
                    await signOut(auth);
                    toast.error("Please verify your email to access the dashboard.");
                    navigate(`/verify-email?email=${encodeURIComponent(currentUser.email || '')}`);
                }
            } else {
                // If not logged in, redirect to login
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate, location.pathname]);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            toast.success("Successfully logged out");
            navigate('/login');
        } catch (error: any) {
            console.error("Logout error:", error);
            toast.error("Failed to log out");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-primary animate-pulse tracking-wide">Securing Session...</p>
                </div>
            </div>
        );
    }

    // Default values if user info is missing
    const displayName = user?.displayName || user?.email?.split('@')[0] || "User";
    const userEmail = user?.email || "";
    const userPhoto = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0E50F6&color=fff`;

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
                                    <span className="font-semibold text-xl text-primary tracking-tight">DataIQ</span>
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
                    <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar py-2">
                        {sidebarGroups.map((group, groupIdx) => (
                            <div key={groupIdx} className="space-y-1">
                                {isSidebarOpen && (
                                    <div className="px-4 pb-1">
                                        <p className="text-[10px] font-bold tracking-wider text-slate-900 uppercase">{group.category}</p>
                                    </div>
                                )}
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Tooltip key={item.href}>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    to={item.href}
                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
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
                            </div>
                        ))}
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
                                        onClick={() => navigate('/dashboard/settings')}
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
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} className="font-semibold" hidden={isSidebarOpen}>
                                    Logout
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </aside>
            </TooltipProvider>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Top Navbar */}
                <header className="h-20 bg-white/60 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-8 relative z-50">
                    <div className="flex items-center gap-6 flex-1 max-w-2xl">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                        >
                            {isSidebarOpen ? <PanelLeft className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
                        </Button>

                        <div className="flex-1 max-w-2xl group">
                            <div className="relative flex items-center bg-primary/[0.02] border border-primary/30 rounded-2xl px-4 py-2.5 group-focus-within:bg-white group-focus-within:ring-[4px] group-focus-within:ring-primary/10 group-focus-within:border-primary transition-all shadow-sm hover:bg-primary/[0.04] hover:border-primary/50">
                                <Search className="w-5 h-5 text-primary/60 group-focus-within:text-primary transition-colors flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search datasets, insights, reports... (⌘ + F)"
                                    className="flex-1 bg-transparent border-none outline-none pl-3 text-[15px] font-semibold placeholder:text-primary/30 text-foreground focus:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-px bg-border/50 mx-2"></div>

                        <div className="flex items-center gap-3 pl-2 relative">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{userEmail}</p>
                            </div>
                            <div className="relative">
                                <Avatar
                                    className="h-10 w-10 ring-2 ring-primary/10 transition-transform hover:scale-105 cursor-pointer"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <AvatarImage src={userPhoto} />
                                    <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>

                                {/* Profile Popover */}
                                {isProfileOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-[9998]"
                                            onClick={() => setIsProfileOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-[9999] animate-in fade-in zoom-in duration-200 origin-top-right">
                                            <div className="p-4 border-b border-border/40">
                                                <h3 className="text-sm font-semibold text-slate-800">My Account</h3>
                                            </div>

                                            <div className="p-2">
                                                <button
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors group"
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        navigate('/dashboard/profile');
                                                    }}
                                                >
                                                    <UserCircle className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                    <span>Profile</span>
                                                </button>

                                                <button
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors group"
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        navigate('/dashboard/notifications');
                                                    }}
                                                >
                                                    <Bell className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                    <span>Notifications</span>
                                                </button>

                                                <button
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors group"
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        navigate('/dashboard/settings');
                                                    }}
                                                >
                                                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                    <span>Settings</span>
                                                </button>
                                            </div>

                                            <div className="p-2 border-t border-border/40">
                                                <button
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors group"
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        handleLogout();
                                                    }}
                                                >
                                                    <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-500 transition-colors" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
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
