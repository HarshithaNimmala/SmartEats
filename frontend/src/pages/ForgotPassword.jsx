import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Button, Input, FormLayout } from '../components/ui';

export default function ForgotPassword() {
    const [formData, setFormData] = useState({ email: '', new_password: '' });
    const [status, setStatus] = useState({ loading: false, error: '', success: false });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '', success: false });
        try {
            await api.post('/auth/forgot-password', formData);
            setStatus({ loading: false, error: '', success: true });
        } catch (err) {
            setStatus({ 
                loading: false, 
                error: err.response?.data?.detail || 'Failed to update password', 
                success: false 
            });
        }
    };

    return (
        <FormLayout title="Reset Password" subtitle="Enter your email to create a new password">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">
                {status.error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                        <span>{status.error}</span>
                    </div>
                )}
                {status.success && (
                    <div className="bg-lavender-50 text-lavender-700 border border-lavender-200 text-sm p-3 rounded-lg flex items-center gap-2">
                        <span>Password has been successfully updated! You can now log in.</span>
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
                <Input 
                    label="New Password" 
                    id="new_password" 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.new_password}
                    onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                    required 
                />
                
                <div className="mt-2">
                    <Button type="submit" isLoading={status.loading}>
                        Reset Password
                    </Button>
                </div>
            </form>
            
            <p className="mt-8 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <Link to="/" className="text-lavender-600 hover:text-lavender-500 font-medium transition-colors">
                    Back to login
                </Link>
            </p>
        </FormLayout>
    );
}
