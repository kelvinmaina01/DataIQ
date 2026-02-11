import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileJson, FileSpreadsheet, FileArchive } from 'lucide-react';
import { motion } from 'framer-motion';

interface DropzoneAreaProps {
    onFilesSelected: (files: File[]) => void;
}

export function DropzoneArea({ onFilesSelected }: DropzoneAreaProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFilesSelected(acceptedFiles);
        }
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            'text/csv': ['.csv'],
            'text/tab-separated-values': ['.tsv'],
            'text/plain': ['.txt'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/json': ['.json'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/zip': ['.zip'],
            'application/x-zip-compressed': ['.zip']
        }
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-[2rem] p-16 flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/30'
                }`}
        >
            <input {...getInputProps()} />

            <motion.div
                animate={isDragActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                className="size-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 z-10"
            >
                <Upload className={`size-10 transition-colors ${isDragActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
            </motion.div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 z-10">
                {isDragActive ? 'Drop files to upload' : 'Drop your file here or click to browse'}
            </h3>
            <p className="text-slate-400 font-medium mb-8 z-10">
                Supports CSV, Excel, JSON, and ZIP archives up to 50MB
            </p>

            <div className="flex gap-4 z-10">
                <FileSpreadsheet className="size-6 text-slate-300" />
                <FileJson className="size-6 text-slate-300" />
                <FileText className="size-6 text-slate-300" />
                <FileArchive className="size-6 text-slate-300" />
            </div>

            {isDragActive && (
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            )}
        </div>
    );
}
