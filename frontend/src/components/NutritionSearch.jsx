import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function NutritionSearch({ email, onResult }) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Close suggestions on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }
            try {
                const res = await api.get(`/nutrition/suggest?q=${query}`);
                setSuggestions(res.data);
                setShowSuggestions(true);
            } catch (err) {
                console.error(err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async (targetQuery) => {
        const searchQuery = targetQuery || query;
        if (!searchQuery) return;
        
        setLoading(true);
        setShowSuggestions(false);
        try {
            const res = await api.post(`/nutrition/search?query=${searchQuery}&email=${email}`);
            onResult(res.data);
            setQuery(searchQuery);
        } catch (err) {
            console.error(err);
            alert("Food not found or analysis failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {loading ? (
                        <Loader2 className="h-5 w-5 text-lavender-500 animate-spin" />
                    ) : (
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-lavender-500 transition-colors" />
                    )}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search any dish (e.g. 'Avocado Toast', 'Dosa')..."
                    className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/20 focus:border-lavender-500 transition-all shadow-sm"
                />
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSearch(s)}
                            className="w-full text-left px-5 py-3 hover:bg-lavender-50 text-slate-700 font-medium transition-colors border-b last:border-0 border-slate-50"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
