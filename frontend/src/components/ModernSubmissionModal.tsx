'use client';

import { useState, useEffect } from 'react';
import { Submission } from '@/types/submission';
import { apiClient } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';

interface ModernSubmissionModalProps {
  submission: Submission;
  onClose: () => void;
  onUpdate: (updatedSubmission: Submission) => void;
}

export default function ModernSubmissionModal({ submission, onClose, onUpdate }: ModernSubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<Submission | null>(null);
  const [notes, setNotes] = useState(submission.notes.join('\n'));
  const [description, setDescription] = useState(submission.description.join('\n'));
  const [approach, setApproach] = useState(submission.approach.join('\n'));
  const [localRemarks, setLocalRemarks] = useState(submission.remarks);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'details'>('overview');

  // Fetch detailed submission data
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      try {
        setLoadingDetails(true);
        const response = await apiClient.getSubmissionById(submission._id);
        setSubmissionDetails(response.submission);
        setNotes(response.submission.notes.join('\n'));
        setDescription(response.submission.description.join('\n'));
        setApproach(response.submission.approach.join('\n'));
        setLocalRemarks(response.submission.remarks);
      } catch (error) {
        console.error('Failed to fetch submission details:', error);
        setSubmissionDetails(submission);
      } finally {
        setLoadingDetails(false);
      }
    };
    
    fetchSubmissionDetails();
  }, [submission._id, submission]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = {
        notes: notes.split('\n').filter(note => note.trim()),
        description: description.split('\n').filter(desc => desc.trim()),
        approach: approach.split('\n').filter(app => app.trim()),
        remarks: localRemarks,
      };

      const response = await apiClient.updateSubmission(submission._id, updates);
      onUpdate(response.submission);
      onClose();
    } catch (error) {
      console.error('Failed to update submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemarkToggle = (remarkType: keyof Submission['remarks']) => {
    setLocalRemarks(prev => ({
      ...prev,
      [remarkType]: !prev[remarkType],
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'Medium': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'Hard': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const currentSubmission = submissionDetails || submission;

  if (loadingDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-300 font-medium">Loading submission details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-5xl bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-white/10 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <h2 className="text-2xl font-bold text-white">{currentSubmission.title}</h2>
                  <span className={`px-3 py-1 rounded-xl text-sm font-semibold border ${getDifficultyColor(currentSubmission.questionDetails.difficulty)}`}>
                    {currentSubmission.questionDetails.difficulty}
                  </span>
                </div>
                
                {currentSubmission.questionDetails.link && (
                  <a
                    href={currentSubmission.questionDetails.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium transition-colors group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View Original Problem</span>
                  </a>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mt-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'notes', label: 'Notes', icon: '📝' },
                { id: 'details', label: 'Details', icon: '🔍' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'notes' | 'details')}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
                    ${activeTab === tab.id 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Date Solved</div>
                    <div className="text-lg font-bold text-white">
                      {formatDate(currentSubmission.questionDetails.timestamp)}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Duration</div>
                    <div className="text-lg font-bold text-white">
                      {formatDuration(currentSubmission.solveTime)}
                    </div>
                  </div>
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-xs text-emerald-300 uppercase tracking-wider mb-2">Passed</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {currentSubmission.passedAttempts || 0}
                    </div>
                  </div>
                  
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="text-xs text-red-300 uppercase tracking-wider mb-2">Failed</div>
                    <div className="text-lg font-bold text-red-400">
                      {currentSubmission.failedAttempts || 0}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'canDoBetter', label: 'Could Do Better', icon: '🔄', color: 'amber' },
                      { key: 'needWorking', label: 'Need Working On', icon: '⚠️', color: 'red' },
                      { key: 'sawSolution', label: 'Saw Solution', icon: '👁️', color: 'blue' }
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => handleRemarkToggle(item.key as keyof Submission['remarks'])}
                        className={`
                          flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 transform hover:scale-105
                          ${localRemarks[item.key as keyof Submission['remarks']]
                            ? item.color === 'amber' 
                              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                              : item.color === 'red'
                              ? 'bg-red-500/20 border-red-500/30 text-red-400'
                              : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }
                        `}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs opacity-70">
                            {localRemarks[item.key as keyof Submission['remarks']] ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <label className="block text-lg font-semibold text-white mb-4">Approach Used</label>
                  <textarea
                    value={approach}
                    onChange={(e) => setApproach(e.target.value)}
                    placeholder="Describe your approach (e.g., Two Pointers, Dynamic Programming, etc.)..."
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all duration-300"
                  />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <label className="block text-lg font-semibold text-white mb-4">Quick Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Quick notes and observations..."
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <label className="block text-lg font-semibold text-white mb-4">Detailed Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed explanation of your solution, time/space complexity, edge cases, etc..."
                    className="w-full h-40 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all duration-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-white/5 border-t border-white/10 p-6">
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}