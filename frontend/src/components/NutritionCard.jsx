import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

export default function NutritionCard({ data }) {
    if (!data) return null;

    const { name, calories, protein, carbs, fat, sugar, fiber, verdict } = data;

    const getVerdictStyle = (status) => {
        switch (status) {
            case 'Avoid': return { bg: 'bg-red-50 border-red-100', text: 'text-red-700', icon: <ShieldAlert className="w-5 h-5" />, accent: 'bg-red-600' };
            case 'Warning': return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-800', icon: <AlertCircle className="w-5 h-5" />, accent: 'bg-amber-500' };
            case 'Safe': return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <ShieldCheck className="w-5 h-5" />, accent: 'bg-emerald-500' };
            default: return { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', icon: <Sparkles className="w-5 h-5" />, accent: 'bg-blue-600' };
        }
    };

    const style = getVerdictStyle(verdict?.status);

    const Macro = ({ label, value, unit, color }) => (
        <div className="flex flex-col bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-sm transition-transform hover:scale-[1.02]">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold text-slate-800`}>{value}</span>
                <span className="text-xs text-slate-400 font-medium">{unit}</span>
            </div>
            <div className={`h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden`}>
                <div 
                    className={`h-full ${color} rounded-full transition-all duration-1000`} 
                    style={{ width: `${Math.min(100, (value / (label === 'Calories' ? 1000 : 50)) * 100)}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500 space-y-4">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{name}</h3>
                        <div className="flex items-center gap-2">
                             <span className="px-2.5 py-0.5 bg-lavender-100 text-lavender-700 text-[10px] font-black uppercase rounded-full">Automated Analysis</span>
                             <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                             <span className="text-xs text-slate-400 font-medium">Approx. per serving</span>
                        </div>
                    </div>
                    <div className={`${style.bg} border px-4 py-3 rounded-2xl flex items-center gap-3 transition-colors`}>
                        <div className={style.text}>{style.icon}</div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${style.text}`}>Personalized Verdict</span>
                            <span className={`text-sm font-bold ${style.text}`}>{verdict?.status || "Analyzing"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <Macro label="Calories" value={calories} unit="kcal" color="bg-lavender-500" />
                    <Macro label="Protein" value={protein} unit="g" color="bg-emerald-500" />
                    <Macro label="Carbs" value={carbs} unit="g" color="bg-amber-500" />
                    <Macro label="Fat" value={fat} unit="g" color="bg-rose-500" />
                    <Macro label="Sugar" value={sugar} unit="g" color="bg-orange-500" />
                    <Macro label="Fiber" value={fiber} unit="g" color="bg-teal-500" />
                </div>

                <div className={`${style.bg} border p-5 rounded-2xl relative overflow-hidden transition-all duration-300`}>
                    <div className={`absolute top-0 left-0 h-full w-1.5 ${style.accent}`}></div>
                    <h4 className={`text-md font-bold mb-1 flex items-center gap-2 ${style.text}`}>
                        Health Insight for You
                    </h4>
                    <p className={`text-sm leading-relaxed font-medium opacity-90 ${style.text}`}>
                        {verdict?.message || "No profile patterns found. Update your medical indicators for precise advice."}
                    </p>
                </div>
            </div>
        </div>
    );
}
