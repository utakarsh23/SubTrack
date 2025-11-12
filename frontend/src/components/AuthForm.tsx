'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthFormProps {
  onToggleMode: () => void;
  isLoginMode: boolean;
}

export default function AuthForm({ onToggleMode, isLoginMode }: AuthFormProps) {
  const { login, signup } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];
    
    if (!formData.email.trim()) {
      newErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push('Please enter a valid email address');
    }
    
    if (!formData.password.trim()) {
      newErrors.push('Password is required');
    } else if (formData.password.length < 6) {
      newErrors.push('Password must be at least 6 characters');
    }
    
    if (!isLoginMode && !formData.username.trim()) {
      newErrors.push('Username is required');
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      if (isLoginMode) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await signup({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred. Please try again.';
      setErrors([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* LeetCode-style header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLoginMode ? 'Sign In' : 'Sign Up'}
          </h1>
          <p className="text-gray-400">
            {isLoginMode 
              ? 'Welcome back to your coding journey' 
              : 'Start tracking your coding progress'
            }
          </p>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            {errors.map((error, index) => (
              <p key={index} className="text-red-400 text-sm mb-1 last:mb-0">
                {error}
              </p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username field (only for signup) */}
          {!isLoginMode && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isLoginMode ? 'Signing In...' : 'Signing Up...'}
              </div>
            ) : (
              isLoginMode ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        {/* Toggle between login and signup */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={onToggleMode}
              className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoginMode ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-center text-xs text-gray-500">
            Track your coding progress like a pro
          </p>
        </div>
      </div>
    </div>
  );
}