import express from 'express';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { authMiddleware } from '../middleware/auth';
import { geminiManager } from '../services/geminiManager';
import { v2 as cloudinary } from 'cloudinary';
import Document from '../models/Document';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Helper to send a properly-coded error response
const sendError = (res: express.Response, error: any, fallbackMessage: string) => {
  const statusCode = (error as any)?.statusCode || 500;
  const message = statusCode === 503
    ? 'The AI model is currently busy. Please wait a moment and try again.'
    : statusCode === 429
    ? 'API quota limit reached. Please try again later.'
    : fallbackMessage;
  res.status(statusCode).json({ error: message });
};

// Helper to chunk text if it's too long
const truncateText = (text: string, maxLength: number = 100000) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "... [Truncated]";
};

// Helper to parse JSON safely from potentially messy model output
const parseJSON = (text: string | undefined) => {
  if (!text || !text.trim()) return null;
  
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Direct JSON parse failed, attempting extraction...", e);
    
    const firstOpenBrace = cleaned.indexOf('{');
    const lastCloseBrace = cleaned.lastIndexOf('}');
    
    if (firstOpenBrace !== -1 && lastCloseBrace !== -1) {
      try {
        return JSON.parse(cleaned.substring(firstOpenBrace, lastCloseBrace + 1));
      } catch (e2) {
        // Ignore
      }
    }
    
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

// Utility function to generate random UUID (for backend compatibility)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 1. Generate Summary
router.post('/summary', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

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
        const result = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const response = await client.models.generateContent({
                model,
                contents: prompt,
            });
            return cleanHTML(response.text || "Failed to generate summary.");
        });
        
        res.json({ summary: result });
    } catch (error) {
        console.error("Gemini Summary Error:", error);
        sendError(res, error, 'Error generating summary. Please try again.');
    }
});

// 2. Generate Explanation  
router.post('/explanation', authMiddleware, async (req, res) => {
    const { concept, context } = req.body;
    if (!concept || !context) {
        return res.status(400).json({ error: 'Concept and context are required' });
    }

    const model = "gemini-3-flash-preview";
    const prompt = `Explain the concept "${concept}" simply and clearly for a beginner, based on the context provided below.
   
   Context:
   ${truncateText(context, 15000)}`;

    try {
        const result = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const response = await client.models.generateContent({
                model,
                contents: prompt,
            });
            return response.text || "Could not explain concept.";
        });
        
        res.json({ explanation: result });
    } catch (error) {
        console.error("Gemini Explanation Error:", error);
        sendError(res, error, 'Error explaining concept.');
    }
});

// 3. Generate Flashcards
router.post('/flashcards', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const model = "gemini-3-flash-preview";
    const prompt = `Generate 10 high-quality flashcards based on the key concepts in the following text.
  
  Text:
  ${truncateText(text, 50000)}`;

    try {
        const result = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const response = await client.models.generateContent({
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
                    id: generateUUID(),
                    front: card.front,
                    back: card.back,
                    isFavorite: false
                }));
            }
            
            // Fallback if structure is different but contains array
            if (Array.isArray(data)) {
                return data.map((card: any) => ({
                    id: generateUUID(),
                    front: card.front || card.question,
                    back: card.back || card.answer,
                    isFavorite: false
                })).filter((c: any) => c.front && c.back);
            }

            console.warn("Invalid flashcard data format received from API:", data);
            return [];
        });
        
        res.json({ flashcards: result });
    } catch (error) {
        console.error("Gemini Flashcard Error:", error);
        sendError(res, error, 'Error generating flashcards.');
    }
});

// 4. Generate Quiz
router.post('/quiz', authMiddleware, async (req, res) => {
    const { text, count = 5 } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const model = "gemini-3-flash-preview";
    const prompt = `Generate ${count} multiple-choice questions to test understanding of the following text.
  
  Text:
  ${truncateText(text, 50000)}`;

    try {
        const result = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const response = await client.models.generateContent({
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
                id: generateUUID(),
                question: q.question,
                options: Array.isArray(q.options) ? q.options : ["Option 1", "Option 2"],
                correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
                explanation: q.explanation || "No explanation provided"
              }));
            }

            // Fallback
            if (Array.isArray(data)) {
               return data.map((q: any) => ({
                id: generateUUID(),
                question: q.question || "Question",
                options: q.options || [],
                correctAnswer: q.correctAnswer || 0,
                explanation: q.explanation || ""
              }));
            }

            console.warn("Invalid quiz data format received from API:", data);
            return [];
        });
        
        res.json({ questions: result });
    } catch (error) {
        console.error("Gemini Quiz Error:", error);
        sendError(res, error, 'Error generating quiz.');
    }
});

// 5. Create Chat Session
router.post('/chat-session', authMiddleware, async (req, res) => {
    const { documentText, message } = req.body;
    if (!documentText || !message) {
        return res.status(400).json({ error: 'Document text and message are required' });
    }

    const model = "gemini-3-flash-preview";

    try {
        const result = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const prompt = [
                'You are a helpful AI tutor. Answer ONLY from the provided document content.',
                '',
                'Output rules (mandatory):',
                '1. Respond point-wise using -> at the start of each point.',
                '2. Keep each point concise and clear.',
                '3. Do not use markdown symbols such as *, **, #, or numbered lists.',
                '4. Use plain text only.',
                '5. If answer is not in the document, say: Information not found in the provided document.',
                '',
                'Document Content:',
                truncateText(documentText, 50000),
                '',
                'User Question:',
                message,
            ].join('\n');

            const response = await client.models.generateContent({
                model,
                contents: prompt,
            });

            const raw = response.text || "I couldn't process your message.";
            const cleaned = raw
                .replace(/\*/g, '')
                .replace(/^\s*[��]\s+/gm, '-> ')
                .replace(/^\s*[-]\s+/gm, '-> ')
                .replace(/^\s*\d+[\.)]\s+/gm, '-> ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            return cleaned || "I couldn't process your message.";
        });

        res.json({ response: result });
    } catch (error: any) {
        console.error("Gemini Chat Error:", error);
        const errMsg = error?.message || 'Error processing chat message.';
        res.status((error as any)?.statusCode || 500).json({ error: errMsg });
    }
});
// --- Audio helpers ---
function pcmBase64ToWavBuffer(base64: string): Buffer {
  const pcm = Buffer.from(base64, 'base64');
  const sampleRate = 24000, numChannels = 1, bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii'); header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 'ascii'); header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28); header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34); header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

function uploadToCloudinary(wavBuffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', public_id: publicId, overwrite: true },
      (error, result) => { if (error) reject(error); else resolve(result!.secure_url); }
    );
    stream.end(wavBuffer);
  });
}

// 6. Generate Audio Lesson
router.post('/audio-lesson', authMiddleware, async (req, res) => {
    const { text, language = 'English', type = 'summary', documentId, pageKey } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const cacheKey = (pageKey != null ? pageKey : type) + '_' + language + '_v2';

    // Check MongoDB cache first
    if (documentId) {
        try {
            const doc = await Document.findOne({ _id: documentId, userId: (req.user as any)._id });
            if (doc) {
                const cached = (doc as any).audioCache?.find((e: any) => e.key === cacheKey);
                if (cached && (cached.url || cached.scriptText)) {
                    console.log('Audio cache hit:', cacheKey);
                    return res.json({ audioUrl: cached.url || null, scriptText: cached.scriptText || null, cached: true });
                }
            }
        } catch (cacheErr) {
            console.warn('Cache check failed, generating fresh:', cacheErr);
        }
    }

    let script: string | null = null;

    try {
        const scriptModel = 'gemini-3-flash-preview';
        const languageInstruction = language === 'Hinglish'
            ? 'Language style: Hinglish. A natural, conversational mix of Hindi and English. Use Hindi for explanations, keep technical terms in English. Speak like a friendly Indian teacher.'
            : 'Language style: Clear, Standard American English. Speak like a professional educator with good pacing. Use short, complete sentences. Avoid abbreviations, symbols, and bullet points. Spell out numbers and acronyms. Add natural pauses by ending sentences properly.';
        const taskInstruction = type === 'summary'
            ? 'Task: Provide a concise, high-level summary of the entire document. Focus on the main purpose, key findings, and conclusion. Keep it under 2 minutes of spoken time.'
            : 'Task: Explain the content in depth. Do not summarize briefly. Explain concepts, define terms, and walk through arguments in detail as part of a lecture.';

        const scriptPrompt = `You are an AI teacher preparing a spoken lecture script.\n\n${languageInstruction}\n${taskInstruction}\n\nConstraints:\n- Write ONLY the spoken words. No headers, bullet points, asterisks, dashes, or markdown.\n- Use short, clear sentences (max 20 words each).\n- Spell out all numbers, units, and acronyms (e.g. AI becomes Artificial Intelligence).\n- Use commas and periods to create natural pauses and rhythm.\n- Keep a steady, confident, and engaging tone throughout.\n- Never use symbols like %, $, &, /, or #.\n\nText Content:\n${truncateText(text, 30000)}`;

        script = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const r = await client.models.generateContent({ model: scriptModel, contents: scriptPrompt });
            return r.text || null;
        });

        if (!script) return sendError(res, {}, 'Failed to generate audio script.');

        // Step 2: Gemini TTS
        try {
            const audioModel = 'gemini-2.5-flash-preview-tts';
            const voiceName = language === 'Hinglish' ? 'Aoede' : 'Charon';

            const audioData = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
                const r = await client.models.generateContent({
                    model: audioModel,
                    contents: [{ role: 'user', parts: [{ text: script as string }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
                    }
                });
                return r.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
            });

            // Step 3: Upload to Cloudinary
            let audioUrl: string | null = null;
            if (audioData && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
                try {
                    const safeId = documentId ? String(documentId).replace(/[^a-zA-Z0-9]/g, '') : 'shared';
                    const pubId = 'learnai-audio/' + safeId + '/' + cacheKey.replace(/[^a-zA-Z0-9_]/g, '_');
                    audioUrl = (await uploadToCloudinary(pcmBase64ToWavBuffer(audioData), pubId)) as string;
                    console.log('Uploaded audio:', audioUrl);
                } catch (uploadErr) {
                    console.error('Cloudinary upload failed:', uploadErr);
                }
            }

            // Step 4: Persist to MongoDB
            if (documentId) {
                try {
                    await Document.findOneAndUpdate(
                        { _id: documentId, userId: (req.user as any)._id },
                        { $push: { audioCache: { key: cacheKey, url: audioUrl || '', scriptText: script } } }
                    );
                } catch (dbErr) { console.warn('Failed to persist audio cache:', dbErr); }
            }

            return res.json({ audioUrl, scriptText: script, cached: false });
        } catch (ttsError: any) {
            console.error('TTS failed, falling back to script:', ttsError?.message);
            if (documentId && script) {
                try {
                    await Document.findOneAndUpdate(
                        { _id: documentId, userId: (req.user as any)._id },
                        { $push: { audioCache: { key: cacheKey, url: '', scriptText: script } } }
                    );
                } catch (dbErr) { console.warn('Failed to persist script cache:', dbErr); }
            }
            return res.json({ audioUrl: null, scriptText: script });
        }
    } catch (error: any) {
        console.error('Gemini Audio Error:', error?.message || error);
        if (script) return res.json({ audioUrl: null, scriptText: script });
        sendError(res, error, 'Error generating audio lesson.');
    }
});

// 6. Generate Study Notes
router.post('/notes', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const model = "gemini-3-flash-preview";
    const prompt = `Create extremely detailed, "Exam-Topper" quality study notes for the provided document.
  Goal: The student should be able to get top marks in an exam just by reading these notes.
  Formatting Rules:
  1. NO MARKDOWN SYMBOLS: Do NOT use hashtags (#), asterisks (*), or dashes (-) for formatting.
  2. Clean Text Structure: Use UPPERCASE for Main Section Headings. Use Title Case for Subheadings.
  3. Content Quality: Be exhaustive. Include every definition, formula, date, and key argument. Add "EXAM TIP:" sections where relevant.
  Document content to process:
  ${truncateText(text, 50000)}`;

    try {
        const result = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const response = await client.models.generateContent({ model, contents: prompt });
            return response.text || "";
        });
        res.json({ notes: result });
    } catch (error) {
        console.error("Gemini Notes Error:", error);
        sendError(res, error, 'Error generating notes.');
    }
});

// 7. Generate Important Points
router.post('/important-points', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const model = "gemini-3-flash-preview";
    const prompt = `You are an expert academic analyst.
  Goal: Extract and present the most critical, must-know points from the provided document.
  Format: Return a valid HTML fragment. Use these Tailwind classes:
  - Section Headers: <h3 class="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-8 mb-4 border-b border-indigo-200 dark:border-indigo-700 pb-2">
  - Paragraphs: <p class="text-gray-900 dark:text-gray-100 mb-4 leading-relaxed text-base">
  - Lists: <ul class="list-disc pl-6 space-y-2 mb-4 text-gray-900 dark:text-gray-100">
  - List Items: <li class="pl-1">
  - Key Terms: <span class="font-bold text-black dark:text-white bg-indigo-100 dark:bg-indigo-900/50 px-1 rounded">
  Structure: 1) Core Concepts, 2) Key Facts & Data, 3) Critical Arguments & Conclusions.
  Document Content:
  ${truncateText(text)}`;

    try {
        const result = await geminiManager.callWithFallback(async (client: GoogleGenAI) => {
            const response = await client.models.generateContent({ model, contents: prompt });
            return cleanHTML(response.text || "<p>No content generated.</p>");
        });
        res.json({ importantPoints: result });
    } catch (error) {
        console.error("Gemini Important Points Error:", error);
        sendError(res, error, 'Error generating key points.');
    }
});

export default router;




