import { LucideIcon } from 'lucide-react';

interface BlankPageProps {
    title: string;
    icon: LucideIcon;
}

export function BlankPage({ title, icon: Icon }: BlankPageProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center px-4 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/10">
                <Icon className="w-10 h-10 text-primary/40" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">{title}</h1>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                This feature is currently in development. We are building a premium,
                AI-powered experience for {title.toLowerCase()}.
            </p>
        </div>
    );
}
