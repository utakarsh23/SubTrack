'use client';

import { useState } from 'react';
import { Submission } from '@/types/submission';
import { apiClient } from '@/lib/api';

import ModernSubmissionModal from './ModernSubmissionModal';
import { useAuth } from '@/contexts/AuthContext';

interface ModernSubmissionTableProps {
  submissions: Submission[];
  onSubmissionUpdate: (updatedSubmission: Submission) => void;
}

export default function ModernSubmissionTable({ submissions, onSubmissionUpdate }: ModernSubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'attempted'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'date' | 'attempts'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingRemarks, setLoadingRemarks] = useState<Record<string, boolean>>({});
  const { logout, user } = useAuth();

  const ITEMS_PER_PAGE = 15;

  // Filter and sort submissions
  const filteredAndSortedSubmissions = submissions
    .filter(submission => {
      const matchesSearch = submission.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || submission.questionDetails.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'solved' && (submission.passedAttempts || 0) > 0) ||
        (statusFilter === 'attempted' && (submission.failedAttempts || 0) > 0);
      
      return matchesSearch && matchesDifficulty && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'difficulty':
          const diffOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          comparison = (diffOrder[a.questionDetails.difficulty as keyof typeof diffOrder] || 0) - 
                     (diffOrder[b.questionDetails.difficulty as keyof typeof diffOrder] || 0);
          break;
        case 'date':
          comparison = (a.questionDetails.timestamp || 0) - (b.questionDetails.timestamp || 0);
          break;
        case 'attempts':
          comparison = (a.attempts || 0) - (b.attempts || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSubmissions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSubmissions = filteredAndSortedSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleRemarkToggle = async (
    submissionId: string,
    remarkType: keyof Submission['remarks'],
    currentValue: boolean,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const loadingKey = `${submissionId}-${remarkType}`;
    setLoadingRemarks(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const response = await apiClient.toggleRemark(submissionId, remarkType, !currentValue);
      onSubmissionUpdate(response.submission);
    } catch (error) {
      console.error('Failed to update remark:', error);
    } finally {
      setTimeout(() => {
        setLoadingRemarks(prev => {
          const newState = { ...prev };
          delete newState[loadingKey];
          return newState;
        });
      }, 500);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Hard': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusColor = (submission: Submission) => {
    if ((submission.passedAttempts || 0) > 0) return 'text-emerald-500';
    if ((submission.failedAttempts || 0) > 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const RemarkCheckbox = ({ 
    submission, 
    remarkType, 
    icon 
  }: { 
    submission: Submission; 
    remarkType: keyof Submission['remarks']; 
    icon: string;
  }) => {
    const isChecked = submission.remarks[remarkType];
    const loadingKey = `${submission._id}-${remarkType}`;
    const isLoading = loadingRemarks[loadingKey];

    return (
      <button
        onClick={(e) => handleRemarkToggle(submission._id, remarkType, isChecked, e)}
        className={`
          group relative w-8 h-8 rounded-lg border transition-all duration-300 flex items-center justify-center
          ${isChecked 
            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-lg' 
            : 'border-gray-600/50 text-gray-500 hover:border-gray-400/50 hover:text-gray-400 hover:bg-gray-700/30'
          }
          ${isLoading ? 'animate-pulse' : ''}
          transform hover:scale-110 active:scale-95 transition-all duration-300
        `}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-sm">{icon}</span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Modern Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="px-6 py-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Problem Tracker
                </h1>
                <p className="text-gray-400 text-sm">Track your coding journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back,</p>
                <p className="font-semibold text-white">{user?.username}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-300 hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as 'all' | 'Easy' | 'Medium' | 'Hard')}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'solved' | 'attempted')}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="solved">Solved</option>
                <option value="attempted">Attempted</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{submissions.length}</div>
              <div className="text-sm text-gray-400">Total Problems</div>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur border border-emerald-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-400">
                {submissions.filter(s => s.questionDetails.difficulty === 'Easy').length}
              </div>
              <div className="text-sm text-emerald-300">Easy</div>
            </div>
            <div className="bg-amber-500/10 backdrop-blur border border-amber-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-400">
                {submissions.filter(s => s.questionDetails.difficulty === 'Medium').length}
              </div>
              <div className="text-sm text-amber-300">Medium</div>
            </div>
            <div className="bg-red-500/10 backdrop-blur border border-red-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-400">
                {submissions.filter(s => s.questionDetails.difficulty === 'Hard').length}
              </div>
              <div className="text-sm text-red-300">Hard</div>
            </div>
            <div className="bg-blue-500/10 backdrop-blur border border-blue-500/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">
                {submissions.reduce((sum, s) => sum + (s.passedAttempts || 0), 0)}
              </div>
              <div className="text-sm text-blue-300">Solved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Table */}
      <div className="p-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="bg-white/5 border-b border-white/10">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium text-gray-300">
              <div className="col-span-1 flex items-center">Status</div>
              <div className="col-span-1 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                No.
              </div>
              <div className="col-span-4 cursor-pointer hover:text-white transition-colors flex items-center" onClick={() => handleSort('title')}>
                Title
                {sortBy === 'title' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div className="col-span-1 cursor-pointer hover:text-white transition-colors text-center" onClick={() => handleSort('difficulty')}>
                Difficulty
              </div>
              <div className="col-span-1 text-center">Passed</div>
              <div className="col-span-1 text-center">Failed</div>
              <div className="col-span-1 text-center">Better</div>
              <div className="col-span-1 text-center">Work On</div>
              <div className="col-span-1 text-center">Solution</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {paginatedSubmissions.map((submission) => (
              <div
                key={submission._id}
                onClick={() => setSelectedSubmission(submission)}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 cursor-pointer transition-all duration-300 group"
              >
                {/* Status */}
                <div className="col-span-1 flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(submission) === 'text-emerald-500' ? 'bg-emerald-500' : getStatusColor(submission) === 'text-red-500' ? 'bg-red-500' : 'bg-gray-500'}`} />
                </div>

                {/* Number */}
                <div className="col-span-1 flex items-center text-gray-300 font-mono text-sm">
                  {submission.questionDetails.questionNo || 'N/A'}
                </div>

                {/* Title */}
                <div className="col-span-4 flex items-center">
                  <span className="text-white font-medium group-hover:text-blue-400 transition-colors duration-300">
                    {submission.title}
                  </span>
                </div>

                {/* Difficulty */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getDifficultyColor(submission.questionDetails.difficulty)}`}>
                    {submission.questionDetails.difficulty}
                  </span>
                </div>

                {/* Passed */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-emerald-400 font-semibold">
                    {submission.passedAttempts || 0}
                  </span>
                </div>

                {/* Failed */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-red-400 font-semibold">
                    {submission.failedAttempts || 0}
                  </span>
                </div>

                {/* Checkboxes */}
                <div className="col-span-1 flex items-center justify-center">
                  <RemarkCheckbox submission={submission} remarkType="canDoBetter" icon="🔄" />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <RemarkCheckbox submission={submission} remarkType="needWorking" icon="⚠️" />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <RemarkCheckbox submission={submission} remarkType="sawSolution" icon="👁️" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white/5 border-t border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedSubmissions.length)} of {filteredAndSortedSubmissions.length} problems
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-300"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredAndSortedSubmissions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No problems found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedSubmission && (
        <ModernSubmissionModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={onSubmissionUpdate}
        />
      )}
    </div>
  );
}