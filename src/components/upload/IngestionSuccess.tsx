import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Activity, Database, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';

export interface SuccessStats {
    rowCount: number;
    columnCount: number;
    qualityScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    domain: 'General' | 'Health' | 'Finance';
    isPhiSafe: boolean;
    richnessScore: number;
    healthReport: {
        completeness: number;
        validity: number;
        consistency: number;
        outliers: number;
    };
}

interface IngestionSuccessProps {
    stats: SuccessStats;
    onExplore: () => void;
    onUploadAnother: () => void;
}

export function IngestionSuccess({ stats, onExplore, onUploadAnother }: IngestionSuccessProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full border border-slate-100 rounded-2xl p-6 shadow-sm bg-white"
        >
            <div className="flex items-center gap-3 mb-8">
                <div className="size-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center border border-green-100">
                    <CheckCircle2 className="size-5" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Ingestion Successful!</h3>
                    <p className="text-sm text-slate-500 font-medium">Dataset is now indexed and ready for analysis</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Grade Card */}
                <div className="border border-brand-blue/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-brand-blue/[0.03] shadow-inner">
                    <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-2">Audit Grade</p>
                    <h3 className={`text-6xl font-black ${stats.grade === 'A' ? 'text-green-600' :
                        stats.grade === 'B' ? 'text-brand-blue' :
                            stats.grade === 'C' ? 'text-orange-500' : 'text-red-500'
                        }`}>{stats.grade}</h3>
                </div>

                {/* Score Card */}
                <div className="border border-green-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-green-50/30">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">Quality Score</p>
                    <h3 className="text-3xl font-black text-green-700 mb-2">{stats.qualityScore}%</h3>
                    <div className="w-full h-1.5 bg-green-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.qualityScore}%` }} />
                    </div>
                </div>

                {/* Richness Card */}
                <div className="border border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-indigo-50/30">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Data Richness</p>
                    <h3 className="text-3xl font-black text-indigo-700 mb-2">{Math.round(stats.richnessScore)}%</h3>
                    <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats.richnessScore}%` }} />
                    </div>
                </div>

                {/* Rows Card */}
                <div className="border border-teal-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-teal-50/30">
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-2">Record Count</p>
                    <h3 className="text-3xl font-black text-teal-700 mb-1">{stats.rowCount.toLocaleString()}</h3>
                    <span className="text-[10px] font-bold text-teal-600/60 uppercase">Indexed Rows</span>
                </div>
            </div>

            {/* Health Report Detailed Breakdown */}
            <div className="bg-slate-50/50 rounded-2xl p-6 mb-8 border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="size-4 text-brand-blue" />
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Health Report Breakdown</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Completeness', value: stats.healthReport.completeness, color: 'bg-purple-500', icon: Database },
                        { label: 'Validity', value: stats.healthReport.validity, color: 'bg-green-500', icon: ShieldCheck },
                        { label: 'Consistency', value: stats.healthReport.consistency, color: 'bg-blue-600', icon: Activity },
                        { label: 'Outliers', value: stats.healthReport.outliers, color: 'bg-rose-500', icon: TrendingUp },
                    ].map(m => (
                        <div key={m.label} className="group">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <m.icon className="size-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{Math.round(m.value * 100)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200/60 rounded-full overflow-hidden shadow-inner p-[1px]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${m.value * 100}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className={`h-full ${m.color} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    onClick={onExplore}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/15"
                >
                    Explore Dataset <ArrowRight className="size-4 ml-2" />
                </Button>
                <Button
                    variant="outline"
                    onClick={onUploadAnother}
                    className="flex-1 h-12 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                    Upload Another
                </Button>
            </div>
        </motion.div>
    );
}
