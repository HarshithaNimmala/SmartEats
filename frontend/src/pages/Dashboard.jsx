import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
    UploadCloud, FileText, AlertTriangle, 
    Zap, Activity, Flame, ShieldCheck, 
    TrendingUp, Clock, Info, ChevronRight,
    Search
} from 'lucide-react';

const SEVERITY_STYLE = {
    High: { dot: '🔴', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', sub: 'text-red-500' },
    Medium: { dot: '🟡', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', sub: 'text-yellow-600' },
    Low: { dot: '🟢', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', sub: 'text-green-600' },
};

const METRIC_LABELS = [
    { key: 'fasting_glucose', label: 'Fasting Glucose' },
    { key: 'postprandial_glucose', label: 'Post-Prandial Glucose' },
    { key: 'hba1c', label: 'HbA1c' },
    { key: 'systolic_bp', label: 'Systolic BP' },
    { key: 'diastolic_bp', label: 'Diastolic BP' },
    { key: 'total_cholesterol', label: 'Cholesterol' },
    { key: 'hdl', label: 'HDL' },
    { key: 'ldl', label: 'LDL' },
    { key: 'triglycerides', label: 'Triglycerides' },
    { key: 'bmi', label: 'BMI' },
    { key: 'creatinine', label: 'Creatinine' },
    { key: 'hemoglobin', label: 'Hemoglobin' },
    { key: 'wbc_count', label: 'WBC Count' },
    { key: 'total_protein', label: 'Total Protein' },
    { key: 'albumin', label: 'Albumin' },
    { key: 'globulin', label: 'Globulin' },
    { key: 'bilirubin_total', label: 'Total Bilirubin' },
    { key: 'alkaline_phosphatase', label: 'Alk. Phosphatase' },
    { key: 'sgot', label: 'SGOT (AST)' },
    { key: 'sgpt', label: 'SGPT (ALT)' },
    { key: 'ggtp', label: 'GGTP' },
];

export default function Dashboard() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState({
        health_score: 0,
        today_summary: { calories: 0, target: 2000, safe: 0, moderate: 0, avoid: 0 },
        smart_insights: [],
        recent_activity: [],
        profile: null,
        current_risk_level: "Low"
    });
    const [conditions, setConditions] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const email = localStorage.getItem('userEmail');

    const loadData = async () => {
        try {
            const res = await api.get(`/dashboard/stats?email=${email}`);
            setStats({
                health_score: res.data.health_score || 0,
                today_summary: res.data.today_summary || { calories: 0, target: 2000, safe: 0, moderate: 0, avoid: 0 },
                smart_insights: res.data.smart_insights || [],
                recent_activity: res.data.recent_activity || [],
                profile: res.data.profile || null,
                current_risk_level: res.data.current_risk_level || "Low"
            });
        } catch (err) {
            console.error("Failed to load stats", err);
        }
        try {
            const res2 = await api.get(`/detect-conditions?email=${email}`);
            setConditions(res2.data || []);
        } catch (err) {}
    };

    useEffect(() => { loadData(); }, [email]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError('');
        setUploadSuccess(false);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', email);
        try {
            const res = await fetch('http://localhost:8000/api/upload-report', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setUploadSuccess(true);
                setFile(null);
                await loadData();
            } else {
                setError(data.detail || 'Upload failed. Please try again.');
            }
        } catch (err) {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setUploading(false);
        }
    };

    const profile = stats.profile;
    const metrics = profile
        ? METRIC_LABELS
            .filter(m => profile[m.key] !== undefined && profile[m.key] !== null && profile[m.key] !== '')
            .map(m => ({ label: m.label, value: profile[m.key] }))
        : [];

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen">
            {/* ── Header ── */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-1">Welcome back, {localStorage.getItem('username') || 'User'}</p>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Your Health Dashboard</h1>
                </div>
            </div>

            {/* ── Core Metrics Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Clinical Risk Card */}
                <div className={`rounded-[2.5rem] border p-8 shadow-sm relative overflow-hidden group transition-all ${
                    stats.current_risk_level === 'High' ? 'bg-red-50 border-red-100' :
                    stats.current_risk_level === 'Medium' ? 'bg-amber-50 border-amber-100' :
                    'bg-emerald-50 border-emerald-100'
                }`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-2xl ${
                            stats.current_risk_level === 'High' ? 'bg-red-100' :
                            stats.current_risk_level === 'Medium' ? 'bg-amber-100' :
                            'bg-emerald-100'
                        }`}>
                            <AlertTriangle size={24} className={
                                stats.current_risk_level === 'High' ? 'text-red-600' :
                                stats.current_risk_level === 'Medium' ? 'text-amber-600' :
                                'text-emerald-600'
                            } />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700">Clinical Risk</h2>
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-5xl font-black tracking-tight ${
                            stats.current_risk_level === 'High' ? 'text-red-700' :
                            stats.current_risk_level === 'Medium' ? 'text-amber-700' :
                            'text-emerald-700'
                        }`}>{stats.current_risk_level}</span>
                    </div>
                </div>

                {/* Health Score Card */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck size={120} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-50 rounded-2xl">
                                <Zap size={24} className="text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-700">Health Score</h2>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-black text-slate-800">{stats.health_score}</span>
                            <span className="text-2xl font-bold text-slate-400">/100</span>
                        </div>
                        <div className="mt-6 flex items-center gap-2">
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                                    style={{ width: `${stats.health_score}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">Optimal</span>
                        </div>
                    </div>
                </div>

                {/* Today's Summary Card */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <Flame size={24} className="text-rose-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700">Today's Summary</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Calories</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-extrabold text-slate-800">{Math.round(stats.today_summary.calories)}</span>
                                <span className="text-xs font-bold text-slate-400">/ {stats.today_summary.target}</span>
                            </div>
                            <p className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-wide">
                                {stats.today_summary.calories > stats.today_summary.target ? 'Limit Exceeded' : 'On Track'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Verdicts</p>
                            <div className="flex gap-1.5">
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full h-8 bg-emerald-100 rounded-lg flex items-center justify-center font-bold text-emerald-700 text-xs">{stats.today_summary.safe}</div>
                                    <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Safe</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full h-8 bg-amber-100 rounded-lg flex items-center justify-center font-bold text-amber-700 text-xs">{stats.today_summary.moderate}</div>
                                    <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Mod</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="w-full h-8 bg-rose-100 rounded-lg flex items-center justify-center font-bold text-rose-700 text-xs">{stats.today_summary.avoid}</div>
                                    <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Avoid</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Smart Insights Card */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-50 rounded-2xl">
                            <Activity size={24} className="text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700">Smart Insights</h2>
                    </div>
                    <div className="space-y-4">
                        {stats.smart_insights.map((insight, i) => (
                            <div key={i} className="flex gap-3 items-start group">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{insight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Sub Row: Activity & Upload ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 rounded-xl">
                                <Clock size={20} className="text-slate-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-700">Recent Activity</h2>
                        </div>
                        <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="space-y-1">
                        {stats.recent_activity.length > 0 ? (
                            stats.recent_activity.map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 group cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            {i + 1}
                                        </div>
                                        <p className="font-bold text-slate-700 group-hover:translate-x-1 transition-transform">{item.food_name || item.name}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400" />
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <p className="text-slate-400 text-sm font-medium">No recent items found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Section (Integrated) */}
                <div className="flex flex-col gap-4">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const dropped = e.dataTransfer.files[0];
                            if (dropped) setFile(dropped);
                        }}
                        onClick={() => document.getElementById('report-upload')?.click()}
                        className={`flex-1 border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                    >
                        <input
                            id="report-upload"
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => { setFile(e.target.files?.[0]); setUploadSuccess(false); }}
                        />
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <UploadCloud size={32} className="text-slate-400" />
                        </div>
                        {file ? (
                            <div className="flex items-center gap-2 text-indigo-700 font-bold">
                                <FileText size={18} />
                                {file.name}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="font-bold text-slate-700">Update Health Report</p>
                                <p className="text-xs text-slate-400 font-medium tracking-tight">PDF, JPG or PNG (Max 10MB)</p>
                            </div>
                        )}
                    </div>
                    {file && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
                        >
                            {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={20} />}
                            {uploading ? 'Processing Architecture...' : 'Analyze Report Metrics'}
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications Bar */}
            {uploadSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-6 py-4 rounded-[1.5rem] mb-8 font-bold text-sm flex items-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    Medical profile synchronized with baseline AI models.
                </div>
            )}
            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-[1.5rem] mb-8 flex items-center gap-3">
                    <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                    <span className="text-rose-700 text-sm font-bold">{error}</span>
                </div>
            )}

            {/* ── Drill-down Detail Section ── */}
            <div className="space-y-10 pt-4 border-t border-slate-100">
                {/* Health snapshot - Metrics */}
                {metrics.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <TrendingUp size={20} className="text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Biometric Snapshot</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {metrics.map((m, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm group hover:border-indigo-200 transition-colors">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{m.label}</p>
                                    <p className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {typeof m.value === 'string'
                                            ? m.value.replace(/[^\d.]/g, '') || m.value
                                            : m.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Conditions Section */}
                {conditions.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-rose-50 rounded-xl">
                                <AlertTriangle size={20} className="text-rose-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Detected Indicators</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {conditions.map((c, i) => {
                                const style = SEVERITY_STYLE[c.status] || SEVERITY_STYLE.Low;
                                return (
                                    <div key={i} className={`${style.bg} border ${style.border} rounded-2xl p-6 relative group overflow-hidden`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                            <ShieldCheck size={60} />
                                        </div>
                                        <p className={`font-black text-lg ${style.text} mb-1`}>
                                            {style.dot} {c.name}
                                        </p>
                                        <p className={`text-sm font-semibold leading-relaxed ${style.sub}`}>{c.indicator}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {metrics.length === 0 && !uploading && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                            <Search size={40} className="text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3">No Biometric Data Found</h3>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                            Upload a medical report above to sync your clinical metrics. Our AI will analyze blood markers to curate your personalized nutrition plan.
                        </p>
                        <button 
                            onClick={() => document.getElementById('report-upload')?.click()}
                            className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Sync Report Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
