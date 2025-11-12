export interface Submission {
  _id: string;
  title: string;
  questionDetails: {
    titleSlug?: string;
    questionNo?: string;
    link: string;
    timestamp: number;
    statusDisplay: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  };
  lang: string;
  attempts: number;
  passedAttempts: number;
  failedAttempts: number;
  platform: string;
  solveTime?: number;
  approach: string[];
  notes: string[];
  description: string[];
  remarks: {
    needWorking: boolean;
    sawSolution: boolean;
    canDoBetter: boolean;
  };
  user: string;
}

export interface SubmissionUpdate {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  solveTime?: number;
  approach?: string[];
  notes?: string[];
  description?: string[];
  remarks?: {
    needWorking?: boolean;
    sawSolution?: boolean;
    canDoBetter?: boolean;
  };
}