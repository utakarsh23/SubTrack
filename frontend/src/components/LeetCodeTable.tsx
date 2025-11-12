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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filterBy, setFilterBy] = useState('all');
  const { logout, user } = useAuth();

  // Pagination - show only 14 items at a time
  const ITEMS_PER_PAGE = 14;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'easy' && submission.questionDetails.difficulty === 'Easy') ||
      (filterBy === 'medium' && submission.questionDetails.difficulty === 'Medium') ||
      (filterBy === 'hard' && submission.questionDetails.difficulty === 'Hard');
    
    return matchesSearch && matchesFilter;
  });

  // Paginate results
  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header with search and controls - Exactly like LeetCode */}
      <div className="border-b border-[#333] bg-[#1a1a1a]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-white">Problems</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Welcome, {user?.username}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* LeetCode-style search and filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search questions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#262626] border border-[#404040] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            
            <button className="flex items-center space-x-2 px-3 py-2 bg-[#262626] border border-[#404040] rounded-lg hover:bg-[#333] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 bg-[#262626] border border-[#404040] rounded-lg hover:bg-[#333] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>

            <div className="flex items-center bg-[#262626] rounded-lg border border-[#404040] text-sm">
              <span className="text-green-400 px-3 py-1.5 border-r border-[#404040]">
                {submissions.filter(s => s.questionDetails.difficulty === 'Easy').length}
              </span>
              <span className="text-white px-2 py-1.5">419/3744 Solved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main table content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0f0f0f] sticky top-0 z-10">
            <tr className="text-left text-xs text-gray-400 border-b border-[#333]">
              <th className="py-3 px-4 font-medium w-16"></th>
              <th className="py-3 px-4 font-medium w-20">No.</th>
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium w-32">Acceptance</th>
              <th className="py-3 px-4 font-medium w-24">Difficulty</th>
              <th className="py-3 px-4 font-medium w-20 text-center">Passed</th>
              <th className="py-3 px-4 font-medium w-20 text-center">Failed</th>
              <th className="py-3 px-4 font-medium w-32 text-center">Could Do Better</th>
              <th className="py-3 px-4 font-medium w-32 text-center">Need Working On</th>
              <th className="py-3 px-4 font-medium w-28 text-center">Saw Solution</th>
              <th className="py-3 px-4 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody className="bg-[#0f0f0f]">
            {paginatedSubmissions.map((submission, index) => (
              <tr
                key={submission._id}
                onClick={() => handleRowClick(submission)}
                className="border-b border-[#262626] hover:bg-[#1a1a1a] cursor-pointer transition-colors group"
              >
                <td className="py-3 px-4">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-300">
                  {submission.questionDetails.questionNo || 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(submission);
                      }}
                      className="text-white hover:text-blue-400 transition-colors text-sm group-hover:text-blue-400"
                    >
                      {submission.title}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-400">
                  {((submission.passedAttempts || 0) / (submission.attempts || 1) * 100).toFixed(1)}%
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
                <td className="py-3 px-4">
                  <button className="w-4 h-4 hover:bg-gray-700 rounded transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center py-6 border-t border-[#333]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-[#262626] border border-[#404040] rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-[#262626] border border-[#404040] rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={onSubmissionUpdate}
        />
      )}
    </div>
  );
}