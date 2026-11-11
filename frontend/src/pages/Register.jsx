import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Button, Input, FormLayout } from '../components/ui';

export default function Register() {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [status, setStatus] = useState({ loading: false, error: '', success: false });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '', success: false });
        try {
            await api.post('/auth/register', formData);
            setStatus({ loading: false, error: '', success: true });
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setStatus({ 
                loading: false, 
                error: err.response?.data?.detail || 'Failed to register', 
                success: false 
            });
        }
    };

    return (
        <FormLayout title="Join SmartEats" subtitle="Create your account to start tracking">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">
                {status.error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                        <span>{status.error}</span>
                    </div>
                )}
                {status.success && (
                    <div className="bg-lavender-50 text-lavender-700 border border-lavender-200 text-sm p-3 rounded-lg flex items-center gap-2">
                        <span>Registration successful! Redirecting to login...</span>
                    </div>
                )}

                <Input 
                    label="Username" 
                    id="username" 
                    type="text" 
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required 
                />
                <Input 
                    label="Email Address" 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required 
                />
                <Input 
                    label="Password" 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required 
                />
                
                <div className="mt-2">
                    <Button type="submit" isLoading={status.loading}>
                        Create Account
                    </Button>
                </div>
            </form>
            
            <p className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/" className="text-lavender-600 hover:text-lavender-500 font-medium transition-colors">
                    Sign in here
                </Link>
            </p>
        </FormLayout>
    );
}
