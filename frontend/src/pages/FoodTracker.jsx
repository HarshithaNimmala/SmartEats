import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { 
    BarChart as RechartsBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

export default function FoodTracker() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const email = localStorage.getItem('userEmail');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/dashboard/stats?email=${email}`);
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [email]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-lavender-600 border-t-transparent"></div>
            </div>
        );
    }

    const logs = stats?.profile?.food_logs || stats?.recent_logs || [];
    const totalLogs = logs.length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weekLogs = logs.filter(log => new Date(log.timestamp) >= sevenDaysAgo);
    const safeCount = weekLogs.filter(l => (l.verdict || "").toUpperCase() === "SAFE").length;
    const modCount = weekLogs.filter(l => (l.verdict || "").toUpperCase() === "MODERATE").length;
    const avoidCount = weekLogs.filter(l => (l.verdict || "").toUpperCase() === "AVOID").length;
    
    const totalWeekLogs = weekLogs.length;
    const healthScore = totalWeekLogs > 0 
        ? Math.round(((safeCount * 1.0) + (modCount * 0.5)) / totalWeekLogs * 100) 
        : 100;

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map(date => {
        const dayLogs = logs.filter(l => l.timestamp && l.timestamp.startsWith(date));
        const totalCals = dayLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
        return {
            date: new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
            calories: totalCals,
        };
    });

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekLogs = [...logs].filter(log => {
        if (!log.timestamp) return false;
        return new Date(log.timestamp) >= startOfWeek;
    });

    const groupedLogsMap = new Map();
    [...thisWeekLogs].reverse().forEach(log => {
        const name = (log.food_name || "Unknown").trim().toLowerCase();
        if (!groupedLogsMap.has(name)) {
            groupedLogsMap.set(name, { ...log, count: 1, totalCals: (log.calories || 0) });
        } else {
            const existing = groupedLogsMap.get(name);
            existing.count += 1;
            existing.totalCals += (log.calories || 0);
        }
    });
    const groupedLogs = Array.from(groupedLogsMap.values());

    const weekLabel = `${startOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

    return (
        <div className="p-10 bg-[#f8fafc] min-h-screen space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-800">Food Tracker 📊</h1>
                <p className="text-slate-500 mt-2 text-lg">Your recent meals and health analytics</p>
            </div>
            
            {logs.length === 0 ? (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200">
                    You haven't logged any meals yet. Go to the <strong>Nutrition Lookup</strong> tab to scan or search for food and log it!
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 font-semibold mb-1">Total Meals Logged</p>
                            <p className="text-3xl font-bold text-slate-800">{totalLogs}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 font-semibold mb-1">Meals Past 7 Days</p>
                            <p className="text-3xl font-bold text-slate-800">{totalWeekLogs}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 font-semibold mb-1">Weekly Health Score</p>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-bold text-slate-800">{healthScore}/100</p>
                                <p className="text-red-500 font-bold text-sm">↓ Avoids: {avoidCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 w-full my-8"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">This Week's Food Logs</h2>
                            <p className="text-sm text-slate-400 mb-5">{weekLabel}</p>
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Latest Log</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Food</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Count</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Total Cals</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Verdict</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {groupedLogs.slice(0, 10).map((log, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {log.timestamp ? new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-800 capitalize">
                                                        {log.food_name || "Unknown"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                                                        x{log.count}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {log.totalCals || 0}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase
                                                            ${(log.verdict || "SAFE").toUpperCase() === "SAFE" ? "bg-emerald-100 text-emerald-800" : 
                                                              (log.verdict || "").toUpperCase() === "MODERATE" ? "bg-amber-100 text-amber-800" : 
                                                              "bg-red-100 text-red-800"}`}>
                                                            {log.verdict || "SAFE"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Weekly Caloric Intake</h2>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 h-[400px]">
                                {totalWeekLogs > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px' }} />
                                            <Bar dataKey="calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        No data for the past 7 days.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 w-full my-8"></div>

                    <div>
                        {avoidCount >= 3 ? (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="text-red-500" />
                                <span className="text-red-800 text-sm">
                                    <strong>Alert:</strong> You've consumed an 'AVOID' food {avoidCount} times in the last 7 days. Consider swapping these for healthier alternatives!
                                </span>
                            </div>
                        ) : avoidCount > 0 ? (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="text-amber-500" />
                                <span className="text-amber-800 text-sm">
                                    <strong>Warning:</strong> You've consumed an 'AVOID' food {avoidCount} time(s) this week. Keep an eye on your consumption.
                                </span>
                            </div>
                        ) : totalWeekLogs > 0 ? (
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-500" />
                                <span className="text-emerald-800 text-sm">
                                    <strong>Great job!</strong> You haven't consumed any 'AVOID' foods this week.
                                </span>
                            </div>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}
