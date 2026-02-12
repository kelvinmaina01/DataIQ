import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database,
    Zap,
    ShieldCheck,
    Search,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Activity,
    Lock,
    Server,
    AlertCircle,
    Cpu,
    FileText
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
                            method: (item as any).method || 'Manual Upload',
                            file_size: item.file.size,
                            status: 'Ready',
                            storage_path: filePath
                        });

                    if (dbError) throw dbError;

                    results.push({
                        id: item.id,
                        file: item.file,
                        result: item.result,
                        status: 'success'
                    });

                } catch (error: any) {
                    if (error.message?.includes('AbortError') || error.name === 'AbortError') return;
                    console.error('Upload error:', error);
                    results.push({
                        id: item.id,
                        file: item.file,
                        status: 'error',
                        error: error.message
                    });
                }
            }
            return results;
        };

        const animationInterval = runProcessingAnimation();
        uploadToSupabase().then(results => {
            if (results) {
                setProcessedItems(results);
                const allSuccess = results.every(r => r.status === 'success');
                setTimeout(() => {
                    setUploadState(allSuccess ? 'success' : 'error');
                }, 1000);
            }
        });

        return () => clearInterval(animationInterval);
    }, [batchData, navigate]);

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-8">
            <AnimatePresence mode="wait">
                {uploadState === 'processing' ? (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <div className="text-center mb-12">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Processing Your Data</h1>
                            <p className="text-slate-500 font-medium">Analyzing and optimizing your dataset...</p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Cpu className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Auto-Processing Engine</h3>
                                        <p className="text-sm text-slate-500">{processStage}</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-primary">{Math.round(processingProgress)}%</span>
                            </div>

                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${processingProgress}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="h-full bg-primary rounded-full"
                                />
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: 'PII Classification', done: processingProgress > 25 },
                                    { label: 'Schema Registry', done: processingProgress > 50 },
                                    { label: 'Data Quality Score', done: processingProgress > 75 },
                                    { label: 'Missingness Analysis', done: processingProgress > 95 }
                                ].map((step, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-4 transition-opacity duration-300 ${step.done ? 'opacity-100' : 'opacity-40'}`}
                                    >
                                        <div className={`size-6 rounded-full flex items-center justify-center transition-colors ${step.done ? 'bg-green-500' : 'bg-slate-200'}`}>
                                            {step.done && <CheckCircle2 className="size-4 text-white" />}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{step.label}</span>
                                        {step.done && (
                                            <span className="ml-auto text-xs font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : uploadState === 'success' && processedItems.some(i => i.status === 'success') ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <div className="text-center py-8 bg-gradient-to-b from-green-50/50 to-transparent rounded-2xl">
                            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <CheckCircle2 className="size-8 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Ingestion Successful</h1>
                            <p className="text-slate-500 font-medium">Your data has been processed, normalized, and is now ready for analysis.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {processedItems.map(item => (
                                item.status === 'success' && item.result && (
                                    <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                                    <FileText className="size-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{item.file.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                            <CheckCircle2 className="size-3" />
                                                            Valid
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400">{item.result.rowCount.toLocaleString()} Rows</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-slate-900">{item.result.grade}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase">Grade</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Health</p>
                                                <p className="text-lg font-bold text-slate-700">{Math.round(item.result.healthReport.validity * 100)}%</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Complete</p>
                                                <p className="text-lg font-bold text-slate-700">{Math.round(item.result.healthReport.completeness * 100)}%</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Outliers</p>
                                                <p className="text-lg font-bold text-slate-700">{item.result.columns.reduce((acc: number, col: any) => acc + (col.outlierCount || 0), 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-200 max-w-2xl mx-auto w-full">
                            <Button
                                onClick={() => navigate('/dashboard/datasets')}
                                className="flex-1 h-12 !bg-primary hover:!bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                            >
                                Go to Library
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                            <Button
                                onClick={() => navigate('/dashboard/ingestion')}
                                variant="outline"
                                className="flex-1 h-12 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
                            >
                                Upload More
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <div className="text-center py-8">
                            <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <AlertCircle className="size-8 text-red-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Ingestion Failed</h1>
                            <p className="text-slate-500 font-medium">We encountered a security policy or connection error during the upload process.</p>
                        </div>

                        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                            <h4 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-3">Diagnostic Log</h4>
                            {processedItems.filter(i => i.status === 'error').map((item, idx) => (
                                <p key={idx} className="text-xs font-mono text-red-600 break-all mb-2">
                                    {item.file.name}: {item.error}
                                </p>
                            ))}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => navigate('/dashboard/ingestion')}
                                className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-8"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={() => navigate('/dashboard/datasets')}
                                variant="outline"
                                className="h-12 border-2 border-slate-200 font-bold rounded-xl px-8"
                            >
                                Back to Library
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
