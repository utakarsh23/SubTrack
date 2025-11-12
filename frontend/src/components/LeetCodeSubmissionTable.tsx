'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Submission } from '@/types/submission';
import { useAuth } from '@/contexts/AuthContext';
import LeetCodeSubmissionModal from './LeetCodeSubmissionModal';
import { apiClient } from '@/lib/api';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface LeetCodeSubmissionTableProps {
  submissions: Submission[];
  onSubmissionUpdate: (updatedSubmission: Submission) => void;
  onLoadMoreBase?: () => Promise<void> | void;
  hasMoreBase?: boolean;
  loadingMoreBase?: boolean;
  pageSize?: number;
}

export default function LeetCodeSubmissionTable({
  submissions,
  onSubmissionUpdate,
  onLoadMoreBase = () => {},
  hasMoreBase = false,
  loadingMoreBase = false,
  pageSize = 20,
}: LeetCodeSubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'attempted'>('all');
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [loadingRemarks, setLoadingRemarks] = useState<Record<string, boolean>>({});
  const [displaySubmissions, setDisplaySubmissions] = useState<Submission[]>(submissions);
  const [remoteSearchActive, setRemoteSearchActive] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [searchCursor, setSearchCursor] = useState<number | null>(null);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setDisplaySubmissions(prev => {
      if (remoteSearchActive) {
        return prev.map(item => submissions.find(sub => sub._id === item._id) ?? item);
      }
      return submissions;
    });
  }, [submissions, remoteSearchActive]);

  useEffect(() => {
    const normalizedQuery = debouncedSearchQuery.trim();
    const statusParam =
      statusFilter === 'solved'
        ? 'Accepted'
        : statusFilter === 'attempted'
          ? 'Attempted'
          : undefined;
    
    // Use backend search if there's a search query or status filter
    // For difficulty filter only, we'll use client-side filtering
    const shouldQueryBackend = normalizedQuery !== '' || statusParam !== undefined;

    if (!shouldQueryBackend) {
      setRemoteSearchActive(false);
      setDisplaySubmissions(submissions);
      setIsFetching(false);
      setSearchCursor(null);
      setSearchHasMore(false);
      setSearchLoadingMore(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setRemoteSearchActive(true);
      setIsFetching(true);

      try {
        const response = await apiClient.searchSubmissions({
          title: normalizedQuery || undefined,
          status: statusParam,
          limit: pageSize,
        });

        const remoteSubmissions = response.submissions ?? [];

        // For search results, we get the full submission data from the backend
        // No need to enrich as the search endpoint should return complete data
        const enrichedSubmissions = remoteSubmissions.map(remote => {
          const existing = submissions.find(entry => entry._id === remote._id);
          return existing || remote as Submission;
        });

        if (!cancelled) {
          setDisplaySubmissions(enrichedSubmissions);
          setSearchCursor(response.nextCursor ?? null);
          setSearchHasMore(Boolean(response.hasMore));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to search submissions:', error);
          // Fallback to local filtering if search fails
          setRemoteSearchActive(false);
          setDisplaySubmissions(submissions);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, statusFilter, submissions, pageSize]);

  const sortedSubmissions = useMemo(() => {
    return [...displaySubmissions].sort((a, b) => {
      const aSolved = (a.passedAttempts || 0) > 0;
      const bSolved = (b.passedAttempts || 0) > 0;

      if (aSolved && bSolved) {
        return (b.questionDetails.timestamp || 0) - (a.questionDetails.timestamp || 0);
      }

      if (aSolved) return -1;
      if (bSolved) return 1;

    return (b.questionDetails.timestamp || 0) - (a.questionDetails.timestamp || 0);
  });
  }, [displaySubmissions]);

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedSubmissions.filter(submission => {
      const matchesSearch = remoteSearchActive
        ? true
        : submission.title.toLowerCase().includes(normalizedQuery);
      const matchesDifficulty =
        difficultyFilter === 'all' || submission.questionDetails.difficulty === difficultyFilter;
      const matchesStatus =
        statusFilter === 'all' ||
      (statusFilter === 'solved' && (submission.passedAttempts || 0) > 0) ||
      (statusFilter === 'attempted' && (submission.failedAttempts || 0) > 0);
    
    return matchesSearch && matchesDifficulty && matchesStatus;
  });
  }, [sortedSubmissions, searchQuery, difficultyFilter, statusFilter, remoteSearchActive]);

  const canLoadMore = remoteSearchActive
    ? searchHasMore && !searchLoadingMore && !isFetching
    : hasMoreBase && !loadingMoreBase;

  const handleLoadMore = useCallback(async () => {
    if (!canLoadMore) return;

    if (remoteSearchActive) {
      if (!searchCursor) return;
      setSearchLoadingMore(true);
      try {
        const normalizedQuery = debouncedSearchQuery.trim();
        const statusParam =
          statusFilter === 'solved'
            ? 'Accepted'
            : statusFilter === 'attempted'
              ? 'Attempted'
              : undefined;

        const response = await apiClient.searchSubmissions({
          title: normalizedQuery || undefined,
          status: statusParam,
          limit: pageSize,
          lastTimestamp: searchCursor,
        });

        const remoteSubmissions = response.submissions ?? [];

        // For pagination, we also get full submission data, no need for enrichment
        const newSubmissions = remoteSubmissions.map(remote => {
          const existing = submissions.find(entry => entry._id === remote._id);
          return existing || remote as Submission;
        });

        setDisplaySubmissions(prev => {
          const map = new Map<string, Submission>();
          [...prev, ...newSubmissions].forEach(item => {
            map.set(item._id, item);
          });
          return Array.from(map.values());
        });
        setSearchCursor(response.nextCursor ?? null);
        setSearchHasMore(Boolean(response.hasMore));
      } catch (error) {
        console.error('Failed to load more search results:', error);
      } finally {
        setSearchLoadingMore(false);
      }
    } else {
      await onLoadMoreBase();
    }
  }, [
    canLoadMore,
    remoteSearchActive,
    searchCursor,
    debouncedSearchQuery,
    statusFilter,
    pageSize,
    submissions,
    onLoadMoreBase,
  ]);

  useEffect(() => {
    const triggerEl = loadMoreTriggerRef.current;
    if (!triggerEl) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      const firstEntry = entries[0];
      if (firstEntry?.isIntersecting) {
        handleLoadMore();
      }
    });

    observerRef.current.observe(triggerEl);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore]);

  const getStatusIcon = (submission: Submission) => {
    if ((submission.passedAttempts || 0) > 0) {
      return (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
          <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
        </svg>
        </div>
      );
    }
    return <div className="h-4 w-4 rounded-full border-2 border-gray-600" />;
  };

  const totalSolved = useMemo(
    () => sortedSubmissions.filter(sub => (sub.passedAttempts || 0) > 0).length,
    [sortedSubmissions]
  );
  const totalQuestions = sortedSubmissions.length;

  const handleRemarkToggle = async (
    submissionId: string,
    remarkType: keyof Submission['remarks'],
    currentValue: boolean
  ) => {
    const loadingKey = `${submissionId}-${remarkType}`;
    setLoadingRemarks(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const response = await apiClient.toggleRemark(submissionId, remarkType, !currentValue);
      onSubmissionUpdate(response.submission);
    } catch (error) {
      console.error('Failed to toggle remark from table:', error);
    } finally {
      setLoadingRemarks(prev => {
        const next = { ...prev };
        delete next[loadingKey];
        return next;
      });
    }
  };

  const renderRemarkToggle = (
    submission: Submission,
    remarkType: keyof Submission['remarks'],
    label: string
  ) => {
    const loadingKey = `${submission._id}-${remarkType}`;
    const remarksState = submission.remarks ?? {
      canDoBetter: false,
      needWorking: false,
      sawSolution: false,
    };
    const isChecked = remarksState[remarkType];
    const isLoading = loadingRemarks[loadingKey];

    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleRemarkToggle(submission._id, remarkType, isChecked);
          }}
          disabled={isLoading}
          aria-label={label}
          className={`flex h-5 w-5 items-center justify-center rounded border transition ${
            isChecked
              ? 'border-green-500 bg-green-500/20 text-green-300'
              : 'border-gray-600 bg-gray-900 text-gray-500 hover:border-green-500/60 hover:text-green-300'
          } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
        >
          {isLoading ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : isChecked ? (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : null}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-gray-900 bg-gray-900/70 px-6 py-6 shadow-lg shadow-black/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-2xl font-semibold text-white">Problems</h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative flex items-center">
                <button
                  onClick={() => setSearchActive((prev) => !prev)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-950 border border-gray-800 rounded-2xl hover:bg-gray-900 transition-all duration-200"
                >
                  <svg
                    className="w-5 h-5 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`ml-2 h-10 w-0 opacity-0 rounded-2xl border border-gray-800 bg-gray-950 text-sm font-medium text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 ease-in-out ${
                    searchActive ? 'w-56 opacity-100 pl-4 pr-3' : 'w-0 opacity-0'
                  }`}
                />
                {((isFetching && remoteSearchActive) || (searchQuery !== debouncedSearchQuery && searchQuery.trim() !== '')) && (
                  <div className="absolute right-4 flex items-center">
                    <span className="h-4 w-4 animate-spin rounded-full border border-gray-500 border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="rounded-2xl border border-gray-800 bg-gray-950 px-4 py-2">
                  <span className="font-semibold text-white">{totalSolved}</span>
                  <span className="mx-1 text-gray-500">/</span>
                  <span>{totalQuestions}</span>
                  <span className="ml-2 text-gray-500">Solved</span>
            </div>
                <div className="flex items-center gap-3 lg:hidden">
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    title={`Go to ${user?.username ?? 'User'} profile`}
                  >
                    {user?.username 
                      ? user.username.split(' ').map(name => name.charAt(0).toUpperCase()).join('').substring(0, 2)
                      : 'U'
                    }
                  </button>
                  <span className="font-medium text-gray-200 text-sm">{user?.username ?? 'Anonymous'}</span>
                </div>
                <div className="hidden items-center gap-3 lg:flex">
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    title={`Go to ${user?.username ?? 'User'} profile`}
                  >
                    {user?.username 
                      ? user.username.split(' ').map(name => name.charAt(0).toUpperCase()).join('').substring(0, 2)
                      : 'U'
                    }
                  </button>
                  <span className="font-medium text-gray-200">{user?.username ?? 'Anonymous'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-950 p-1 text-xs font-medium text-gray-400">
              {(['all', 'recent'] as const).map(tabKey => (
            <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`rounded-full px-4 py-1.5 transition ${
                    activeTab === tabKey ? 'bg-blue-500 text-white' : 'hover:text-gray-200'
                  }`}
                >
                  {tabKey === 'all' ? 'All' : 'New'}
            </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              <label className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2">
                <span>Difficulty</span>
              <select
                value={difficultyFilter}
                  onChange={(event) => {
                    setDifficultyFilter(event.target.value as typeof difficultyFilter);
                    // Reset search cursor when changing filters
                    setSearchCursor(null);
                  }}
                  className="bg-transparent text-white focus:outline-none"
              >
                  <option value="all">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2">
                <span>Status</span>
              <select
                value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as typeof statusFilter);
                    // Reset search cursor when changing filters
                    setSearchCursor(null);
                  }}
                  className="bg-transparent text-white focus:outline-none"
              >
                  <option value="all">All</option>
                <option value="solved">Solved</option>
                <option value="attempted">Attempted</option>
              </select>
              </label>
            </div>
          </div>
        </header>

        <main className="mt-8">
        {activeTab === 'all' && (
            <div className="rounded-3xl border border-gray-900 bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-blue-500/5">
              <div className="grid grid-cols-[40px_52px_minmax(0,1.2fr)_110px_90px_90px_90px_80px_80px_80px_48px] gap-1.5 border-b border-gray-850 px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <span>Status</span>
                <span>No.</span>
                <span>Question</span>
                <span>Difficulty</span>
                <span>Solve Time</span>
                <span>Passed</span>
                <span>Failed</span>
                <span>Can Do Better</span>
                <span>Need Working On</span>
                <span>Saw Solution</span>
                <span>Star</span>
            </div>

              <div>
              {filteredSubmissions.map((submission, index) => (
                  <button
                  key={submission._id}
                    type="button"
                  onClick={() => setSelectedSubmission(submission)}
                    className={`grid w-full grid-cols-[40px_52px_minmax(0,1.2fr)_110px_90px_90px_90px_80px_80px_80px_48px] items-center gap-1.5 px-5 py-3 text-left transition focus:outline-none ${
                      index % 2 === 0 ? 'bg-gray-900 hover:bg-gray-850/90' : 'bg-gray-950 hover:bg-gray-900/80'
                    }`}
                >
                    <span className="flex items-center justify-center">
                    {getStatusIcon(submission)}
                    </span>
                    <span className="flex items-center font-mono text-xs text-gray-400">
                      {(index + 1).toString().padStart(2, '0')}.
                    </span>
                    <span className="flex items-center gap-1 overflow-hidden">
                      {submission.questionDetails.questionNo && (
                        <span className="text-xs text-gray-500">{submission.questionDetails.questionNo}</span>
                      )}
                      <span className="flex-1 truncate text-sm font-medium text-white hover:text-blue-400 transition">
                      {submission.title}
                      </span>
                    </span>
                    <span className="flex items-center text-xs font-semibold">
                      <span
                        className={
                          submission.questionDetails.difficulty === 'Easy'
                            ? 'text-emerald-300'
                            : submission.questionDetails.difficulty === 'Hard'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }
                      >
                        {submission.questionDetails.difficulty}
                      </span>
                    </span>
                    <span className="flex items-center text-xs font-semibold text-gray-300">
                      {submission.solveTime != null ? `${submission.solveTime} min` : '#'}
                    </span>
                    <span className="flex items-center text-xs font-semibold text-emerald-300">
                      {submission.passedAttempts ?? 0}
                    </span>
                    <span className="flex items-center text-xs font-semibold text-rose-300">
                      {submission.failedAttempts ?? 0}
                    </span>
                    {renderRemarkToggle(submission, 'canDoBetter', 'Toggle can do better')}
                    {renderRemarkToggle(submission, 'needWorking', 'Toggle need working on')}
                    {renderRemarkToggle(submission, 'sawSolution', 'Toggle saw solution')}
                    <span className="flex items-center justify-center text-gray-500">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    </span>
                    </button>
              ))}
                {filteredSubmissions.length > 0 && (
                  <>
                    <div ref={loadMoreTriggerRef} className="h-6 w-full" />
                    {(remoteSearchActive ? searchLoadingMore : loadingMoreBase) && (
                      <div className="flex items-center justify-center py-4 text-xs text-gray-500">
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border border-gray-600 border-t-transparent" />
                        Loading more...
                      </div>
                    )}
                  </>
                )}
            </div>

            {filteredSubmissions.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center text-sm text-gray-400">
                  <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No matching problems. Adjust your search or filters.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-gray-800 bg-gray-900/60 text-center text-gray-500">
              <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Newly added questions will appear here soon.</p>
                <p className="text-xs text-gray-500">We are preparing the feed for your next batch of problems.</p>
            </div>
          </div>
        )}
        </main>
      </div>

      {selectedSubmission && (
        <LeetCodeSubmissionModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={onSubmissionUpdate}
        />
      )}
    </div>
  );
}