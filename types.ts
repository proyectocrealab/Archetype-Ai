export interface UserArchetype {
  id: string;
  name: string;
  role: string;
  age: number;
  quote: string;
  bio: string;
  goals: string[];
  frustrations: string[];
  motivations: string[];
  techLiteracy: number; // 1-10
  personalityTraits: string[];
  imageUrl?: string; // Optional, populated later
  imagePrompt?: string; // For generating the image
  tags?: string[]; // For organization
  notes?: string; // For user notes
  savedAt?: string; // ISO Date string
}

export interface GenerationState {
  isGeneratingText: boolean;
  isGeneratingImage: Record<string, boolean>; // map of archetypeId -> boolean
  error: string | null;
}

export enum ViewState {
  INPUT = 'INPUT',
  RESULTS = 'RESULTS',
  COMPARE = 'COMPARE',
  SAVED = 'SAVED'
}

export interface ResearchData {
  title: string;
  studentName: string;
  teamName: string;
  description: string;
  painPoints: string;
  needs: string;
  goals: string;
  actions: string;
}

export interface TeacherFeedback {
  grade: string; // A, B, C, D, F
  score: number; // 0-100
  feedbackTitle: string; // "Excellent Start!", "Needs more depth", etc.
  strengths: string[];
  improvements: string[];
  thoughtProvokingQuestions: string[];
  overallComment: string;
}