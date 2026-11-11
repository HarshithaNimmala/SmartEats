import React from 'react';

export const Button = ({ children, variant = 'primary', isLoading, className = "", ...props }) => {
    const baseStyle = "w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-offset-2";
    
    const variants = {
        primary: "bg-lavender-600 hover:bg-lavender-500 text-white shadow-[0_4px_14px_0_rgba(147,51,234,0.39)] hover:shadow-[0_6px_20px_rgba(147,51,234,0.23)] focus:ring-lavender-500 border border-transparent focus:ring-offset-white",
        secondary: "bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-200 focus:ring-slate-200 shadow-sm"
    };

    return (
        <button 
            className={`${baseStyle} ${variants[variant]} ${isLoading ? 'opacity-70 cursor-wait' : ''} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};

export const Input = ({ label, id, error, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-lavender-600 text-slate-600 transition-colors">
            {label && <label htmlFor={id} className="text-sm font-medium">{label}</label>}
            <input 
                id={id}
                className={`w-full bg-white border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-lavender-500 focus:ring-lavender-500'} rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all font-sans shadow-sm`}
                {...props}
            />
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
};

export const FormLayout = ({ title, subtitle, children }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#faf8ff]">
            {/* Background elements for premium aesthetic */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lavender-300/40 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-300/30 rounded-full blur-[140px] pointer-events-none"></div>
            
            <div className="glass-panel w-full max-w-md rounded-2xl p-8 md:p-10 animate-fade-in relative z-10 transition-all">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-tr from-lavender-500 to-lavender-400 rounded-2xl shadow-[0_10px_20px_rgba(147,51,234,0.2)] flex items-center justify-center">
                            <span className="text-2xl font-bold text-white tracking-widest">SE</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">{title}</h1>
                    <p className="text-slate-500 text-sm">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    );
};
