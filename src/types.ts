
export enum ActivityType {
  FOOD = 'FOOD',
  EXERCISE = 'EXERCISE',
  REST = 'REST'
}

export enum ActivityId {
  SLEEP = 'SLEEP',
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  WORKOUT = 'WORKOUT',
  CARDIO = 'CARDIO'
}

export interface Activity {
  id: ActivityId;
  label: string;
  type: ActivityType;
  completed: boolean;
  details: string; // "O que comi" ou "O que treinei/Tempo"
  placeholder: string;
  icon: string; // Emoji char
}

export interface DailyLog {
  date: string; // ISO Date string YYYY-MM-DD
  activities: Activity[];
}

export interface UserProfile {
  name: string;
  email: string;
  photoUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum View {
  LOGIN = 'LOGIN',
  TRACKER = 'TRACKER',
  ANALYTICS = 'ANALYTICS',
  AI_REPORT = 'AI_REPORT'
}

export enum TimeRange {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}
