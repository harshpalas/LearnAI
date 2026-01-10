export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  uploadDate: string;
  text: string; // Extracted text
  summary?: string;
  notes?: string; // User/AI Notes
  dataUrl: string; // For PDF viewing
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  isFavorite: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  documentId: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface ActivityLog {
  id: string;
  action: string; // e.g., "Uploaded PDF", "Completed Quiz"
  timestamp: string;
}