import React, { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, ShieldCheck, ShieldAlert, AlertCircle, Quote, Scale, TriangleAlert, RefreshCw, Camera, Upload, Zap } from 'lucide-react';
import api from '../api/client';

export default function NutritionLookup() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState('manual'); // manual, scan
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const email = localStorage.getItem('userEmail');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null); // Clear previous results
        }
    };

    const handleScanLabel = async () => {
        if (!selectedImage) return;
        
        setLoading(true);
        setResult(null);
        
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('email', email);

        try {
            const response = await fetch('http://localhost:8000/api/nutrition/scan', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                setResult(data);
            } else {
                alert(data.detail || "Failed to scan label");
            }
        } catch (error) {
            console.error("Scan error:", error);
            alert("Connection error. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query) return;
        
        setLoading(true);
        try {
            const res = await api.post(`/nutrition/search?query=${query}&email=${email}`);
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert("Analysis failed. Try a more specific dish name.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogFood = async (data) => {
        const btn = document.getElementById('log-btn');
        if (btn) {
            btn.innerText = "Syncing to Dashboard...";
            btn.style.opacity = "0.7";
        }
        
        try {
            await api.post('/food-log', {
                email: email,
                food_data: data
            });
            if (btn) {
                btn.innerText = "✔ Logged Successfully";
                btn.style.backgroundColor = "#10b981";
                btn.style.color = "white";
                btn.style.opacity = "1";
            }
        } catch (err) {
            console.error("Log error:", err);
            if (btn) {
                btn.innerText = "Error - Try Again";
                btn.style.opacity = "1";
            }
        }
    };

    const getVerdictStyle = (status) => {
        switch (status) {
            case 'Avoid': return { bg: 'bg-[#fff5f5] border-[#ffe3e3]', text: 'text-[#862e2e]', accent: 'bg-[#e03131]', icon: <ShieldAlert className="w-8 h-8" />, label: 'HIGH RISK' };
            case 'Moderate': return { bg: 'bg-[#fffbeb] border-[#fef3c7]', text: 'text-[#92400e]', accent: 'bg-[#f59e0b]', icon: <TriangleAlert className="w-8 h-8" />, label: 'MODERATE' };
            case 'Safe': return { bg: 'bg-[#f0fdf4] border-[#dcfce7]', text: 'text-[#166534]', accent: 'bg-[#22c55e]', icon: <ShieldCheck className="w-8 h-8" />, label: 'SAFE' };
            default: return { bg: 'bg-[#f0f9ff] border-[#e0f2fe]', text: 'text-[#075985]', accent: 'bg-[#0ea5e9]', icon: <Sparkles className="w-8 h-8" />, label: 'OPTIMAL' };
        }
    };

    return (
        <div className="flex-1 p-10 bg-[#faf8ff] min-h-screen">
            <header className="max-w-4xl mx-auto mb-12 text-center animate-fade-in">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <h1 className="text-6xl font-black text-lavender-600 tracking-tighter">Nutrition Lookup</h1>
                    <div className="bg-lavender-600 p-3 rounded-2xl text-white shadow-xl shadow-lavender-100">
                        <Search size={32} />
                    </div>
                </div>
                <p className="text-xl text-slate-400 font-bold tracking-tight">Find macro-nutrients (Values per 100g or per serving)</p>
            </header>

            <main className="max-w-4xl mx-auto">
                {/* Search Tabs */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 p-12 mb-10 border border-slate-50">
                    <div className="flex gap-4 mb-8">
                        <button 
                            onClick={() => setActiveTab('manual')}
                            className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-lavender-600 text-white shadow-lg shadow-lavender-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            Manual Search
                        </button>
                        <button 
                             onClick={() => setActiveTab('scan')}
                             className={`px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'scan' ? 'bg-lavender-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            Scan Label 📷
                        </button>
                    </div>

                    {activeTab === 'manual' ? (
                        <form onSubmit={handleSearch} className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3 ml-1">Enter a food item (e.g. Samosa, Paneer Tikka, Apple):</label>
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="masala dosa"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-6 text-2xl font-black text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-lavender-500 focus:ring-8 focus:ring-lavender-500/5 transition-all"
                                    />
                                    {loading && <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 text-lavender-600 animate-spin" size={28} />}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-lavender-600 hover:bg-lavender-700 text-white py-6 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-lavender-200/50 transform active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? "Analyzing Ingredients..." : "Start Deep Analysis"}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-8">
                            <div className="relative">
                                <input 
                                    type="file" 
                                    id="label-upload" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <label 
                                    htmlFor="label-upload"
                                    className={`
                                        flex flex-col items-center justify-center w-full min-h-[320px] 
                                        border-4 border-dashed rounded-[3rem] cursor-pointer 
                                        transition-all duration-500 overflow-hidden group
                                        ${previewUrl 
                                            ? 'border-lavender-500/50 bg-slate-50' 
                                            : 'border-slate-100 hover:border-lavender-500/30 bg-slate-50 hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    {previewUrl ? (
                                        <div className="relative w-full aspect-video">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-lavender-600 font-black uppercase tracking-widest text-sm">
                                                    <Upload size={20} /> Change Image
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-lavender-50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                                                <Camera className="text-lavender-600" size={48} />
                                            </div>
                                            <p className="text-xl font-black text-slate-800 tracking-tight">Upload Product Label</p>
                                            <p className="text-slate-400 font-bold mt-2">Click or drag & drop (PNG, JPG)</p>
                                        </>
                                    )}
                                </label>
                            </div>

                                        <button
                                            onClick={handleScanLabel}
                                            disabled={loading}
                                            className="w-full bg-lavender-600 hover:bg-lavender-700 text-white py-6 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-lavender-200/50 transform active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="animate-spin" size={28} />
                                                    <span className="animate-pulse">Reasoning Pipeline Active...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Sparkles size={24} />
                                                    Analyze with Vision AI V2 (CoT)
                                                </>
                                            )}
                                        </button>
                        </div>
                    )}
                </div>

                {result && result.invalid_query ? (
                    <div className="bg-white rounded-[2.5rem] border-4 border-red-100 p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col items-center gap-6">
                            <div className="bg-red-50 p-6 rounded-full text-red-500">
                                <TriangleAlert size={64} />
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
                                Analysis Limited
                            </h2>
                            <p className="text-xl font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                                {result.error_message || "This item does not appear to be a valid food or drink."}
                            </p>
                        </div>
                    </div>
                ) : result && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {/* Summary Bar */}
                        <div className="bg-lavender-50 border border-lavender-100/50 px-8 py-5 rounded-[1.5rem] flex items-center gap-3">
                             <Sparkles className="text-lavender-600" size={24} />
                             <span className="text-xl font-black text-lavender-800 tracking-tight">Nutrition facts for <span className="underline decoration-wavy underline-offset-4 decoration-lavender-300">{result.name}</span></span>
                        </div>

                        {/* Macro Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Calories', val: result.calories, unit: 'kcal' },
                                { label: 'Protein', val: result.protein, unit: 'g' },
                                { label: 'Carbs', val: result.carbs, unit: 'g' },
                                { label: 'Fiber', val: result.fiber, unit: 'g' },
                                { label: 'Sugar', val: result.sugar, unit: 'g' },
                                { label: 'Total Fat', val: result.fat, unit: 'g' },
                                { label: 'Sat. Fat', val: result.sat_fat, unit: 'g' },
                                { label: 'Sodium', val: result.sodium, unit: 'mg' }
                            ].map((m, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-xl shadow-slate-100/50 text-center flex flex-col items-center group hover:scale-105 transition-all">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{m.label}</span>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-lavender-600 transition-colors">{m.val}</span>
                                        <span className="text-sm font-bold text-slate-400">{m.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Verdict Section */}
                        {(() => {
                            const style = getVerdictStyle(result.verdict?.status);
                            return (
                                <div className={`w-full rounded-[3rem] border border-slate-200 ${style.bg} p-12 text-center shadow-xl relative overflow-hidden`}>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className={style.text}>{style.icon}</div>
                                        <h2 className={`text-8xl font-black tracking-tighter mb-2 ${style.text}`}>
                                            {style.label}
                                        </h2>
                                        <p className={`text-2xl font-bold opacity-80 tracking-tight text-slate-600 mb-8`}>
                                            Based on your current health profile
                                        </p>

                                        <button 
                                            id="log-btn"
                                            onClick={() => handleLogFood(result)}
                                            className="bg-white/80 backdrop-blur-xl border border-white/50 px-12 py-5 rounded-[2rem] font-black text-xl text-slate-800 tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-200/20"
                                        >
                                            🚀 Log to Clinical Dashboard
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Detailed Insights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                            {/* Scientific Rationale */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 p-10 relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <Quote size={20} className="text-lavender-600" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Scientific Rationale</h4>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-bold opacity-90 italic text-lg">
                                    "{result.scientific_rationale}"
                                </p>
                            </div>

                            {/* Portion Advice */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 p-10 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <Scale size={20} className="text-blue-500" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Portion Advice</h4>
                                </div>
                                <div className="bg-blue-50/30 p-8 rounded-[2rem] border border-blue-100">
                                     <p className="text-blue-700 font-bold text-xl leading-snug tracking-tight">
                                        {result.portion_advice}
                                     </p>
                                </div>
                            </div>

                            {/* Specific Warnings */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 p-10 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <TriangleAlert size={20} className="text-red-500" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Specific Warnings</h4>
                                </div>
                                <ul className="space-y-6">
                                    {result.specific_warnings?.map((w, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                            <span className="text-slate-700 font-bold text-lg leading-tight">{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Healthier Swaps */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 p-10 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                    <RefreshCw size={20} className="text-emerald-500" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Healthier Swaps</h4>
                                </div>
                                <ul className="space-y-6">
                                    {result.healthier_swaps?.map((s, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs mt-1 shrink-0">✦</div>
                                            <span className="text-slate-700 font-bold text-lg leading-tight">{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
