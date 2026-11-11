import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { Button } from './ui';

export default function UploadReport({ email, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    const fileInputRef = useRef(null);

    const handleFileDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    };
    
    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !email) return;
        
        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', email); // Needed to save to specific user profile
        
        try {
            const res = await api.post('/upload-report', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
            setStatus('success');
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.detail || "Failed to process report");
            setStatus('error');
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 w-full animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Upload Medical Report</h2>
            
            <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${file ? 'border-lavender-500 bg-lavender-50' : 'border-slate-300 hover:border-lavender-400 hover:bg-[#faf8ff]'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".pdf,image/*" 
                />
                
                <UploadCloud className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-lavender-600' : 'text-slate-400'}`} />
                <p className="text-slate-600 font-medium">
                    {file ? file.name : "Drag & drop your report here or click to browse"}
                </p>
                <p className="text-sm text-slate-400 mt-1">Supports PDF, PNG, JPG</p>
            </div>
            
            <div className="mt-6 flex justify-end">
                <div className="w-56">
                    <Button 
                        onClick={handleUpload} 
                        disabled={!file || status === 'uploading'}
                        isLoading={status === 'uploading'}
                        className="button-text-fix"
                    >
                        <span className="font-bold tracking-wide">
                            {status === 'uploading' ? 'Analyzing...' : 'Parse Report'}
                        </span>
                    </Button>
                </div>
            </div>
            
            {status === 'error' && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}
            
            {status === 'success' && result && (
                <div className="mt-6 animate-fade-in border-t border-slate-100 pt-6">
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 mb-6">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">Analysis Complete! Data synced to profile.</span>
                    </div>
                    
                    <h3 className="font-semibold text-slate-800 mb-3 text-lg">Extracted Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {Object.entries(result.extracted_data || {}).map(([k, v]) => (
                            <div key={k} className="bg-[#faf8ff] p-4 rounded-xl border border-lavender-100 shadow-sm">
                                <p className="text-xs text-lavender-600 font-bold uppercase mb-1">{k.replace(/_/g, ' ')}</p>
                                <p className="text-slate-800 font-semibold text-lg">{String(v)}</p>
                            </div>
                        ))}
                        {Object.keys(result.extracted_data || {}).length === 0 && (
                            <p className="text-sm text-slate-500 col-span-full">No measurable parameters could be confidently extracted from this report.</p>
                        )}
                    </div>
                    
                </div>
            )}
        </div>
    );
}
