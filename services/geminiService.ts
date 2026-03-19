import { Flashcard, QuizQuestion } from "../types";
import { apiClient } from "../config/api";

// Chat session wrapper that calls the stateless backend endpoint
export class ChatSession {
  private documentText: string;

  constructor(documentText: string) {
    this.documentText = documentText;
  }

  async sendMessage({ message }: { message: string }): Promise<{ text: string }> {
    try {
      const data = await apiClient.post('/api/gemini/chat-session', {
        documentText: this.documentText,
        message
      });

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.response) {
        throw new Error('No response from AI service');
      }

      return { text: data.response };
    } catch (error: any) {
      console.error('Chat Error:', error);
      return { text: error?.message || 'Sorry, I encountered an error.' };
    }
  }
}

export const createChatSession = (documentText: string): ChatSession => {
  return new ChatSession(documentText);
};

export const generateSummary = async (text: string, documentId?: string, force?: boolean): Promise<string> => {
  try {
    const data = await apiClient.post('/api/gemini/summary', { text });
    return data.summary || "<p>Failed to generate summary.</p>";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "<p>Error generating summary. Please try again.</p>";
  }
};

export const generateExplanation = async (concept: string, context: string): Promise<string> => {
  try {
    const data = await apiClient.post('/api/gemini/explanation', { concept, context });
    return data.explanation || "Could not explain concept.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Error explaining concept.";
  }
};

export const generateFlashcards = async (text: string, documentId?: string, force?: boolean): Promise<Flashcard[]> => {
  try {
    const data = await apiClient.post('/api/gemini/flashcards', { text });
    return data.flashcards || [];
  } catch (error) {
    console.error("Gemini Flashcard Error:", error);
    return [];
  }
};

export const generateQuiz = async (text: string, count: number = 5, documentId?: string, force?: boolean): Promise<QuizQuestion[]> => {
  try {
    const data = await apiClient.post('/api/gemini/quiz', { text, count });
    return data.questions || [];
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    return [];
  }
};

export const generateAudioLesson = async (
  text: string,
  documentId?: string,
  language: string = 'English',
  type: string = 'summary',
  pageKey?: string
): Promise<{ audioUrl: string | null; audioData: string | null; scriptText: string | null }> => {
  try {
    const data = await apiClient.post('/api/gemini/audio-lesson', {
      text,
      language,
      type,
      documentId,
      pageKey: pageKey ?? type,
    });
    return {
      audioUrl: data.audioUrl || null,
      audioData: data.audioData || null,
      scriptText: data.scriptText || null,
    };
  } catch (error) {
    console.error('Audio Lesson Error:', error);
    return { audioUrl: null, audioData: null, scriptText: null };
  }
};

export const generateStudyNotes = async (text: string, documentId?: string, force?: boolean): Promise<string> => {
  try {
    const data = await apiClient.post('/api/gemini/notes', { text });
    return data.notes || "";
  } catch (error) {
    console.error("Gemini Notes Error:", error);
    return "Error generating notes.";
  }
};

export const generateImportantPoints = async (text: string, documentId?: string, force?: boolean): Promise<string> => {
  try {
    const data = await apiClient.post('/api/gemini/important-points', { text });
    return data.importantPoints || "<p>No content generated.</p>";
  } catch (error) {
    console.error("Gemini Important Points Error:", error);
    return "<p>Error generating key points. Please try again.</p>";
  }
};

