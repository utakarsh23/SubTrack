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
  const [loading, setLoading] = useState(false);
  const [localSubmission, setLocalSubmission] = useState<Submission>(submission);
  
  // Form state
  const [solveTime, setSolveTime] = useState<number | string>(submission.solveTime || '');
  const [approachItems, setApproachItems] = useState<string[]>(
    Array.isArray(submission.approach) ? submission.approach : 
    submission.approach ? [submission.approach] : []
  );
  const [notesItems, setNotesItems] = useState<string[]>(
    Array.isArray(submission.notes) ? submission.notes :
    submission.notes ? [submission.notes] : []
  );
  const [descriptionItems, setDescriptionItems] = useState<string[]>(
    Array.isArray(submission.description) ? submission.description :
    submission.description ? [submission.description] : []
  );
  const [newApproachItem, setNewApproachItem] = useState('');
  const [newNotesItem, setNewNotesItem] = useState('');
  const [newDescriptionItem, setNewDescriptionItem] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');

  const handleRemarkToggle = async (remarkType: keyof Submission['remarks']) => {
    const newValue = !localSubmission.remarks[remarkType];
    
    // Update local state immediately for responsive UI
    setLocalSubmission(prev => ({
      ...prev,
      remarks: {
        ...prev.remarks,
        [remarkType]: newValue
      }
    }));

    try {
      const response = await apiClient.toggleRemark(submission._id, remarkType, newValue);
      onUpdate(response.submission);
    } catch (error) {
      console.error('Failed to update remark:', error);
      // Revert on error
      setLocalSubmission(prev => ({
        ...prev,
        remarks: {
          ...prev.remarks,
          [remarkType]: !newValue
        }
      }));
    }
  };

  const addApproachItem = () => {
    if (newApproachItem.trim()) {
      setApproachItems(prev => [...prev, newApproachItem.trim()]);
      setNewApproachItem('');
    }
  };

  const removeApproachItem = (index: number) => {
    setApproachItems(prev => prev.filter((_, i) => i !== index));
  };

  const addNotesItem = () => {
    if (newNotesItem.trim()) {
      setNotesItems(prev => [...prev, newNotesItem.trim()]);
      setNewNotesItem('');
    }
  };

  const removeNotesItem = (index: number) => {
    setNotesItems(prev => prev.filter((_, i) => i !== index));
  };

  const addDescriptionItem = () => {
    if (newDescriptionItem.trim()) {
      setDescriptionItems(prev => [...prev, newDescriptionItem.trim()]);
      setNewDescriptionItem('');
    }
  };

  const removeDescriptionItem = (index: number) => {
    setDescriptionItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = {
        solveTime: solveTime ? Number(solveTime) : undefined,
        approach: approachItems,
        notes: notesItems,
        description: descriptionItems,
        remarks: localSubmission.remarks
      };

      const response = await apiClient.updateSubmission(submission._id, updates);
      onUpdate(response.submission);
      onClose();
    } catch (error) {
      console.error('Failed to save submission:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div className="relative flex h-full w-full max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-600/40 bg-gray-800/80 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-700/50 px-8 py-6">
          <div className="space-y-2">
                        <div className="flex items-center gap-3">
              <a
                href={submission.questionDetails.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-bold text-white transition hover:text-blue-400"
              >
                {submission.title}
              </a>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wide uppercase">{submission.platform}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span>
                Added: {submission.questionDetails.timestamp
                  ? new Date(submission.questionDetails.timestamp * 1000).toLocaleDateString('en-US', {
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
        <div className="flex-1 overflow-y-auto py-8">
          <div className="mx-auto flex flex-col items-center">
            {/* Solve Time and Stats Row */}
            <div className="w-full max-w-2xl bg-gray-800/40 rounded-2xl p-6 border border-gray-700/40">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-300 mb-1">Attempt Statistics</h3>
              </div>
              
              <div className="flex gap-8 items-center justify-center">
                <div className="space-y-3 text-center">
                  <label className="text-sm font-medium text-gray-400 block">Solve Time (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={solveTime}
                    onChange={(e) => setSolveTime(e.target.value)}
                    className="w-28 rounded-xl border border-gray-600/60 bg-gray-700/70 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center font-medium"
                    placeholder="0"
                  />
                </div>
                
                <div className="w-px h-16 bg-gray-600/50"></div>
                
                <div className="flex gap-8">
                  <div className="space-y-3 text-center">
                    <label className="text-sm font-medium text-gray-400 block">Passed</label>
                    <div className="w-24 rounded-xl border border-emerald-600/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 font-semibold text-center">
                      {submission.passedAttempts || 0}
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <label className="text-sm font-medium text-gray-400 block">Failed</label>
                    <div className="w-24 rounded-xl border border-red-600/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-semibold text-center">
                      {submission.failedAttempts || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approach */}
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-300 mb-1">Approach & Algorithm</h3>
                <p className="text-sm text-gray-500">Add the approaches or algorithms you used to solve this problem</p>
              </div>
              
              {/* Combined approach field with bubbles inside */}
              <div className="w-full max-w-2xl min-h-[120px] rounded-xl border border-gray-700/50 bg-gray-800/70 p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                {/* Existing approach bubbles */}
                {approachItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {approachItems.map((item, index) => (
                      <div key={index} className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 py-1.5 text-sm text-blue-200">
                        <span>{item}</span>
                        <button
                          onClick={() => removeApproachItem(index)}
                          className="text-blue-300 hover:text-red-300 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new approach */}
                <div className="flex gap-3 items-center justify-center">
                  <div className="flex-1 flex justify-center">
                    <input
                      type="text"
                      value={newApproachItem}
                      onChange={(e) => setNewApproachItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addApproachItem()}
                      className="w-full max-w-md bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-500 text-center"
                      placeholder="Type approach here..."
                    />
                  </div>
              
                </div>
              </div>
            </div>            {/* Notes */}
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-300 mb-1">Notes & Insights</h3>
                <p className="text-sm text-gray-500">Add important notes or insights about this problem</p>
              </div>
              
              {/* Combined notes field with bubbles inside */}
              <div className="w-full max-w-2xl min-h-[120px] rounded-xl border border-gray-700/50 bg-gray-800/70 p-4 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20">
                {/* Existing notes bubbles */}
                {notesItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {notesItems.map((item, index) => (
                      <div key={index} className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1.5 text-sm text-green-200">
                        <span>{item}</span>
                        <button
                          onClick={() => removeNotesItem(index)}
                          className="text-green-300 hover:text-red-300 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new note */}
                <div className="flex gap-3 items-center justify-center">
                  <div className="flex-1 flex justify-center">
                    <input
                      type="text"
                      value={newNotesItem}
                      onChange={(e) => setNewNotesItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addNotesItem()}
                      className="w-full max-w-md bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-500 text-center"
                      placeholder="Type note here..."
                    />
                  </div>
            
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-300 mb-1">Detailed Explanation</h3>
                <p className="text-sm text-gray-500">Write detailed explanations or multiple solution methods</p>
              </div>
              
              {/* Method Selection Dropdown */}
              {descriptionItems.length > 0 && (
                <div className="space-y-3 w-full max-w-2xl">
                  <div className="text-center">
                    <label className="text-sm font-medium text-gray-400 block mb-2">Select Method to View</label>
                    <select
                      value={selectedDescription}
                      onChange={(e) => setSelectedDescription(e.target.value)}
                      className="w-full max-w-md mx-auto rounded-xl border border-gray-700/50 bg-gray-800/70 px-4 py-3 text-sm text-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="">-- Select a method --</option>
                      {descriptionItems.map((item, index) => (
                        <option key={index} value={item} className="bg-gray-800">
                          M{index + 1} - {item.substring(0, 50)}{item.length > 50 ? '...' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {/* Description Display/Edit Field */}
              <div className="w-full max-w-2xl min-h-[140px] rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                {selectedDescription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-sm font-medium text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                        Method {descriptionItems.findIndex(item => item === selectedDescription) + 1}
                      </span>
                      <button
                        onClick={() => {
                          const index = descriptionItems.findIndex(item => item === selectedDescription);
                          removeDescriptionItem(index);
                          setSelectedDescription('');
                        }}
                        className="text-purple-300 hover:text-red-300 transition-colors bg-purple-500/10 p-1.5 rounded-lg"
                        title="Delete this method"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap text-center">{selectedDescription}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 h-full items-center justify-center">
                    <div className="w-full flex justify-center">
                      <textarea
                        value={newDescriptionItem}
                        onChange={(e) => setNewDescriptionItem(e.target.value)}
                        className="w-full max-w-lg bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-500 resize-none min-h-[100px] text-center"
                        placeholder="Write detailed explanation here..."
                        rows={4}
                      />
                    </div>
                    <button
                      onClick={addDescriptionItem}
                      disabled={!newDescriptionItem.trim()}
                      className="px-6 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Method
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800/70 py-8">
          <div className="max-w-4xl mx-auto px-8 space-y-6">
            {/* Checkboxes */}
            <div className="flex items-center justify-center gap-8">
              <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                <input
                  type="checkbox"
                  checked={localSubmission.remarks.canDoBetter}
                  onChange={() => handleRemarkToggle('canDoBetter')}
                  className="rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500/20 w-4 h-4"
                />
                Can Do Better
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                <input
                  type="checkbox"
                  checked={localSubmission.remarks.sawSolution}
                  onChange={() => handleRemarkToggle('sawSolution')}
                  className="rounded border-gray-500 bg-gray-800 text-red-500 focus:ring-red-500/20 w-4 h-4"
                />
                Saw Solution
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                <input
                  type="checkbox"
                  checked={localSubmission.remarks.needWorking}
                  onChange={() => handleRemarkToggle('needWorking')}
                  className="rounded border-gray-500 bg-gray-800 text-amber-500 focus:ring-amber-500/20 w-4 h-4"
                />
                Need Working On
              </label>
            </div>
            
            {/* Buttons */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-700/70 px-8 py-3 text-base font-medium text-gray-300 transition hover:border-gray-600 hover:text-white hover:bg-gray-700/30"
              >
                Close
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-blue-500 px-8 py-3 text-base font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}