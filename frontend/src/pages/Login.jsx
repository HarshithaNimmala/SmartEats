import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Button, Input, FormLayout } from '../components/ui';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [status, setStatus] = useState({ loading: false, error: '', success: false });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '', success: false });
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('userEmail', formData.email);
            localStorage.setItem('username', res.data.username);
            setStatus({ loading: false, error: '', success: true });
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err) {
            setStatus({ 
                loading: false, 
                error: err.response?.data?.detail || 'Failed to login', 
                success: false 
            });
        }
    };

    return (
        <FormLayout title="Welcome Back" subtitle="Log in to access your SmartEats account">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">
                {status.error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                        <span>{status.error}</span>
                    </div>
                )}
                {status.success && (
                    <div className="bg-lavender-50 text-lavender-700 border border-lavender-200 text-sm p-3 rounded-lg flex items-center gap-2">
                        <span>Login successful! Redirecting...</span>
                    </div>
                )}
                
                <Input 
                    label="Email Address" 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required 
                />
                <div className="flex flex-col gap-1.5 focus-within:text-lavender-600 text-slate-600 transition-colors">
                    <div className="flex justify-between">
                        <label htmlFor="password" className="text-sm font-medium">Password</label>
                        <Link to="/forgot-password" className="text-sm text-lavender-600 hover:text-lavender-500 transition-colors">
                            Forgot Password?
                        </Link>
                    </div>
                    <input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 focus:border-lavender-500 focus:ring-lavender-500 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all font-sans shadow-sm"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required 
                    />
                </div>
                
                <div className="mt-2">
                    <Button type="submit" isLoading={status.loading}>
                        Sign In
                    </Button>
                </div>
            </form>
            
            <p className="mt-8 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-lavender-600 hover:text-lavender-500 font-medium transition-colors">
                    Create free account
                </Link>
            </p>
        </FormLayout>
    );
}
