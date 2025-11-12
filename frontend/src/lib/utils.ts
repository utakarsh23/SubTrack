import { Submission } from '@/types/submission';

export const getDifficultyColor = (difficulty: Submission['questionDetails']['difficulty']) => {
  switch (difficulty) {
    case 'Easy':
      return 'text-green-400';
    case 'Medium':
      return 'text-orange-400';
    case 'Hard':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const getDifficultyBgColor = (difficulty: Submission['questionDetails']['difficulty']) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-400/20 text-green-400 border-green-400/30';
    case 'Medium':
      return 'bg-orange-400/20 text-orange-400 border-orange-400/30';
    case 'Hard':
      return 'bg-red-400/20 text-red-400 border-red-400/30';
    default:
      return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
  }
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDuration = (solveTime?: number) => {
  if (!solveTime) return 'N/A';
  
  const minutes = Math.floor(solveTime / 60);
  const seconds = solveTime % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};