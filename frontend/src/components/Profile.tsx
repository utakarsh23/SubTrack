'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface PlatformData {
  leetcodeUsername?: string;
  codeChef?: string;
  codeForces?: string;
}

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<PlatformData>({
    leetcodeUsername: '',
    codeChef: '',
    codeForces: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user?.platform) {
      setPlatforms({
        leetcodeUsername: user.platform.leetcodeUsername || '',
        codeChef: user.platform.codeChef || '',
        codeForces: user.platform.codeForces || ''
      });
    }
  }, [user, isAuthenticated, router]);

  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const handlePlatformChange = (platform: keyof PlatformData, value: string) => {
    setPlatforms(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleSavePlatforms = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      await apiClient.updateUserPlatforms(platforms);
      setIsEditing(false);
      setSaveMessage('Platforms updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update platforms:', error);
      setSaveMessage('Failed to update platforms. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
              {getUserInitials(user.username)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user.username}</h1>
              <p className="text-gray-400 mt-1">{user.email}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {user.questionsSolved} problems solved
                </span>
                <span className="text-gray-600">•</span>
                <span>{user.submissions?.length || 0} total submissions</span>
              </div>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Platform Settings */}
          <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Platform Usernames</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to original values
                      if (user?.platform) {
                        setPlatforms({
                          leetcodeUsername: user.platform.leetcodeUsername || '',
                          codeChef: user.platform.codeChef || '',
                          codeForces: user.platform.codeForces || ''
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePlatforms}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-md transition-colors text-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                saveMessage.includes('successfully') 
                  ? 'bg-green-900/30 border border-green-700 text-green-300' 
                  : 'bg-red-900/30 border border-red-700 text-red-300'
              }`}>
                {saveMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LeetCode Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={platforms.leetcodeUsername}
                    onChange={(e) => handlePlatformChange('leetcodeUsername', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Enter your LeetCode username"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">
                    {platforms.leetcodeUsername || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CodeChef Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={platforms.codeChef}
                    onChange={(e) => handlePlatformChange('codeChef', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Enter your CodeChef username"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">
                    {platforms.codeChef || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CodeForces Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={platforms.codeForces}
                    onChange={(e) => handlePlatformChange('codeForces', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Enter your CodeForces username"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300">
                    {platforms.codeForces || 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-6">Account Actions</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <h3 className="font-medium text-white mb-2">Sign Out</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Sign out of your account. You&apos;ll need to log in again to access your data.
                </p>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 rounded-3xl border border-gray-800 bg-gray-900/70 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-300 text-2xl font-bold">{user.questionsSolved}</p>
                  <p className="text-green-200 text-sm">Problems Solved</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-300 text-2xl font-bold">{user.submissions?.length || 0}</p>
                  <p className="text-blue-200 text-sm">Total Submissions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="text-purple-300 text-2xl font-bold">{Object.keys(user.platform || {}).length}</p>
                  <p className="text-purple-200 text-sm">Platforms Linked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}