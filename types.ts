export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Flashcard {
  id?: string;
  front: string;
  back: string;
  isFavorite?: boolean;
}

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'assistant';
  text?: string;
  content?: string;
  timestamp: number | Date;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  uploadDate: string;
  text: string;
  dataUrl: string;
  
  // Cached generated content
  summary?: string;
  notes?: string;
  importantPoints?: string;
  explanation?: string;
  flashcards?: Flashcard[];
  quiz?: {
    questions: QuizQuestion[];
    generatedAt: Date | string;
  };
  audioLesson?: {
    text: string;
    generatedAt: Date | string;
  };
  audioCache?: Array<{
    key: string;
    url: string;
    scriptText?: string;
  }>;
  chatHistory?: ChatMessage[];
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
  action: string;
  timestamp: string;
}
