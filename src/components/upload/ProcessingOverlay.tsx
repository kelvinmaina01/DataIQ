import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, Layers, BarChart3, Info } from 'lucide-react';

interface ProcessingOverlayProps {
    progress: number;
    stage: string;
}

export function ProcessingOverlay({ progress, stage }: ProcessingOverlayProps) {
    return (
        <div className="w-full bg-[#f8faff] border border-brand-blue/10 rounded-2xl p-8 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700 text-sm">{stage}</h3>
                <span className="font-bold text-brand-blue text-sm">{Math.round(progress)}%</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-brand-blue rounded-full"
                />
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Auto-processing will include:</p>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                    <ShieldCheck className={`size-4 ${progress > 20 ? 'text-brand-blue' : 'text-slate-200'}`} />
                    PII Classification
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                    <Database className={`size-4 ${progress > 50 ? 'text-brand-blue' : 'text-slate-200'}`} />
                    Schema Registry
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                    <Layers className={`size-4 ${progress > 70 ? 'text-brand-blue' : 'text-slate-200'}`} />
                    Data Quality Score
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                    <BarChart3 className={`size-4 ${progress > 90 ? 'text-brand-blue' : 'text-slate-200'}`} />
                    Missingness Analysis
                </div>
            </div>
        </div>
    );
}
