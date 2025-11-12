'use client';

import { useState } from 'react';
import { Submission } from '@/types/submission';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import SubmissionModal from './SubmissionModal';
import { useAuth } from '@/contexts/AuthContext';

interface SubmissionTableProps {
  submissions: Submission[];
  onSubmissionUpdate: (updatedSubmission: Submission) => void;
}

export default function SubmissionTable({ submissions, onSubmissionUpdate }: SubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loadingRemarks, setLoadingRemarks] = useState<Record<string, string>>({});
  const { logout, user } = useAuth();

  const handleRowClick = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const handleRemarkToggle = async (
    submissionId: string,
    remarkType: keyof Submission['remarks'],
    currentValue: boolean,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const loadingKey = `${submissionId}-${remarkType}`;
    setLoadingRemarks(prev => ({ ...prev, [loadingKey]: 'loading' }));

    try {
      const response = await apiClient.toggleRemark(submissionId, remarkType, !currentValue);
      onSubmissionUpdate(response.submission);
      setLoadingRemarks(prev => ({ ...prev, [loadingKey]: 'success' }));
    } catch (error) {
      console.error('Failed to update remark:', error);
      setLoadingRemarks(prev => ({ ...prev, [loadingKey]: 'error' }));
    }

    // Clear loading state after animation
    setTimeout(() => {
      setLoadingRemarks(prev => {
        const newState = { ...prev };
        delete newState[loadingKey];
        return newState;
      });
    }, 1000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-[#00B8A3]';
      case 'Medium':
        return 'text-[#FFB800]';
      case 'Hard':
        return 'text-[#FF4D4F]';
      default:
        return 'text-gray-400';
    }
  };

  const RemarkCheckbox = ({ 
    submission, 
    remarkType, 
    label 
  }: { 
    submission: Submission; 
    remarkType: keyof Submission['remarks']; 
    label: string;
  }) => {
    const isChecked = submission.remarks[remarkType];
    const loadingKey = `${submission._id}-${remarkType}`;
    const loadingState = loadingRemarks[loadingKey];

    return (
      <div className="flex items-center justify-center">
        <button
          onClick={(e) => handleRemarkToggle(submission._id, remarkType, isChecked, e)}
          className={`
            relative w-4 h-4 rounded-sm border transition-all duration-200 flex items-center justify-center
            ${isChecked 
              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
              : 'border-gray-500 hover:border-gray-400 hover:bg-gray-800'
            }
            ${loadingState === 'loading' ? 'animate-pulse' : ''}
            ${loadingState === 'success' ? 'ring-1 ring-green-400/50' : ''}
            ${loadingState === 'error' ? 'ring-1 ring-red-400/50' : ''}
          `}
          disabled={loadingState === 'loading'}
          title={label}
        >
          {isChecked && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Header with user info and logout */}
      <div className="bg-gray-900 border-b border-gray-700/50">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Problems</h1>
            <p className="text-gray-400 text-sm mt-1">
              {submissions.length} total problems
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* LeetCode-style table */}
      <div className="bg-gray-900 min-h-screen">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr className="border-b border-gray-700/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-16">
                  No.
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                  Difficulty
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                  Passed
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                  Failed
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-28">
                  Could Do Better
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-28">
                  Need Working On
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                  Saw Solution
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900">
              {submissions.map((submission, index) => (
                <tr
                  key={submission._id}
                  onClick={() => handleRowClick(submission)}
                  className="
                    border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer
                    transition-all duration-150 group
                  "
                >
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {formatDate(submission.questionDetails.timestamp)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300 font-medium">
                    {submission.questionDetails.questionNo || (index + 1)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(submission);
                        }}
                        className="text-white hover:text-blue-400 transition-colors text-sm font-medium group-hover:text-blue-400"
                      >
                        {submission.title}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${getDifficultyColor(submission.questionDetails.difficulty)}`}>
                      {submission.questionDetails.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-medium text-green-400">
                      {submission.passedAttempts || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-medium text-red-400">
                      {submission.failedAttempts || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <RemarkCheckbox 
                      submission={submission} 
                      remarkType="canDoBetter" 
                      label="Could Do Better" 
                    />
                  </td>
                  <td className="py-3 px-4">
                    <RemarkCheckbox 
                      submission={submission} 
                      remarkType="needWorking" 
                      label="Need Working On" 
                    />
                  </td>
                  <td className="py-3 px-4">
                    <RemarkCheckbox 
                      submission={submission} 
                      remarkType="sawSolution" 
                      label="Saw Solution" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {submissions.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 text-lg mb-4">No submissions found</div>
            <p className="text-gray-500">
              Start solving problems and sync your submissions to see them here.
            </p>
          </div>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={onSubmissionUpdate}
        />
      )}
    </>
  );
}