import { useNavigate } from 'react-router-dom';
import { Settings, User, Bell, Shield, CreditCard, ChevronRight, Database, LifeBuoy, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function SettingsPage() {
    const navigate = useNavigate();

    const sections = [
        { icon: User, label: 'Profile Information', desc: 'Manage your name, email and avatar' },
        { icon: Bell, label: 'Notifications', desc: 'Choose what alerts you want to receive' },
        { icon: Shield, label: 'Password & Security', desc: 'Update your password and secure your account' },
        { icon: CreditCard, label: 'Billing & Plans', desc: 'Manage your subscription and invoices' },
        { icon: Database, label: 'Workspace', desc: 'Storage & Data: Manage your datasets and storage limits' },
        { icon: LifeBuoy, label: 'Support', desc: 'Help & Documentation: Guides, tutorials, and support' },
        { icon: ShieldCheck, label: 'Data Privacy & Compliance', desc: 'Manage anonymization and audit logs' },
    ];

    return (
        <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">Settings</h1>
                <p className="text-slate-500 font-medium">Manage your account preferences and security settings.</p>
            </div>

            <div className="grid gap-4">
                {sections.map((section, idx) => (
                    <div
                        key={idx}
                        className="group bg-white border border-[#0E50F6]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                <section.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{section.label}</h3>
                                <p className="text-sm text-slate-400 font-medium">{section.desc}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                ))}
            </div>

            <div className="mt-12 p-8 rounded-[2rem] bg-slate-900 text-white flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                    <h3 className="text-2xl font-semibold mb-2">Need more power?</h3>
                    <p className="text-slate-400 font-medium mb-6">Upgrade to Enterprise for advanced AI models and unlimited storage.</p>
                    <Button className="bg-primary hover:bg-primary/90 text-white px-8 rounded-xl h-12 font-semibold">
                        View Pricing
                    </Button>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/20 to-transparent"></div>
            </div>
        </div>
    );
}
