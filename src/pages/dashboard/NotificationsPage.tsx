import { useState } from 'react';
import {
    Bell,
    Inbox,
    Settings2,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    Mail,
    Zap,
    AlertCircle,
    Check
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../components/ui/utils';

interface Notification {
    id: string;
    title: string;
    desc: string;
    time: string;
    type: 'warning' | 'info';
    unread?: boolean;
}

const initialNotifications: Notification[] = [
    { id: '1', title: 'Low Operational Efficiency', desc: 'System efficiency is at 45%. Multiple factors may be affecting performance.', time: '2/10/2026 at 01:35 AM', type: 'warning', unread: true },
    { id: '2', title: 'Low Operational Efficiency', desc: 'System efficiency is at 45%. Multiple factors may be affecting performance.', time: '1/22/2026 at 09:07 AM', type: 'warning' },
    { id: '3', title: 'No Recent Team Activity', desc: 'No team members have been active in the past 7 days. Consider reviewing your projects.', time: '1/22/2026 at 09:07 AM', type: 'info' },
    { id: '4', title: 'Low Operational Efficiency', desc: 'System efficiency is at 45%. Multiple factors may be affecting performance.', time: '1/20/2026 at 09:23 PM', type: 'warning' },
    { id: '5', title: 'No Recent Team Activity', desc: 'No team members have been active in the past 7 days. Consider reviewing your projects.', time: '1/20/2026 at 09:23 PM', type: 'info' },
    { id: '6', title: 'Low Operational Efficiency', desc: 'System efficiency is at 45%. Multiple factors may be affecting performance.', time: '1/18/2026 at 11:30 AM', type: 'warning' },
    { id: '7', title: 'No Recent Team Activity', desc: 'No team members have been active in the past 7 days. Consider reviewing your projects.', time: '1/18/2026 at 11:30 AM', type: 'info' },
];

export function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
    const [notifications, setNotifications] = useState(initialNotifications);
    const [emailSettings, setEmailSettings] = useState({
        assignments: true,
        alerts: true,
        completion: true
    });
    const [thresholds, setThresholds] = useState({
        bottleneck: 80,
        quality: 92
    });

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div className="max-w-6xl mx-auto animate-slide-up pb-12">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#0E50F6]/10 rounded-2xl flex items-center justify-center border border-[#0E50F6]/20 shadow-sm">
                    <Bell className="w-6 h-6 text-[#0E50F6]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
                    <p className="text-sm text-slate-400 font-semibold">Manage your alerts and preferences</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl w-fit mb-10 border border-slate-200/50">
                <button
                    onClick={() => setActiveTab('inbox')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'inbox'
                            ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50"
                            : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Inbox className="w-4 h-4" />
                    <span>Inbox</span>
                    {unreadCount > 0 && (
                        <span className="bg-purple-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                            {notifications.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('preferences')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'preferences'
                            ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50"
                            : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Settings2 className="w-4 h-4" />
                    <span>Preferences</span>
                </button>
            </div>

            {activeTab === 'inbox' ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Your Activity</h3>
                        <Button variant="outline" className="rounded-xl font-semibold h-10 gap-2 border-border/50 text-slate-600 hover:bg-slate-50">
                            <Check className="w-4 h-4" />
                            Mark all read
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className="bg-white border border-[#0E50F6]/20 shadow-sm hover:shadow-md transition-all flex items-center justify-between group relative overflow-hidden"
                            >
                                <div className="flex gap-5 items-start">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center border",
                                        notif.type === 'warning' ? "bg-amber-50 border-amber-100" : "bg-[#0E50F6]/10 border-[#0E50F6]/20 text-[#0E50F6]"
                                    )}>
                                        {notif.type === 'warning' ? (
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <Bell className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-bold text-slate-800 leading-tight mb-1">{notif.title}</h4>
                                        <p className="text-sm text-slate-400 font-semibold leading-relaxed">{notif.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                                        {notif.time}
                                    </span>
                                    <button className="p-2 text-slate-200 hover:text-rose-400 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl space-y-6">
                    {/* Email Notifications Card */}
                    <div className="bg-white border border-border/50 rounded-[2rem] p-10 shadow-sm ring-1 ring-[#0E50F6]/5">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2.5 bg-[#0E50F6]/10 rounded-xl">
                                <Mail className="w-5 h-5 text-[#0E50F6]" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Email Notifications</h3>
                        </div>
                        <p className="text-sm text-slate-400 font-semibold mb-10 pl-14">Control which emails you receive</p>

                        <div className="space-y-10 pl-14">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 mb-0.5 tracking-tight">Action Assignments</h4>
                                    <p className="text-[13px] text-slate-400 font-semibold">When you are assigned new tasks</p>
                                </div>
                                <Toggle checked={emailSettings.assignments} onChange={() => setEmailSettings(s => ({ ...s, assignments: !s.assignments }))} />
                            </div>

                            <div className="h-px bg-slate-100 w-full" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 mb-0.5 tracking-tight">Bottleneck Alerts</h4>
                                    <p className="text-[13px] text-slate-400 font-semibold">When critical bottlenecks are detected</p>
                                </div>
                                <Toggle checked={emailSettings.alerts} onChange={() => setEmailSettings(s => ({ ...s, alerts: !s.alerts }))} />
                            </div>

                            <div className="h-px bg-slate-100 w-full" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-bold text-slate-800 mb-0.5 tracking-tight">Experiment Completion</h4>
                                    <p className="text-[13px] text-slate-400 font-semibold">When ML experiments finish</p>
                                </div>
                                <Toggle checked={emailSettings.completion} onChange={() => setEmailSettings(s => ({ ...s, completion: !s.completion }))} />
                            </div>
                        </div>
                    </div>

                    {/* Threshold Configuration Card */}
                    <div className="bg-white border border-[#0E50F6]/20 rounded-[2rem] p-10 shadow-sm ring-1 ring-primary/5">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2.5 bg-amber-50 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Threshold Configuration</h3>
                        </div>
                        <p className="text-sm text-slate-400 font-semibold mb-10 pl-14">Adjust sensitivity for automated alerts</p>

                        <div className="space-y-12 pl-14">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">Bottleneck Impact Threshold</h4>
                                    <span className="text-sm font-bold text-slate-800">{thresholds.bottleneck}</span>
                                </div>
                                <div className="relative pt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={thresholds.bottleneck}
                                        onChange={(e) => setThresholds(t => ({ ...t, bottleneck: parseInt(e.target.value) }))}
                                        className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#0E50F6]"
                                        style={{
                                            background: `linear-gradient(to right, #0E50F6 ${thresholds.bottleneck}%, #E2E8F0 ${thresholds.bottleneck}% 90%, #A855F7 90%)`
                                        }}
                                    />
                                    <p className="mt-4 text-[11px] text-slate-400 font-semibold tracking-tight">
                                        Alert only when impact score exceeds this value.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">Data Quality Warning</h4>
                                    <span className="text-sm font-bold text-slate-800">{thresholds.quality}%</span>
                                </div>
                                <div className="relative pt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={thresholds.quality}
                                        onChange={(e) => setThresholds(t => ({ ...t, quality: parseInt(e.target.value) }))}
                                        className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#0E50F6]"
                                        style={{
                                            background: `linear-gradient(to right, #0E50F6 ${thresholds.quality}%, #E2E8F0 ${thresholds.quality}% 90%, #A855F7 90%)`
                                        }}
                                    />
                                    <p className="mt-4 text-[11px] text-slate-400 font-semibold tracking-tight">
                                        Alert when data quality drops below this percentage.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button className="bg-[#0E50F6] hover:bg-[#0D44D1] text-white px-10 h-14 rounded-2xl font-bold shadow-xl shadow-[#0E50F6]/20 uppercase text-xs tracking-wider">
                            Save Preferences
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={cn(
                "w-12 h-6 px-1 rounded-full transition-all flex items-center shadow-inner",
                checked ? "bg-[#0E50F6]" : "bg-slate-200"
            )}
        >
            <div className={cn(
                "w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300",
                checked ? "translate-x-6" : "translate-x-0"
            )} />
        </button>
    );
}
