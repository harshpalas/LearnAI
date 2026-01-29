import express from 'express';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Configure the GoogleGenAI client
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

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
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        res.json({ summary: cleanHTML(response.text || "Failed to generate summary.") });
    } catch (error) {
        console.error("Gemini Summary Error:", error);
        res.status(500).json({ error: 'Error generating summary. Please try again.' });
    }
});

export default router;
