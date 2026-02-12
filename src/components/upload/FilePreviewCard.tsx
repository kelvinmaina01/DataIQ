import React from 'react';
import { FileText, CheckCircle2, AlertCircle, FilePlus2, ShieldCheck, Database, Layers, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilePreviewCardProps {
    file: File;
    status: 'parsing' | 'success' | 'error';
    stats?: {
        rowCount: number;
        columnCount: number;
        quality: number;
        outliersFound?: number;
        validRows?: number;
        completeness?: number;
        domain?: string;
        traits?: string[];
    };
    error?: string;
}

export function FilePreviewCard({ file, status, stats, error }: FilePreviewCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#f8faff] border-2 border-primary rounded-2xl p-6 shadow-sm mb-6"
        >
            <div className="flex items-center gap-2 mb-6 text-brand-blue">
                <FilePlus2 className="size-5" />
                <h3 className="font-bold text-sm">File Preview & Processing</h3>
            </div>

            <div className="space-y-4 mb-8">
                {/* File Details Grid */}
                {[
                    { label: 'Name:', value: file.name, color: 'text-red-600' },
                    { label: 'Size:', value: `${(file.size / 1024 / 1024).toFixed(2)} MB` },
                    { label: 'Type:', value: file.type || 'application/octet-stream' },
                    {
                        label: 'Parse Status:',
                        value: status === 'success' ? (
                            <span className="flex items-center gap-1.5 text-green-600 font-bold">
                                <CheckCircle2 className="size-3.5" />
                                Parsed Successfully
                            </span>
                        ) : status === 'error' ? (
                            <span className="flex items-center gap-1.5 text-red-600 font-bold">
                                <AlertCircle className="size-3.5" />
                                Parsing Failed
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-brand-blue font-bold animate-pulse">
                                Parsing...
                            </span>
                        )
                    },
                    {
                        label: 'Rows Found:',
                        value: stats?.rowCount.toLocaleString() || '0',
                        color: 'text-red-600 font-black'
                    },
                    {
                        label: 'Columns Found:',
                        value: stats?.columnCount || '0',
                        color: 'text-red-600 font-black'
                    },
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[13px] py-1">
                        <span className="text-brand-blue font-bold">{item.label}</span>
                        <span className={`font-bold text-right ${(item as any).color || 'text-slate-700'}`}>{item.value}</span>
                    </div>
                ))}
            </div>

            {/* Pre-analysis Results */}
            {status === 'success' && stats && (
                <div className="space-y-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-brand-blue/10 shadow-sm relative overflow-hidden">
                        {stats.domain === 'Health' && (
                            <div className="absolute top-0 right-0 px-3 py-1 bg-green-50 text-[10px] font-black text-green-700 uppercase tracking-tighter rounded-bl-lg border-l border-b border-green-100 flex items-center gap-1">
                                <ShieldCheck className="size-3" />
                                Health Data Inferred
                            </div>
                        )}
                        <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-4">Initial Diagnostic Audit</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-blue-50 border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-700 uppercase">Completeness</span>
                                <span className={`text-xl font-black ${stats.completeness && stats.completeness < 0.9 ? 'text-red-500' : 'text-blue-600'}`}>
                                    {stats.completeness ? Math.round(stats.completeness * 100) : 100}%
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-orange-50 border border-orange-100">
                                <span className="text-[10px] font-bold text-orange-700 uppercase">Outliers Found</span>
                                <span className={`text-xl font-black ${stats.outliersFound && stats.outliersFound > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {stats.outliersFound || 0}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-purple-50 border border-purple-100">
                                <span className="text-[10px] font-bold text-purple-700 uppercase">Validity Level</span>
                                <span className={`text-xl font-black ${stats.validRows && (stats.validRows / stats.rowCount) < 0.8 ? 'text-red-500' : 'text-purple-600'}`}>
                                    {stats.validRows ? Math.round((stats.validRows / stats.rowCount) * 100) : 100}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {stats.traits && stats.traits.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {stats.traits.map(trait => (
                                <div key={trait} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Layers className="size-2.5" />
                                    {trait}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Quality Score Row - Shown if success */}
            {status === 'success' && stats && (
                <div className="flex items-center justify-between py-4 border-t border-slate-100 mb-6">
                    <span className="text-slate-400 font-medium text-[13px]">Quality Score:</span>
                    <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg ${stats.quality > 80 ? 'text-green-600' : stats.quality > 50 ? 'text-brand-blue' : 'text-red-600'}`}>
                            {stats.quality}%
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${stats.quality > 80 ? 'bg-green-500' : stats.quality > 50 ? 'bg-brand-blue' : 'bg-red-500'}`}
                                style={{ width: `${stats.quality}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-processing Section */}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Auto-processing will include:</p>
                <div className="grid grid-cols-2 gap-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <ShieldCheck className="size-3.5 text-slate-300" />
                        PII Classification
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <Database className="size-3.5 text-slate-300" />
                        Schema Registry
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <Layers className="size-3.5 text-slate-300" />
                        Data Quality Score
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <BarChart3 className="size-3.5 text-slate-300" />
                        Missingness Analysis
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px] font-medium">
                    {error}
                </div>
            )}
        </motion.div>
    );
}
