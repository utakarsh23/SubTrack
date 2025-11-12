'use client';

import { useState } from 'react';
import { Submission } from '@/types/submission';
import { apiClient } from '@/lib/api';

interface LeetCodeSubmissionModalProps {
  submission: Submission;
  onClose: () => void;
  onUpdate: (submission: Submission) => void;
}

export default function LeetCodeSubmissionModal({ submission, onClose, onUpdate }: LeetCodeSubmissionModalProps) {
  const [loadingRemarks, setLoadingRemarks] = useState<Record<string, boolean>>({});

  const formatMultiline = (value?: string[] | string) => {
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    return value ?? '';
  };

  const handleRemarkToggle = async (remarkType: keyof Submission['remarks'], currentValue: boolean) => {
    const loadingKey = `${submission._id}-${remarkType}`;
    setLoadingRemarks(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const response = await apiClient.toggleRemark(submission._id, remarkType, !currentValue);
      onUpdate(response.submission);
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

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      case 'Medium':
        return 'border border-amber-500/40 bg-amber-500/10 text-amber-300';
      case 'Hard':
        return 'border border-rose-500/40 bg-rose-500/10 text-rose-300';
      default:
        return 'border border-gray-600/40 bg-gray-700/20 text-gray-300';
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="relative flex h-full w-full max-h-[85vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-900/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-800/70 px-6 py-4">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">{submission.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span>Platform: {submission.platform}</span>
              <span>Q.No: {submission.questionDetails.questionNo || 'N/A'}</span>
              <span>
                Added on: {submission.questionDetails.timestamp
                  ? new Date(submission.questionDetails.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadgeClass(submission.questionDetails.difficulty)}`}>
                {submission.questionDetails.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <a
                href={submission.questionDetails.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3h7m0 0v7m0-7L10 14" />
                </svg>
                View on platform
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700/70 bg-gray-800/60 p-1.5 text-gray-400 transition hover:border-gray-600 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Solve Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Solve Time (minutes)</label>
              <input
                type="number"
                min={0}
                defaultValue={submission.solveTime ?? ''}
                className="w-full rounded-lg border border-gray-700/60 bg-gray-800/70 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="Enter solve time in minutes"
              />
            </div>

            {/* Approach */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Approach</label>
              <textarea
                className="h-28 w-full resize-none rounded-lg border border-gray-700/50 bg-gray-800/70 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Describe your approach, algorithm, or thought process..."
                defaultValue={formatMultiline(submission.approach)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Notes</label>
              <textarea
                className="h-24 w-full resize-none rounded-lg border border-gray-700/50 bg-gray-800/70 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Add reminders or insights for next time..."
                defaultValue={formatMultiline(submission.notes)}
              />
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Detailed Description</label>
              <textarea
                className="h-28 w-full resize-none rounded-lg border border-gray-700/50 bg-gray-800/70 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Capture a deeper write-up or breakdown of the solution..."
                defaultValue={formatMultiline(submission.description)}
              />
            </div>
          </div>
        </div>

        {/* Bottom Checkboxes */}
        <div className="border-t border-gray-800/70 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={submission.remarks.canDoBetter}
                  onChange={() => handleRemarkToggle('canDoBetter', submission.remarks.canDoBetter)}
                  disabled={loadingRemarks[`${submission._id}-canDoBetter`]}
                  className="rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500/20"
                />
                Can Do Better
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={submission.remarks.sawSolution}
                  onChange={() => handleRemarkToggle('sawSolution', submission.remarks.sawSolution)}
                  disabled={loadingRemarks[`${submission._id}-sawSolution`]}
                  className="rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500/20"
                />
                Saw Solution
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={submission.remarks.needWorking}
                  onChange={() => handleRemarkToggle('needWorking', submission.remarks.needWorking)}
                  disabled={loadingRemarks[`${submission._id}-needWorking`]}
                  className="rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500/20"
                />
                Need Working On
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-700/70 px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
              >
                Close
              </button>
              <button className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}