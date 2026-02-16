import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessagesSquare, FileSpreadsheet, Bot, Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function ChatPage() {
    const location = useLocation();
    const context = location.state?.context;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Context Banner */}
            {context && (
                <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <FileSpreadsheet className="h-4 w-4 text-green-700" />
                        </div>
                        <span className="text-sm font-medium text-green-900">
                            Chatting with context: <strong>{context.name}</strong>
                        </span>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 max-w-2xl text-slate-800">
                        <p>
                            Hello! I'm ready to help you analyze your data.
                            {context ? ` I have access to "${context.name}". Ask me anything about it!` : ' What would you like to explore today?'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="max-w-4xl mx-auto relative">
                    <Input
                        placeholder={context ? `Ask about ${context.name}...` : "Type a message..."}
                        className="pr-12 py-6 text-base rounded-full border-slate-300 focus:border-primary focus:ring-primary/20 shadow-sm"
                    />
                    <Button
                        size="icon"
                        className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
                    >
                        <Send className="h-4 w-4 text-white" />
                    </Button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">
                    AI can make mistakes. Please verify important information.
                </p>
            </div>
        </div>
    );
}
