import { Document, User, Flashcard, QuizQuestion, QuizAttempt, ActivityLog } from '../types';
import { apiClient, getAuthToken } from '../config/api';

// Keys for local storage (fallback)
const KEYS = {
  USER: 'learnai_user',
  DOCS: 'learnai_docs',
  FLASHCARDS: 'learnai_flashcards',
  QUIZZES: 'learnai_quizzes',
  ATTEMPTS: 'learnai_attempts',
  ACTIVITY: 'learnai_activity'
};

// Helper
const get = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const set = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Documents ---
export const saveDocument = async (doc: Document): Promise<Document> => {
  const token = getAuthToken();
  if (token) {
    try {
      const savedDoc = await apiClient.post('/api/documents', doc);
      logActivity(`Uploaded document: ${doc.filename}`);
      return savedDoc; // Return the document with _id from backend
    } catch (error) {
      console.error('Failed to save to backend, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  const docs = get<Document>(KEYS.DOCS);
  docs.push(doc);
  set(KEYS.DOCS, docs);
  logActivity(`Uploaded document: ${doc.filename}`);
  return doc;
};

export const getDocuments = async (): Promise<Document[]> => {
  const token = getAuthToken();
  if (token) {
    try {
      const docs = await apiClient.get('/api/documents');
      return Array.isArray(docs) ? docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()) : [];
    } catch (error) {
      console.error('Failed to fetch from backend, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  return get<Document>(KEYS.DOCS).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
};

export const getDocumentById = async (id: string): Promise<Document | undefined> => {
  const token = getAuthToken();
  if (token) {
    try {
      const doc = await apiClient.get(`/api/documents/${id}`);
      return doc;
    } catch (error) {
      console.error('Failed to fetch from backend, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  return get<Document>(KEYS.DOCS).find(d => d.id === id || d._id === id);
};

export const deleteDocument = async (id: string) => {
  const token = getAuthToken();
  if (token) {
    try {
      await apiClient.delete(`/api/documents/${id}`);
      localStorage.removeItem(`${KEYS.FLASHCARDS}_${id}`);
      logActivity('Deleted a document');
      return;
    } catch (error) {
      console.error('Failed to delete from backend, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  const docs = get<Document>(KEYS.DOCS).filter(d => d.id !== id);
  set(KEYS.DOCS, docs);
  localStorage.removeItem(`${KEYS.FLASHCARDS}_${id}`);
  logActivity('Deleted a document');
};

export const updateDocumentSummary = async (id: string, summary: string) => {
  const token = getAuthToken();
  if (token) {
    try {
      await apiClient.put(`/api/documents/${id}`, { summary });
      return;
    } catch (error) {
      console.error('Failed to update on backend, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  const docs = get<Document>(KEYS.DOCS);
  const docIndex = docs.findIndex(d => d.id === id);
  if (docIndex > -1) {
    docs[docIndex].summary = summary;
    set(KEYS.DOCS, docs);
  }
};

export const updateDocumentNotes = async (id: string, notes: string) => {
  const token = getAuthToken();
  if (token) {
    try {
      await apiClient.put(`/api/documents/${id}`, { notes });
      return;
    } catch (error) {
      console.error('Failed to update notes on backend, using local storage:', error);
    }
  }
  
  // Fallback to local storage
  const docs = get<Document>(KEYS.DOCS);
  const docIndex = docs.findIndex(d => d.id === id);
  if (docIndex > -1) {
    docs[docIndex].notes = notes;
    set(KEYS.DOCS, docs);
  }
};

// --- Flashcards ---
export const saveFlashcardsForDoc = (docId: string, flashcards: Flashcard[]) => {
  localStorage.setItem(`${KEYS.FLASHCARDS}_${docId}`, JSON.stringify(flashcards));
};

export const getFlashcardsForDoc = (docId: string): Flashcard[] => {
  const data = localStorage.getItem(`${KEYS.FLASHCARDS}_${docId}`);
  return data ? JSON.parse(data) : [];
};

// --- Quiz ---
export const saveQuizAttempt = (attempt: QuizAttempt) => {
  const attempts = get<QuizAttempt>(KEYS.ATTEMPTS);
  attempts.push(attempt);
  set(KEYS.ATTEMPTS, attempts);
};

export const getQuizAttempts = (docId: string): QuizAttempt[] => {
  return get<QuizAttempt>(KEYS.ATTEMPTS).filter(a => a.documentId === docId);
};

// --- Activity Logs ---
const logActivity = (action: string) => {
  const activities = get<ActivityLog>(KEYS.ACTIVITY);
  activities.push({
    id: crypto.randomUUID(),
    action,
    timestamp: new Date().toISOString(),
  });
  set(KEYS.ACTIVITY, activities.slice(-50));
};

export const getActivityLogs = (): ActivityLog[] => {
  return get<ActivityLog>(KEYS.ACTIVITY);
};

// Export aliases for compatibility
export const saveFlashcards = saveFlashcardsForDoc;
export const getFlashcards = getFlashcardsForDoc;
export const getActivities = getActivityLogs;
