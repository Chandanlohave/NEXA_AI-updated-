export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface UserProfile {
  name: string;
  mobile: string;
  role: UserRole;
  gender?: 'MALE' | 'FEMALE';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isAngry?: boolean;
  imageUrl?: string;
}

export enum HUDState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ANGRY = 'WARNING'
}

export type Theme = 'DARK' | 'LIGHT' | 'SYSTEM';

export interface AppConfig {
  animationsEnabled: boolean;
  hudRotationSpeed: number;
  theme: Theme;
}