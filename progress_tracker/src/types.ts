export interface PlanDay {
  id: string;
  dayNumber: number;
  block1_DSA_Concept: string;
  block1_completed: boolean;
  block2_DSA_Problems: string;
  block2_completed: boolean;
  block3_CF_Upsolve: string;
  block3_completed: boolean;
  block4_ML_Theory: string;
  block4_completed: boolean;
  block5_ML_Project: string;
  block5_completed: boolean;
  notes?: string;
  resources?: string;
  problemsList?: string;
  projectsList?: string;
  isBacklog: boolean;
  completed: boolean;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  blockType: "DSA Concepts" | "DSA Problems" | "Codeforces/Upsolve" | "ML Theory" | "ML Implementation/Project" | "VS Code Active Session";
  durationMinutes: number;
  notes?: string;
  source: "Manual" | "VS Code Tracker" | "Simulation";
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  codeforcesHandle: string;
  leetcodeHandle: string;
  vsCodeSyncActive: boolean;
  lastSyncedStats?: string;
}

export interface AnalysisResponse {
  productivityScore: number;
  evaluationSummary: string;
  backlogItems: string[];
  suggestions: string[];
  prioritizedTaskQueue: string[];
  projectAdvice: string;
}

export interface CodeforcesStats {
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  avatar: string;
  submissionsCount: number;
  lastSubmissions: Array<{
    id: number;
    contestId: number;
    creationTimeSeconds: number;
    problem: {
      index: string;
      name: string;
      rating?: number;
      tags: string[];
    };
    verdict?: string;
  }>;
}

export interface LeetCodeStats {
  username: string;
  ranking?: number;
  reputation?: number;
  totalSolved: number;
  solvedByDifficulty: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
}
