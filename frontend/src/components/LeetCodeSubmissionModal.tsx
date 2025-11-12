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

  const CheckboxItem = ({
    label,
    remarkType,
    description,
  }: {
    label: string;
    remarkType: keyof Submission['remarks'];
    description: string;
  }) => {
    const isChecked = submission.remarks[remarkType];
    const loadingKey = `${submission._id}-${remarkType}`;
    const isLoading = loadingRemarks[loadingKey];

    return (
      <label className="relative flex items-start gap-4 rounded-2xl border border-gray-600/40 bg-gray-800/60 p-5 shadow-inner shadow-black/20 transition hover:border-blue-500/40">
        <div className="relative flex h-6 w-6 items-center justify-center">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleRemarkToggle(remarkType, isChecked)}
            disabled={isLoading}
            className="peer absolute h-6 w-6 cursor-pointer appearance-none rounded-md border border-gray-500 bg-gray-900 checked:border-transparent checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/60 disabled:cursor-not-allowed"
          />
          <svg
            className="pointer-events-none z-[1] h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-blue-500/20">
              <span className="h-3 w-3 animate-spin rounded-full border border-white/50 border-t-transparent" />
            </span>
          )}
        </div>
        <span className="flex-1">
          <span className="text-base font-semibold text-white">{label}</span>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </span>
      </label>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur">
      <div className="relative flex h-full w-full max-h-[92vh] max-w-[90vw] flex-col overflow-hidden rounded-3xl border border-gray-700/60 bg-gray-900/95 shadow-[0_40px_120px_-50px_rgba(59,130,246,0.75)]">
        <div className="flex items-start justify-between gap-6 border-b border-gray-800/70 px-8 py-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                {submission.platform}
              </span>
              <span className={`rounded-full px-4 py-1 text-sm font-semibold ${getDifficultyBadgeClass(submission.questionDetails.difficulty)}`}>
                {submission.questionDetails.difficulty}
              </span>
              <span className="text-sm text-gray-400">
                {submission.questionDetails.questionNo ? `#${submission.questionDetails.questionNo}` : 'Unnumbered'}
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-tight text-white">{submission.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <a
                href={submission.questionDetails.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gray-700/60 bg-gray-800/70 px-4 py-1.5 text-blue-300 transition hover:border-blue-500/40 hover:text-blue-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3h7m0 0v7m0-7L10 14" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5l5.586-5.586A2 2 0 0112.414 0H19a2 2 0 012 2v6.586a2 2 0 01-.586 1.414L15 15" />
                </svg>
                View on platform
              </a>
              <span>
                Added{' '}
                {submission.questionDetails.timestamp
                  ? new Date(submission.questionDetails.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Not specified'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-gray-700/70 bg-gray-800/60 p-2 text-gray-400 transition hover:border-gray-600 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <div className="grid gap-4 rounded-2xl border border-gray-700/60 bg-gray-800/60 p-6 sm:grid-cols-3">
                <article className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-5 text-center shadow-inner shadow-black/20">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Passed Attempts</span>
                  <p className="mt-3 text-4xl font-bold text-emerald-300">{submission.passedAttempts || 0}</p>
                </article>
                <article className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-5 text-center shadow-inner shadow-black/20">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Failed Attempts</span>
                  <p className="mt-3 text-4xl font-bold text-rose-300">{submission.failedAttempts || 0}</p>
                </article>
                <article className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-5 text-center shadow-inner shadow-black/20">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Solve Time (min)</span>
                  <input
                    type="number"
                    min={0}
                    defaultValue={submission.solveTime ?? ''}
                    className="mt-3 w-full rounded-lg border border-gray-700/60 bg-gray-800/70 px-3 py-2 text-center text-lg font-semibold text-blue-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="0"
                  />
                </article>
              </div>

              <div className="space-y-5 rounded-2xl border border-gray-700/60 bg-gray-800/60 p-6">
                <h3 className="text-xl font-semibold text-white">Question Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Question No.</span>
                    <p className="rounded-lg border border-gray-700/50 bg-gray-900/70 px-3 py-2 font-mono text-sm text-gray-200">
                      {submission.questionDetails.questionNo || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Platform</span>
                    <p className="rounded-lg border border-gray-700/50 bg-gray-900/70 px-3 py-2 text-sm capitalize text-gray-200">
                      {submission.platform}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Language Used</span>
                    <p className="rounded-lg border border-gray-700/50 bg-gray-900/70 px-3 py-2 text-sm text-gray-200">
                      {submission.lang}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Added On</span>
                    <p className="rounded-lg border border-gray-700/50 bg-gray-900/70 px-3 py-2 text-sm text-gray-200">
                      {submission.questionDetails.timestamp
                        ? new Date(submission.questionDetails.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Not specified'}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Question Link</span>
                    <a
                      href={submission.questionDetails.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200 transition hover:border-blue-400 hover:text-blue-100"
                    >
                      <span className="truncate">{submission.questionDetails.link}</span>
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3h7m0 0v7m0-7L10 14" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5l5.586-5.586A2 2 0 0112.414 0H19a2 2 0 012 2v6.586a2 2 0 01-.586 1.414L15 15" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-5 rounded-2xl border border-gray-700/60 bg-gray-800/60 p-6">
                <h3 className="text-xl font-semibold text-white">Problem Log</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Approach</label>
                    <textarea
                      className="h-32 w-full resize-none rounded-xl border border-gray-700/50 bg-gray-900/70 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                      placeholder="Describe your approach, algorithm, or thought process..."
                      defaultValue={formatMultiline(submission.approach)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Notes</label>
                    <textarea
                      className="h-28 w-full resize-none rounded-xl border border-gray-700/50 bg-gray-900/70 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                      placeholder="Add reminders or insights for next time..."
                      defaultValue={formatMultiline(submission.notes)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Detailed Description</label>
                    <textarea
                      className="h-32 w-full resize-none rounded-xl border border-gray-700/50 bg-gray-900/70 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                      placeholder="Capture a deeper write-up or breakdown of the solution."
                      defaultValue={formatMultiline(submission.description)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-4 rounded-2xl border border-gray-700/60 bg-gray-800/60 p-6">
                <h3 className="text-xl font-semibold text-white">Status & Trackers</h3>
                <div className="space-y-3">
                  <CheckboxItem
                    label="Can Do Better"
                    remarkType="canDoBetter"
                    description="This solution can be improved or optimized further."
                  />
                  <CheckboxItem
                    label="Saw Solution / Editorial"
                    remarkType="sawSolution"
                    description="Marked when you relied on hints or external solutions."
                  />
                  <CheckboxItem
                    label="Need Working On"
                    remarkType="needWorking"
                    description="Revisit this problem or practice similar patterns."
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-700/60 bg-gray-800/60 p-6">
                <h3 className="text-xl font-semibold text-white">Quick Stats</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center justify-between rounded-xl border border-gray-700/50 bg-gray-900/70 px-4 py-3">
                    <span>Total Attempts</span>
                    <span className="font-semibold text-gray-100">
                      {(submission.passedAttempts || 0) + (submission.failedAttempts || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-700/50 bg-gray-900/70 px-4 py-3">
                    <span>Overall Status</span>
                    <span className={(submission.passedAttempts || 0) > 0 ? 'font-semibold text-emerald-300' : 'font-semibold text-gray-100'}>
                      {(submission.passedAttempts || 0) > 0 ? 'Solved' : 'Not Solved'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-gray-800/70 px-8 py-5">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span
              className={`inline-flex h-3 w-3 rounded-full ${
                (submission.passedAttempts || 0) > 0 ? 'bg-emerald-400' : 'bg-gray-500'
              }`}
            />
            <span>{(submission.passedAttempts || 0) > 0 ? 'Solved on platform' : 'Pending solution'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-700/70 px-5 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
            >
              Close
            </button>
            <button className="rounded-xl bg-blue-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-600">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}