'use client';

import { useState, useEffect } from 'react';
import { Submission } from '@/types/submission';
import { apiClient } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';

interface SubmissionModalProps {
  submission: Submission;
  onClose: () => void;
  onUpdate: (updatedSubmission: Submission) => void;
}

export default function SubmissionModal({ submission, onClose, onUpdate }: SubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<Submission | null>(null);
  const [notes, setNotes] = useState(submission.notes.join('\n'));
  const [description, setDescription] = useState(submission.description.join('\n'));
  const [approach, setApproach] = useState(submission.approach.join('\n'));
  const [localRemarks, setLocalRemarks] = useState(submission.remarks);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Fetch detailed submission data when modal opens
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
        setSubmissionDetails(submission); // Fallback to existing data
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
      case 'Easy':
        return 'text-[#00B8A3] bg-[#00B8A3]/10 border-[#00B8A3]/20';
      case 'Medium':
        return 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20';
      case 'Hard':
        return 'text-[#FF4D4F] bg-[#FF4D4F]/10 border-[#FF4D4F]/20';
      default:
        return 'text-gray-400 bg-gray-800/50 border-gray-700';
    }
  };

  const RemarkCheckbox = ({ 
    remarkType, 
    label 
  }: { 
    remarkType: keyof Submission['remarks']; 
    label: string;
  }) => {
    const isChecked = localRemarks[remarkType];

    return (
      <label className="flex items-center space-x-3 cursor-pointer group">
        <div className={`
          relative w-5 h-5 rounded-sm border transition-all duration-200 flex items-center justify-center
          ${isChecked 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-gray-600 group-hover:border-gray-400 group-hover:bg-gray-800'
          }
        `}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleRemarkToggle(remarkType)}
            className="sr-only"
          />
          {isChecked && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
          {label}
        </span>
      </label>
    );
  };

  const currentSubmission = submissionDetails || submission;

  if (loadingDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-300">Loading submission details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal - 90% screen width, exactly like LeetCode */}
        <div className="
          relative w-[90vw] max-w-6xl bg-[#1a1a1a] border border-[#333] rounded-lg 
          shadow-2xl overflow-hidden
        ">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#262626]">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-white">{currentSubmission.title}</h2>
              <span className={`
                px-2 py-1 rounded text-xs font-medium
                ${getDifficultyColor(currentSubmission.questionDetails.difficulty)} 
                bg-current bg-opacity-10
              `}>
                {currentSubmission.questionDetails.difficulty}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6 bg-[#1a1a1a]">
            {/* Problem Link */}
            {currentSubmission.questionDetails.link && (
              <div className="flex items-center justify-between p-4 bg-[#262626] rounded-lg border border-[#333]">
                <span className="text-sm text-gray-300">Problem Link:</span>
                <a
                  href={currentSubmission.questionDetails.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  View Original Problem →
                </a>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <div className="text-xs text-gray-400 mb-1">Date Solved</div>
                <div className="text-sm text-white font-medium">
                  {formatDate(currentSubmission.questionDetails.timestamp)}
                </div>
              </div>
              
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <div className="text-xs text-gray-400 mb-1">Duration</div>
                <div className="text-sm text-white font-medium">
                  {formatDuration(currentSubmission.solveTime)}
                </div>
              </div>
              
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <div className="text-xs text-gray-400 mb-1">Passed Attempts</div>
                <div className="text-sm text-green-400 font-semibold">
                  {currentSubmission.passedAttempts || 0}
                </div>
              </div>
              
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <div className="text-xs text-gray-400 mb-1">Failed Attempts</div>
                <div className="text-sm text-red-400 font-semibold">
                  {currentSubmission.failedAttempts || 0}
                </div>
              </div>
            </div>

            {/* Content Fields in Boxes */}
            <div className="space-y-6">
              {/* Approach Box */}
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <label className="block text-sm font-medium text-white mb-3">Approach Used</label>
                <textarea
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                  placeholder="Describe your approach (e.g., Two Pointers, Dynamic Programming, etc.)..."
                  className="
                    w-full h-24 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded
                    text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 
                    resize-none text-sm
                  "
                />
              </div>

              {/* Notes Box */}
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <label className="block text-sm font-medium text-white mb-3">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quick notes and observations..."
                  className="
                    w-full h-24 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded
                    text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 
                    resize-none text-sm
                  "
                />
              </div>

              {/* Description Box */}
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <label className="block text-sm font-medium text-white mb-3">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed explanation of your solution, time/space complexity, edge cases, etc..."
                  className="
                    w-full h-32 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded
                    text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 
                    resize-none text-sm
                  "
                />
              </div>

              {/* Remarks Box */}
              <div className="p-4 bg-[#262626] rounded-lg border border-[#333]">
                <label className="block text-sm font-medium text-white mb-4">Remarks</label>
                <div className="grid md:grid-cols-3 gap-4">
                  <RemarkCheckbox remarkType="canDoBetter" label="Could Do Better" />
                  <RemarkCheckbox remarkType="needWorking" label="Need Working On" />
                  <RemarkCheckbox remarkType="sawSolution" label="Saw Solution" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-[#333] bg-[#262626]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white border border-[#404040] hover:border-gray-500 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="
                px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center space-x-2
              "
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}