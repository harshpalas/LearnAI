import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Flashcard, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

// Helper to chunk text if it's too long
// Increased limit to 100,000 characters to cover more of the document
const truncateText = (text: string, maxLength: number = 100000) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "... [Truncated]";
};

// Helper to parse JSON safely from potentially messy model output
const parseJSON = (text: string | undefined) => {
  if (!text || !text.trim()) return null;
  
  let cleaned = text.trim();
  // Remove markdown code blocks if present (common even with JSON mode)
  cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Direct JSON parse failed, attempting extraction...", e);
    
    // Find the outer-most brackets/braces
    const firstOpenBrace = cleaned.indexOf('{');
    const lastCloseBrace = cleaned.lastIndexOf('}');
    
    if (firstOpenBrace !== -1 && lastCloseBrace !== -1) {
      try {
        return JSON.parse(cleaned.substring(firstOpenBrace, lastCloseBrace + 1));
      } catch (e2) {
        // Ignore
      }
    }
    
    // Check for array root
    const firstOpenBracket = cleaned.indexOf('[');
    const lastCloseBracket = cleaned.lastIndexOf(']');
    if (firstOpenBracket !== -1 && lastCloseBracket !== -1) {
       try {
        return JSON.parse(cleaned.substring(firstOpenBracket, lastCloseBracket + 1));
      } catch (e3) {
        // Ignore
      }
    }

    return null;
  }
};

const cleanHTML = (text: string) => {
  if (!text) return "";
  return text.replace(/^```html/i, "").replace(/^```/, "").replace(/```$/, "").trim();
};

export const generateSummary = async (text: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `You are an expert academic synthesizer. 
  Goal: Create an extremely detailed, extensive, and comprehensive summary of the provided document. Do NOT make it short.
  
  Instructions:
  1. **Coverage**: The summary MUST cover the ENTIRE document depth. Do not prioritize brevity. Explain every major concept found in the text.
  2. **Detail Level**: High. This summary should be detailed enough to study from without reading the original text.
  3. **Clarity**: Write in clear, professional language.
  4. **Format**: Return the output as a valid HTML string (fragment only, no <html> or <body> tags). 
  5. **Styling**: Use the following HTML structure and Tailwind CSS classes exactly to ensure high visibility:
     - **Section Headers**: <h3 class="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-8 mb-4 border-b border-indigo-200 dark:border-indigo-700 pb-2">
     - **Paragraphs**: <p class="text-gray-900 dark:text-gray-100 mb-4 leading-relaxed text-justify text-base">
     - **Lists**: <ul class="list-disc pl-6 space-y-2 mb-4 text-gray-900 dark:text-gray-100">
     - **List Items**: <li class="pl-1">
     - **Key Terms/Emphasis**: <span class="font-bold text-black dark:text-white bg-indigo-100 dark:bg-indigo-900/50 px-1 rounded">

  Structure the summary as follows:
  1. <h3 ...>Executive Overview</h3>: A detailed overview of the document's purpose.
  2. <h3 ...>In-Depth Analysis</h3>: Break down the document into its main sections. Dedicate multiple paragraphs to explaining the details of each section.
  3. <h3 ...>Key Concepts & Takeaways</h3>: A comprehensive list of the most important concepts to remember.

  Document Content:
  ${truncateText(text)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return cleanHTML(response.text || "Failed to generate summary.");
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "<p>Error generating summary. Please try again.</p>";
  }
};

export const generateExplanation = async (concept: string, context: string): Promise<string> => {
   const model = "gemini-3-flash-preview";
   const prompt = `Explain the concept "${concept}" simply and clearly for a beginner, based on the context provided below.
   
   Context:
   ${truncateText(context, 15000)}`;

   try {
     const response = await ai.models.generateContent({
       model,
       contents: prompt,
     });
     return response.text || "Could not explain concept.";
   } catch (error) {
     return "Error explaining concept.";
   }
};

export const generateFlashcards = async (text: string): Promise<Flashcard[]> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Generate 10 high-quality flashcards based on the key concepts in the following text.
  
  Text:
  ${truncateText(text, 50000)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: "The question or term" },
                  back: { type: Type.STRING, description: "The answer or definition" }
                },
                required: ["front", "back"]
              }
            }
          }
        }
      }
    });

    const data = parseJSON(response.text);
    
    if (data && Array.isArray(data.flashcards)) {
        return data.flashcards.map((card: any) => ({
            id: crypto.randomUUID(),
            front: card.front,
            back: card.back,
            isFavorite: false
        }));
    }
    
    // Fallback if structure is different but contains array
    if (Array.isArray(data)) {
        return data.map((card: any) => ({
            id: crypto.randomUUID(),
            front: card.front || card.question,
            back: card.back || card.answer,
            isFavorite: false
        })).filter((c: any) => c.front && c.back);
    }

    console.warn("Invalid flashcard data format received from API:", data);
    return [];

  } catch (error) {
    console.error("Gemini Flashcard Error:", error);
    return [];
  }
};

export const generateQuiz = async (text: string, count: number = 5): Promise<QuizQuestion[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate ${count} multiple-choice questions to test understanding of the following text.
  
  Text:
  ${truncateText(text, 50000)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
       config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
                  explanation: { type: Type.STRING, description: "Detailed explanation of why the correct answer is right and others are wrong." }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          }
        }
      }
    });

    const data = parseJSON(response.text);
    
    if (data && Array.isArray(data.questions)) {
       return data.questions.map((q: any) => ({
        id: crypto.randomUUID(),
        question: q.question,
        options: Array.isArray(q.options) ? q.options : ["Option 1", "Option 2"],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || "No explanation provided"
      }));
    }

    // Fallback
    if (Array.isArray(data)) {
       return data.map((q: any) => ({
        id: crypto.randomUUID(),
        question: q.question || "Question",
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation || ""
      }));
    }

    console.warn("Invalid quiz data format received from API:", data);
    return [];

  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    return [];
  }
};

export const createChatSession = (documentText: string) => {
  const model = "gemini-3-flash-preview";
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `You are a helpful AI tutor. You have access to the following document content. Answer the user's questions based strictly on this content. If the answer is not in the document, say so.
      
      Document Content:
      ${truncateText(documentText, 50000)}`
    }
  });
  return chat;
};

// Generates an audio explanation of the document
export const generateAudioLesson = async (
  text: string, 
  language: 'English' | 'Hinglish',
  type: 'summary' | 'detail'
): Promise<string | null> => {
  try {
    // Step 1: Generate a script using a text model
    const scriptModel = "gemini-3-flash-preview";
    
    let languageInstruction = "";
    if (language === 'Hinglish') {
        languageInstruction = "Language style: Hinglish. This means a natural, conversational mix of Hindi and English. Use Hindi for explanations to make it easy to understand, but keep technical terms in English. Speak like a friendly Indian teacher.";
    } else {
        languageInstruction = "Language style: English. Speak naturally, clearly, and professionally like a university professor.";
    }

    let taskInstruction = "";
    if (type === 'summary') {
        taskInstruction = "Task: Provide a concise, high-level summary of the entire document text provided. Focus on the main purpose, key findings, and conclusion. Keep it under 2 minutes of spoken time.";
    } else {
        taskInstruction = "Task: Explain the content of the text segment in depth. Do not summarize briefly. Explain concepts, define terms, and walk through arguments in detail. Treat this as a dedicated part of a lecture.";
    }
    
    const scriptPrompt = `You are an AI teacher preparing a spoken lecture script.
    
    ${languageInstruction}
    ${taskInstruction}
    
    Constraints:
    - Write ONLY the spoken text. 
    - Do not include headers, stage directions, or markdown.
    - Make it engaging and educational.
    
    Text Content:
    ${truncateText(text, 30000)}`;

    const scriptResponse = await ai.models.generateContent({
      model: scriptModel,
      contents: scriptPrompt,
    });

    const script = scriptResponse.text;
    
    if (!script) {
      console.error("Failed to generate audio script.");
      return null;
    }

    // Step 2: Convert the script to audio using the TTS model
    const audioModel = "gemini-2.5-flash-preview-tts";
    const audioResponse = await ai.models.generateContent({
      model: audioModel,
      contents: { parts: [{ text: script }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      }
    });

    // The API returns the audio data in base64 within the inlineData of the first part
    return audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

  } catch (error) {
    console.error("Gemini Audio Error:", error);
    return null;
  }
};

export const generateStudyNotes = async (text: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  // Updated prompt to avoid markdown symbols and request extensive, exam-quality notes
  const prompt = `Create extremely detailed, "Exam-Topper" quality study notes for the provided document.
  
  Goal: The student should be able to get top marks in an exam just by reading these notes.
  
  Formatting Rules:
  1. **NO MARKDOWN SYMBOLS**: Do NOT use hashtags (#), asterisks (*), or dashes (-) for formatting.
  2. **Clean Text Structure**:
     - Use UPPERCASE for Main Section Headings.
     - Use Title Case for Subheadings.
     - Use spacing and indentation to show structure.
  3. **Content Quality**:
     - Do not be brief. Be exhaustive.
     - Include every definition, formula, date, and key argument found in the text.
     - If the text has list items, include them all.
     - Add "EXAM TIP:" sections where relevant to highlight crucial info.

  Structure example:
  SECTION 1: INTRODUCTION
     Key Concept: Definition of the term...
     
     Details:
     The detailed explanation goes here...

  Document content to process:
  ${truncateText(text, 50000)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Notes Error:", error);
    return "Error generating notes.";
  }
};