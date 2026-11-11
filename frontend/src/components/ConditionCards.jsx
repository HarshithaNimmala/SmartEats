import React from 'react';

export default function ConditionCards({ conditions }) {
    if (!conditions || conditions.length === 0) {
        return null; // Don't show anything if no conditions
    }

    const getStatusStyles = (status) => {
        switch (status) {
            case 'High':
                return {
                    bg: 'bg-[#fff5f5] border-[#ffe3e3]',
                    dot: 'bg-[#e03131] shadow-[0_0_8px_rgba(224,49,49,0.4)]',
                    title: 'text-[#862e2e]',
                    indicator: 'text-[#c92a2a]'
                };
            case 'Medium':
                return {
                    bg: 'bg-[#fffbeb] border-[#fef3c7]',
                    dot: 'bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.4)]',
                    title: 'text-[#92400e]',
                    indicator: 'text-[#b45309]'
                };
            case 'Low':
                return {
                    bg: 'bg-[#f0f9ff] border-[#e0f2fe]',
                    dot: 'bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.4)]',
                    title: 'text-[#075985]',
                    indicator: 'text-[#0369a1]'
                };
            default:
                return {
                    bg: 'bg-slate-50 border-slate-100',
                    dot: 'bg-slate-400',
                    title: 'text-slate-800',
                    indicator: 'text-slate-600'
                };
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            {conditions.map((cond, idx) => {
                const styles = getStatusStyles(cond.status);
                return (
                    <div 
                        key={idx} 
                        className={`rounded-2xl border px-6 py-5 transition-all w-full animate-fade-in ${styles.bg}`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-3.5 h-3.5 rounded-full ${styles.dot}`}></div>
                            <h4 className={`font-bold text-lg tracking-tight ${styles.title}`}>
                                {cond.name}
                            </h4>
                        </div>
                        
                        <p className={`text-sm font-medium ${styles.indicator}`}>
                            {cond.indicator}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
