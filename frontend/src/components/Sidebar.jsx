import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Search, LogOut, HeartPulse, 
    User, Utensils, Calendar, TrendingUp 
} from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || "User";

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Health Progress', path: '/progress', icon: <TrendingUp size={20} /> },
        { name: 'Nutrition Lookup', path: '/nutrition', icon: <Search size={20} /> },
        { name: 'Food Tracker', path: '/food-tracker', icon: <Utensils size={20} /> },
        { name: 'Diet Planner', path: '/meal-planner', icon: <Calendar size={20} /> },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-8 flex items-center gap-3">
                <div className="bg-lavender-600 p-2 rounded-xl text-white shadow-lg shadow-lavender-200">
                    <HeartPulse size={24} />
                </div>
                <h1 className="text-xl font-black text-slate-800 tracking-tighter">SmartEats</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                                isActive 
                                ? 'bg-lavender-50 text-lavender-700 shadow-sm border border-lavender-100/50' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`
                        }
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 bg-lavender-200 rounded-xl flex items-center justify-center text-lavender-700">
                        <User size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 tracking-tighter leading-none">{username}</span>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold"
                >
                    <LogOut size={20} />
                    Log Out
                </button>
            </div>
        </aside>
    );
}
