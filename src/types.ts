export type AgeTier = '5-8' | '9-11' | '12-15';

export interface SummaryPoint {
  id: string;
  title: string;
  text: string;
  emoji: string;
  example?: string;
  funFact?: string;
}

export interface InfographicSection {
  title: string;
  icon: 'sparkles' | 'book' | 'lightbulb' | 'target' | 'compass' | 'heart' | 'zap' | 'star';
  color: 'amber' | 'emerald' | 'sky' | 'indigo' | 'rose' | 'purple';
  description: string;
  keyItems: string[];
}

export interface StepOrCycle {
  step: number;
  title: string;
  desc: string;
}

export interface QuickStat {
  label: string;
  value: string;
  note?: string;
}

export interface InfographicData {
  headline: string;
  visualMetaphor?: string;
  sections: InfographicSection[];
  stepsOrCycle?: StepOrCycle[];
  quickStats?: QuickStat[];
  videoUrl?: string;
  posterImageUrl?: string;
}

export interface Question {
  id: string;
  type: 'mcq' | 'true_false' | 'fill_blank';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  difficulty?: 'سهل' | 'متوسط' | 'تحدي الأذكياء';
}

export interface LessonData {
  id: string;
  createdAt: number;
  title: string;
  emoji: string;
  ageTier: AgeTier;
  subject?: string;
  summaryPoints: SummaryPoint[];
  infographic: InfographicData;
  practiceQuestions: Question[];
  homeworkTips: string[];
  suggestedQuestions: string[];
  originalText?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  followUpSuggestions?: string[];
}

export interface HomeworkSolution {
  understoodProblem: string;
  ruleOrConcept: string;
  steps: {
    stepNumber: number;
    title: string;
    explanation: string;
    detail?: string;
  }[];
  finalAnswer: string;
  verificationTip?: string;
  encouragement?: string;
}

/* ==========================================
   Rewards, Badges & Leaderboard Types
========================================== */

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardPoints: number;
  targetCount: number;
  currentCount: number;
  unlocked: boolean;
  unlockedAt?: number;
  color: 'amber' | 'emerald' | 'sky' | 'purple' | 'rose';
}

export interface StudentProfile {
  name: string;
  avatar: string;
  totalPoints: number;
  level: number;
  levelTitle: string;
  currentXp: number;
  nextLevelXp: number;
  quizzesCompleted: number;
  lessonsReviewed: number;
  audioListened: number;
  homeworkSolved: number;
  badges: AchievementBadge[];
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  points: number;
  levelTitle: string;
  isCurrentUser: boolean;
  trend?: 'up' | 'same' | 'down';
}

export interface RewardNotification {
  id: string;
  points: number;
  reason: string;
  badge?: AchievementBadge;
}
