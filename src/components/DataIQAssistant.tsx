import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Send,
    ArrowUp,
    X,
    Maximize2,
    Trash2,
    Sparkles,
    Search,
    ChevronUp,
    MessageCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import logoImage from '../assets/90c5d6bf4c03d5cb5ffab3af18389097f479007b.png';

export function DataIQAssistant() {
    const [isVisible, setIsVisible] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll trigger logic
    useEffect(() => {
        const handleScroll = () => {
            const viewportHeight = window.innerHeight;
            const currentScroll = window.scrollY;
            const totalHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight,
                document.body.clientHeight,
                document.documentElement.clientHeight
            );

            const scrollPosition = viewportHeight + currentScroll;
            const threshold = totalHeight - 1000; // Trigger when within 1000px of the bottom

            // Failsafe: Trigger if we are in the last 50% of the page
            const scrollPercentage = (scrollPosition / totalHeight) * 100;
            const isNearBottom = scrollPercentage > 50;

            const nextVisible = scrollPosition >= threshold || isNearBottom;

            setIsVisible(nextVisible);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [inputValue]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        console.log("DataIQAssistant: Submitting question");
        const newUserMessage = { role: 'user' as const, content: inputValue };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsSidebarOpen(true);
        setIsThinking(true);

        // Mock AI Response
        setTimeout(() => {
            const aiResponse = {
                role: 'assistant' as const,
                content: `I'm processing your question about "${newUserMessage.content}". Based on our documentation, DataIQ offers comprehensive solutions for this. Integrating with your current stack is seamless via our dedicated connectors.`
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsThinking(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <>
            {/* 1. Floating Input Bar (Centered Bottom) */}
            <div
                className={cn(
                    "fixed bottom-8 left-0 right-0 z-[100] px-4 transition-all duration-700 ease-in-out flex justify-center items-center pointer-events-none",
                    isVisible && !isSidebarOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95"
                )}
            >
                <div className="w-full max-w-3xl bg-white/95 backdrop-blur-2xl border border-primary/20 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(29,78,216,0.2)] p-2 pr-6 flex items-end gap-3 group focus-within:border-primary/40 focus-within:shadow-[0_25px_70px_-10px_rgba(29,78,216,0.25)] transition-all pointer-events-auto">
                    {/* Branding Icon */}
                    <div className="p-3 bg-primary/5 rounded-full shrink-0 flex items-center justify-center border border-primary/10">
                        <img src={logoImage} alt="DataIQ" className="size-8 animate-pulse-soft object-contain" />
                    </div>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me any question..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 py-4 text-xl resize-none max-h-[200px] font-medium outline-none"
                        style={{ boxShadow: 'none' }}
                    />

                    <div className="flex items-center gap-4 pb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block opacity-50">Ctrl + I</span>
                        <button
                            onClick={handleSubmit}
                            disabled={!inputValue.trim()}
                            className={cn(
                                "size-12 rounded-full flex items-center justify-center transition-all duration-300",
                                inputValue.trim()
                                    ? "bg-primary text-white scale-110 shadow-[0_0_20px_rgba(29,78,216,0.4)]"
                                    : "bg-gray-100 text-gray-300"
                            )}
                        >
                            <ArrowUp className="size-6" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Sidebar Chat Window */}
            <div
                className={cn(
                    "fixed top-4 bottom-4 right-4 z-50 w-[400px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
                    isSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-primary/2 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/10">
                            <img src={logoImage} alt="DataIQ" className="size-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-none mb-1">DataIQ Assistant</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">AI Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                            <Maximize2 className="size-4" />
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-400 transition-colors"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="size-16 bg-primary/5 rounded-3xl flex items-center justify-center mb-2 animate-bounce-subtle">
                                <Sparkles className="size-8 text-primary/40" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900">How can I assist you?</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                I can help with architecture, pricing, security, or any custom implementation questions.
                            </p>
                            <div className="grid grid-cols-1 gap-2 w-full pt-4">
                                {["Tell me about security", "What's in the Pro plan?", "How do integrations work?"].map(hint => (
                                    <button
                                        key={hint}
                                        onClick={() => setInputValue(hint)}
                                        className="text-left p-3 rounded-xl border border-gray-100 text-xs font-semibold text-gray-600 hover:border-primary/30 hover:bg-primary/2 transition-all"
                                    >
                                        {hint}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                            {msg.role === 'assistant' && (
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">DataIQ AI</span>
                            )}
                            <div
                                className={cn(
                                    "max-w-[85%] p-4 text-sm leading-relaxed tracking-wide",
                                    msg.role === 'user'
                                        ? "bg-primary text-white rounded-2xl rounded-tr-none shadow-md font-medium"
                                        : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none font-medium"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex items-start gap-3">
                            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                                <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Input */}
                <div className="p-6 border-t border-gray-50 bg-gray-50/50 rounded-b-3xl">
                    <div className="relative flex items-center gap-2 p-1.5 bg-white border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                        <textarea
                            rows={1}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none max-h-[120px] font-medium"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!inputValue.trim()}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                inputValue.trim() ? "bg-primary text-white shadow-md" : "text-gray-300"
                            )}
                        >
                            <Send className="size-4" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-4 px-1">
                        <button
                            onClick={() => setMessages([])}
                            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 flex items-center gap-1.5 transition-colors"
                        >
                            <Trash2 className="size-3" />
                            Clear Chat
                        </button>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v1.2 Stable</span>
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle (Only visible if closed and scrolled down) */}
            <div
                className={cn(
                    "fixed bottom-8 right-8 z-40 transition-all duration-500",
                    isVisible && !isSidebarOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
                )}
            >
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="size-14 rounded-2xl bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
                >
                    <MessageCircle className="size-7 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            </div>
        </>
    );
}
