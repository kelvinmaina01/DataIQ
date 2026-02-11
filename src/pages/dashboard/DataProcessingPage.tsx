import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    CheckCircle2,
    FileText,
    Loader2,
    ArrowRight,
    Search
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase, setSupabaseIdentity } from '../../../backend/supabase/supabaseClient';
import { auth } from '../../lib/firebase';
import { toast } from 'sonner';

interface ProcessingBatchItem {
    id: string;
    file: File;
    result: any;
}

export function DataProcessingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const batchData = location.state?.batch as ProcessingBatchItem[];

    const [uploadState, setUploadState] = useState<'processing' | 'success' | 'error'>('processing');
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processStage, setProcessStage] = useState('PII Classification...');
    const [processedItems, setProcessedItems] = useState<any[]>([]);

    useEffect(() => {
        if (!batchData || batchData.length === 0) {
            navigate('/dashboard/ingestion');
            return;
        }

        const runProcessingAnimation = () => {
            let progress = 0;
            const interval = setInterval(() => {
                if (progress < 100) {
                    progress += 1;
                    setProcessingProgress(progress);

                    if (progress < 25) setProcessStage('PII Classification...');
                    else if (progress < 50) setProcessStage('Schema Registry...');
                    else if (progress < 75) setProcessStage('Data Quality Check...');
                    else setProcessStage('Missingness Analysis...');
                } else {
                    clearInterval(interval);
                }
            }, 30); // Faster for better UX
            return interval;
        };

        const uploadToSupabase = async () => {
            const results = [];
            for (const item of batchData) {
                try {
                    // Set Identity for RLS - Must be done BEFORE any DB/Storage operations
                    if (auth.currentUser) {
                        console.log('Setting Supabase Identity for:', auth.currentUser.uid);
                        await setSupabaseIdentity(auth.currentUser.uid);
                    } else {
                        throw new Error('User not authenticated');
                    }

                    // Upload to Supabase Storage
                    const fileExt = item.file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `datasets/${auth.currentUser.uid}/${fileName}`;

                    console.log('Uploading to Supabase Storage:', filePath);
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('datasets')
                        .upload(filePath, item.file, {
                            upsert: true,
                            contentType: item.file.type
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('datasets')
                        .getPublicUrl(filePath);

                    // Insert metadata
                    console.log('Inserting metadata into Postgres for:', item.file.name);
                    const { error: dbError } = await supabase
                        .from('datasets')
                        .insert({
                            user_id: auth.currentUser.uid,
                            name: item.file.name,
                            url: publicUrl,
                            row_count: item.result.rowCount,
                            column_count: item.result.columnCount,
                            quality_score: item.result.qualityScore,
                            grade: item.result.grade,
                            domain: item.result.domain,
                            method: 'Manual Upload',
                            file_size: item.file.size,
                            status: 'Ready',
                            storage_path: filePath
                        });

                    if (dbError) throw dbError;

                    results.push({ ...item, status: 'success' });
                } catch (error: any) {
                    console.error('Migration failed for', item.file.name, ':', error);
                    toast.error(`Upload failed for ${item.file.name}: ${error.message}`);
                    results.push({ ...item, status: 'error', error: error.message || 'Upload failed' });
                }
            }
            setProcessedItems(results);
        };

        const animationInterval = runProcessingAnimation();
        uploadToSupabase().then(() => {
            // Wait for animation to finish or at least 3 seconds
            setTimeout(() => {
                clearInterval(animationInterval);
                setProcessingProgress(100);
                setUploadState('success');
            }, 3500);
        });

        return () => clearInterval(animationInterval);
    }, [batchData, navigate]);

    return (
        <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-6">
            <AnimatePresence mode="wait">
                {uploadState === 'processing' ? (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex flex-col items-center text-center max-w-xl w-full"
                    >
                        <div className="relative size-40 mb-10">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                            <svg className="absolute inset-0 size-40 -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="76"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="text-[#0E50F6]"
                                    strokeDasharray={`${2 * Math.PI * 76}`}
                                    strokeDashoffset={`${2 * Math.PI * 76 * (1 - processingProgress / 100)}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="size-24 bg-[#0E50F6]/5 rounded-full flex items-center justify-center">
                                    <Cpu className="size-12 text-[#0E50F6]" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Auto-Processing Engine</h2>
                        <p className="text-[#0E50F6] font-bold uppercase tracking-[0.2em] animate-pulse mb-10 text-sm">
                            {processStage}
                        </p>

                        <div className="w-full space-y-4 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                            {[
                                { label: 'PII Classification', done: processingProgress > 25 },
                                { label: 'Schema Registry', done: processingProgress > 50 },
                                { label: 'Data Quality Score', done: processingProgress > 75 },
                                { label: 'Missingness Analysis', done: processingProgress > 95 }
                            ].map((step, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-4 transition-all duration-500 ${step.done ? 'opacity-100' : 'opacity-30'}`}
                                >
                                    <div className={`size-6 rounded-full flex items-center justify-center ${step.done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        {step.done ? <CheckCircle2 className="size-4" /> : <div className="size-2 bg-slate-400 rounded-full" />}
                                    </div>
                                    <span className="text-base font-bold text-slate-700">{step.label}</span>
                                    {step.done && <span className="ml-auto text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">Verified</span>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success-page"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full max-w-5xl"
                    >
                        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col border border-slate-200/60">
                            <div className="p-10 flex flex-col items-center text-center border-b border-slate-100 bg-slate-50/30">
                                <div className="size-20 bg-green-100/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-50">
                                    <CheckCircle2 className="size-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Ingestion Successful</h2>
                                <p className="text-slate-500 font-medium max-w-lg text-lg">Your data has been processed, normalized, and is now ready for analysis.</p>
                            </div>

                            <div className="p-10 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {processedItems.map(item => (
                                        item.status === 'success' && item.result && (
                                            <div key={item.id} className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:shadow-md hover:border-blue-100 transition-all group">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                                            <FileText className="size-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-base truncate max-w-[150px]">{item.file.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                                    <CheckCircle2 className="size-2.5" />
                                                                    Valid
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.result.rowCount.toLocaleString()} Rows</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-slate-900">{item.result.grade}</div>
                                                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Grade</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Health</p>
                                                        <p className="text-lg font-bold text-slate-700">{Math.round(item.result.healthReport.validity * 100)}%</p>
                                                    </div>
                                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completeness</p>
                                                        <p className="text-lg font-bold text-slate-700">{Math.round(item.result.healthReport.completeness * 100)}%</p>
                                                    </div>
                                                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outliers</p>
                                                        <p className="text-lg font-bold text-slate-700">{item.result.columns.reduce((acc: number, col: any) => acc + (col.outlierCount || 0), 0)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={() => navigate('/dashboard/datasets')}
                                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 px-8 transition-all flex items-center gap-2"
                                >
                                    Go to Library
                                    <ArrowRight className="size-5" />
                                </Button>
                                <Button
                                    onClick={() => navigate('/dashboard/ingestion')}
                                    variant="outline"
                                    className="h-14 border-2 border-slate-200 hover:bg-white text-slate-600 font-bold text-lg rounded-xl px-8 transition-all"
                                >
                                    Upload More
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
