
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime: number; // in minutes
}

export interface Roadmap {
  subject: string;
  tasks: Task[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
}

export type FontType = 'lexend' | 'comic' | 'open';
export type ThemeType = 'alice-blue' | 'mint-cream' | 'light-yellow' | 'lavender' | 'dark' | 'aesthetic-sunset' | 'aesthetic-ocean' | 'aesthetic-dream';

export interface AppSettings {
  font: FontType;
  fontSize: number; // 14px to 32px
  letterSpacing: number; // 0.0px to 5.0px
  theme: ThemeType;
  voiceEnabled: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: 'star' | 'trophy' | 'zap' | 'target' | 'medal' | 'sun';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface StudyLog {
  id: string;
  taskTitle: string;
  durationMinutes: number;
  timestamp: string;
  distractionCount: number;
  completed: boolean;
}

export interface UserStats {
  points: number;
  streak: number;
  tasksCompleted: number;
  badges: Badge[];
}

export interface UserProfile {
  name: string;
  avatar: string;
  superpower: string;
  bio: string;
}

export interface GlossaryItem {
  id: string;
  word: string;
  definition: string;
  dateAdded: string;
}

export enum View {
  HOME = 'HOME',
  ROADMAP = 'ROADMAP',
  STUDY = 'STUDY',
  CHAT = 'CHAT',
  AI_READER = 'AI_READER',
  SETTINGS = 'SETTINGS',
  PARENT_DASHBOARD = 'PARENT_DASHBOARD'
}
