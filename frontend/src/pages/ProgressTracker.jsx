import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, Info, ClipboardList, HeartPulse } from 'lucide-react';

const METRICS = [
    { key: 'hba1c', label: 'HbA1c', color: '#6366f1', unit: '%' },
    { key: 'glucose', label: 'Glucose', color: '#10b981', unit: 'mg/dL' },
    { key: 'cholesterol', label: 'Cholesterol', color: '#f59e0b', unit: 'mg/dL' },
    { key: 'bmi', label: 'BMI', color: '#ec4899', unit: '' },
    { key: 'hemoglobin', label: 'Hemoglobin', color: '#dc2626', unit: 'g/dL' },
    { key: 'systolic', label: 'Systolic BP', color: '#f43f5e', unit: 'mmHg' },
    { key: 'diastolic', label: 'Diastolic BP', color: '#fb7185', unit: 'mmHg' },
];

export default function ProgressTracker() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const email = localStorage.getItem('userEmail');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/progress/${email}`);
                setData(res.data || []);
            } catch (err) {
                console.error("Failed to fetch progress", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [email]);

    const generateInsights = () => {
        if (data.length < 2) return [];
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        const insights = [];

        // Core Metabolic Markers
        ['hba1c', 'glucose', 'cholesterol', 'bmi'].forEach(k => {
            const m = METRICS.find(mi => mi.key === k);
            const cur = latest[k];
            const prev = previous[k];
            if (cur !== undefined && cur !== null && prev !== undefined && prev !== null) {
                const diff = cur - prev;
                if (Math.abs(diff) > 0.01) {
                    const improved = diff < 0; // Lower is better for all these 4
                    insights.push({
                        metric: m.label,
                        text: improved 
                            ? `${m.label} improved from ${prev}${m.unit} → ${cur}${m.unit}` 
                            : `${m.label} is rising from ${prev}${m.unit} → ${cur}${m.unit}`,
                        positive: improved,
                        icon: improved ? <TrendingDown size={18} className="text-emerald-500" /> : <TrendingUp size={18} className="text-rose-500" />
                    });
                }
            }
        });

        // Special handling for Blood Pressure
        const curBP = latest.bp || (latest.systolic && latest.diastolic ? `${latest.systolic}/${latest.diastolic}` : null);
        const prevBP = previous.bp || (previous.systolic && previous.diastolic ? `${previous.systolic}/${previous.diastolic}` : null);
        
        if (curBP && prevBP) {
            const curSys = latest.systolic;
            const prevSys = previous.systolic;
            if (curSys && prevSys) {
                const diff = curSys - prevSys;
                if (Math.abs(diff) < 2) {
                    insights.push({
                        metric: 'Blood Pressure',
                        text: `Your BP is stable at ${curBP} mmHg`,
                        positive: true,
                        icon: <Minus size={18} className="text-slate-400" />
                    });
                } else {
                    const improved = diff < 0;
                    insights.push({
                        metric: 'Blood Pressure',
                        text: improved ? `BP improved from ${prevBP} → ${curBP}` : `BP is rising from ${prevBP} → ${curBP}`,
                        positive: improved,
                        icon: improved ? <TrendingDown size={18} className="text-emerald-500" /> : <TrendingUp size={18} className="text-rose-500" />
                    });
                }
            }
        }

        return insights;
    };

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center min-h-screen">
                <Activity className="animate-spin text-lavender-600" size={48} />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-screen text-center">
                <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mb-6">
                    <ClipboardList size={64} className="text-slate-300" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">No progress data yet</h2>
                <p className="text-slate-500 mt-3 max-w-md mx-auto text-lg font-medium leading-relaxed">
                    Upload your medical reports in the Dashboard to start tracking your health journey automatically.
                </p>
                <a href="/dashboard" className="mt-8 px-8 py-4 bg-lavender-600 text-white font-bold rounded-2xl shadow-xl shadow-lavender-200 hover:bg-slate-900 transition-all">
                    Go to Dashboard
                </a>
            </div>
        );
    }

    const insights = generateInsights();

    return (
        <div className="p-10 bg-[#f8fafc] min-h-screen">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Health Progress Tracker</h1>
                <p className="text-slate-500 mt-2 text-lg font-medium">Automatic clinical trend analysis from your medical history.</p>
            </header>

            {/* Insights Section */}
            {insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {insights.map((insight, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border shadow-sm ${insight.positive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-xl ${insight.positive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {insight.icon}
                                </div>
                                <span className="font-black text-slate-800 text-sm italic tracking-tight">{insight.metric}</span>
                            </div>
                            <p className={`text-sm font-bold leading-relaxed ${insight.positive ? 'text-emerald-800' : 'text-rose-800'}`}>
                                {insight.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {METRICS.map(m => {
                    const metricData = data.filter(d => d[m.key] !== undefined && d[m.key] !== null);
                    
                    if (metricData.length === 0) return null;

                    return (
                        <div key={m.key} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-lavender-50 transition-colors">
                                        <HeartPulse size={24} style={{ color: m.color }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{m.label} Trend</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinical Analysis</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-slate-800">
                                        {metricData.length > 0 ? metricData[metricData.length - 1][m.key] : '--'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 ml-1 uppercase">{m.unit}</span>
                                </div>
                            </div>

                            <div className="mt-auto overflow-hidden" style={{ height: '300px', width: '100%', minHeight: '300px' }}>
                                <ResponsiveContainer width="99%" height="100%">
                                    <LineChart data={metricData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dx={-5}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '16px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontWeight: 800,
                                                fontSize: '12px'
                                            }}
                                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey={m.key} 
                                            stroke={m.color} 
                                            strokeWidth={4} 
                                            dot={{ r: 6, fill: m.color, strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8, stroke: '#fff', strokeWidth: 4 }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <footer className="mt-12 p-8 bg-white border border-slate-100 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 bg-lavender-50 rounded-xl text-lavender-600">
                    <Info size={24} />
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                    All data points are extracted from verified medical reports using clinical-grade OCR. 
                    Contact your health provider if you notice any unexpected significant trends.
                </p>
            </footer>
        </div>
    );
}
