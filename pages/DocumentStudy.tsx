import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, updateDocumentSummary, saveFlashcards, getFlashcards, saveQuizAttempt, updateDocumentNotes } from '../services/storageService';
import { generateSummary, generateFlashcards, generateQuiz, createChatSession, generateExplanation, generateAudioLesson, generateStudyNotes } from '../services/geminiService';
import { Document, ChatMessage, Flashcard, QuizQuestion } from '../types';
import { PDFViewer } from '../components/PDFViewer';
import { MessageSquare, FileText, BrainCircuit, PenTool, Send, Loader2, Sparkles, RefreshCw, Bookmark, Check, X, ArrowLeft, ArrowRight, Layers, Lightbulb, Grid, List, Settings, ExternalLink, BookOpen, Mic, Play, Square, FileEdit, Save, Pause, Headphones, Globe, DownloadCloud, Minimize2, Maximize2 } from 'lucide-react';
import { Chat } from "@google/genai";

type Tab = 'pdf' | 'chat' | 'summary' | 'flashcards' | 'quiz' | 'audio' | 'notes';
type AudioLanguage = 'English' | 'Hinglish';

// Audio decoding utilities
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const DocumentStudy: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('pdf');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Summary State
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Flashcards State
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isCardsLoading, setIsCardsLoading] = useState(false);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]); 
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);

  // Audio Lesson State
  const [audioPages, setAudioPages] = useState<{number: number, content: string}[]>([]);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({}); 
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [activeAudioKey, setActiveAudioKey] = useState<string | null>(null);
  const [audioLanguage, setAudioLanguage] = useState<AudioLanguage>('English');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  // PDF View State
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Notes State
  const [notes, setNotes] = useState('');
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) return;
      
      const foundDoc = await getDocumentById(id);
      if (foundDoc) {
        setDoc(foundDoc);
        if (foundDoc.summary) setSummary(foundDoc.summary);
        if (foundDoc.notes) setNotes(foundDoc.notes);
        setCards(getFlashcards(id));

        if (foundDoc.text) {
          const pageRegex = /--- Page (\d+) ---\n([\s\S]*?)(?=(--- Page \d+ ---|$))/g;
          const pages = [];
          let match;
          while ((match = pageRegex.exec(foundDoc.text)) !== null) {
            pages.push({
              number: parseInt(match[1]),
              content: match[2].trim()
            });
          }
          if (pages.length === 0 && foundDoc.text.trim()) {
             pages.push({ number: 1, content: foundDoc.text });
          }
          setAudioPages(pages);
        }

        const session = createChatSession(foundDoc.text);
        setChatSession(session);
        setChatMessages([{
          id: 'init',
          role: 'model',
          text: `Hello! I'm ready to help you study "${foundDoc.filename}". Ask me anything about the document!`,
          timestamp: Date.now()
        }]);
      } else {
        navigate('/documents');
      }
    };
    
    loadDocument();
    
    return () => {
      stopAudioPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatSession) return;
    
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputMessage,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg.text });
      const modelMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: result.text || "I'm not sure how to answer that.",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Sorry, I encountered an error communicating with Gemini.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!doc) return;
    setIsSummaryLoading(true);
    const text = await generateSummary(doc.text);
    setSummary(text);
    updateDocumentSummary(doc.id, text);
    setIsSummaryLoading(false);
  };

  const handleGenerateFlashcards = async () => {
    if (!doc) return;
    setIsCardsLoading(true);
    const newCards = await generateFlashcards(doc.text);
    if (newCards.length === 0) {
      alert("Failed to generate flashcards. Please try again or check the document content.");
    }
    setCards(newCards);
    setFlippedCards(new Set()); 
    saveFlashcards(doc.id, newCards);
    setIsCardsLoading(false);
  };

  const toggleCardFlip = (cardId: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId);
    } else {
      newFlipped.add(cardId);
    }
    setFlippedCards(newFlipped);
  };

  const handleGenerateQuiz = async () => {
    if (!doc) return;
    setIsQuizLoading(true);
    setShowQuizResults(false);
    setQuizAnswers([]);
    setCurrentQuestionIndex(0);
    const questions = await generateQuiz(doc.text, questionCount);
    if (questions.length === 0) {
      alert("Failed to generate quiz. Please try again or check the document content.");
    }
    setQuizQuestions(questions);
    setIsQuizLoading(false);
  };

  const handleSubmitQuiz = () => {
    if (!doc) return;
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) score++;
    });
    setShowQuizResults(true);
    saveQuizAttempt({
      id: crypto.randomUUID(),
      documentId: doc.id,
      score,
      totalQuestions: quizQuestions.length,
      date: new Date().toISOString()
    });
  };

  const handleRetryQuiz = () => {
     setQuizQuestions([]);
     setQuizAnswers([]);
     setShowQuizResults(false);
     setCurrentQuestionIndex(0);
  };

  const handleGenerateAudio = async (identifier: number | 'summary', content: string) => {
    const key = `${identifier}_${audioLanguage}`;
    if (audioCache[key]) return; 

    setGeneratingKey(key);
    const type = identifier === 'summary' ? 'summary' : 'detail';
    const base64 = await generateAudioLesson(content, audioLanguage, type);
    
    if (base64) {
      setAudioCache(prev => ({ ...prev, [key]: base64 }));
    } 
    setGeneratingKey(null);
  };

  const handleGenerateAll = async () => {
    if (!doc) return;
    setIsGeneratingAll(true);

    // Generate summary, flashcards, quiz, and notes
    await handleGenerateSummary();
    await handleGenerateFlashcards();
    await handleGenerateQuiz();
    await handleGenerateNotes();

    // Generate audio for summary and all pages
    if (!audioCache[`summary_${audioLanguage}`]) {
      await handleGenerateAudio('summary', doc.text);
    }
    for (const page of audioPages) {
      if (!audioCache[`${page.number}_${audioLanguage}`]) {
        await handleGenerateAudio(page.number, page.content);
      }
    }

    setIsGeneratingAll(false);
    alert("All lessons generated successfully!");
  };

  const handlePlayAudio = async (identifier: number | 'summary') => {
    const key = `${identifier}_${audioLanguage}`;
    if (!audioCache[key]) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;

      if (activeAudioKey === key && ctx.state === 'suspended') {
        await ctx.resume();
        setIsPlaying(true);
        return;
      }

      stopAudioPlayback(false); 

      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = await decodeAudioData(decode(audioCache[key]), ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };
      
      source.start();
      audioSourceRef.current = source;
      setActiveAudioKey(key);
      setIsPlaying(true);
    } catch (e) {
      console.error("Audio playback error", e);
      alert("Error playing audio.");
      setIsPlaying(false);
    }
  };

  const handlePauseAudio = async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.suspend();
      setIsPlaying(false);
    }
  };

  const stopAudioPlayback = (resetActive = true) => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    if (resetActive) setActiveAudioKey(null);
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const numChannels = 1;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, 24000); 
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const handleGenerateNotes = async () => {
    if (!doc) return;
    setIsNotesLoading(true);
    const generatedNotes = await generateStudyNotes(doc.text);
    // Ensure we append cleanly if notes exist
    const updatedNotes = notes ? notes + "\n\n" + generatedNotes : generatedNotes;
    setNotes(updatedNotes);
    updateDocumentNotes(doc.id, updatedNotes);
    setIsNotesLoading(false);
  };

  const handleSaveNotes = () => {
    if (!doc) return;
    setSaveStatus('saving');
    updateDocumentNotes(doc.id, notes);
    
    // Simulate short delay for UI feedback
    setTimeout(() => {
        setSaveStatus('saved');
        alert("Notes saved successfully!"); // Explicit user requirement
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  if (!doc) return <div className="p-8 text-center dark:text-gray-200">Loading document...</div>;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'pdf', label: 'Document PDF', icon: BookOpen },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'notes', label: 'Notes', icon: FileEdit },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: BrainCircuit },
    { id: 'audio', label: 'Audio Lesson', icon: Mic },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] gap-4">
      {/* Header with Title and Tabs */}
      <div className="flex flex-col gap-4 border-b dark:border-gray-700 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold truncate max-w-xl flex items-center gap-2 dark:text-gray-100">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {doc.filename}
          </h2>
        </div>
        
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin">
           {tabs.map((t) => {
             const Icon = t.icon;
             return (
               <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === t.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                }`}
               >
                 <Icon className="w-4 h-4" />
                 {t.label}
               </button>
             );
           })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden relative transition-colors`}>
        
        {/* PDF Tab */}
        {activeTab === 'pdf' && (
          <div className={isFullScreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col" : "h-full relative flex flex-col"}>
             {/* Audio Player Overlay */}
             <div className="bg-indigo-50 dark:bg-gray-900 border-b dark:border-gray-700 px-4 py-2 flex items-center justify-between shadow-sm z-10 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="p-1.5 bg-indigo-200 dark:bg-indigo-900/50 rounded-lg text-indigo-700 dark:text-indigo-300">
                     <Headphones className="w-4 h-4" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                         Page {pdfCurrentPage} Explanation ({audioLanguage})
                      </span>
                      {audioCache[`${pdfCurrentPage}_${audioLanguage}`] ? (
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Audio Ready
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          Audio not generated yet
                        </span>
                      )}
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => { stopAudioPlayback(); setAudioLanguage(l => l === 'English' ? 'Hinglish' : 'English'); }}
                    className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
                    title="Switch Language"
                   >
                     {audioLanguage === 'English' ? 'EN' : 'HI'}
                   </button>

                   {audioCache[`${pdfCurrentPage}_${audioLanguage}`] ? (
                      isPlaying && activeAudioKey === `${pdfCurrentPage}_${audioLanguage}` ? (
                         <button 
                          onClick={handlePauseAudio}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors"
                         >
                           <Pause className="w-4 h-4 fill-current" />
                           Pause
                         </button>
                      ) : (
                         <button 
                          onClick={() => handlePlayAudio(pdfCurrentPage)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                         >
                           <Play className="w-4 h-4 fill-current" />
                           Play
                         </button>
                      )
                   ) : (
                      generatingKey === `${pdfCurrentPage}_${audioLanguage}` ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium">
                          <Loader2 className="animate-spin w-3 h-3" />
                          Creating...
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                             const pageContent = audioPages.find(p => p.number === pdfCurrentPage)?.content || "";
                             if(pageContent) handleGenerateAudio(pdfCurrentPage, pageContent);
                             else alert("No text content found for this page.");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Mic className="w-3 h-3" />
                          Generate
                        </button>
                      )
                   )}
                </div>
             </div>

             <div className="relative flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
                <div className="absolute top-3 right-4 z-20">
                  <button 
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="bg-gray-900/80 hover:bg-black text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2 backdrop-blur-sm shadow-sm transition-all"
                  >
                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                  </button>
                </div>
                <PDFViewer dataUrl={doc.dataUrl} onPageChange={setPdfCurrentPage} />
             </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg rounded-bl-none flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Thinking...
                    </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-900">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question about this document..."
                className="flex-1 border dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isChatLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 shadow-sm transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="flex flex-col h-full p-6 overflow-y-auto max-w-4xl mx-auto w-full">
            {summary ? (
              <div className="w-full">
                <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Key Insights & Summary</h3>
                    <button onClick={handleGenerateSummary} className="text-sm flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                </div>
                {/* Updated container to ensure dark mode text color is visible */}
                <div 
                  className="bg-white dark:bg-gray-800 p-8 rounded-xl border dark:border-gray-700 shadow-sm summary-content text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: summary }} 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-16 h-16 text-indigo-100 dark:text-indigo-900/50 mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Summary Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Generate a comprehensive summary of your document using AI.</p>
                <button 
                  onClick={handleGenerateSummary}
                  disabled={isSummaryLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-md transition-all hover:scale-105"
                >
                  {isSummaryLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  Generate AI Summary
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                   <FileEdit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                   Study Notes
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleGenerateNotes} 
                    disabled={isNotesLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium text-sm transition-colors"
                  >
                     {isNotesLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                     Generate/Append AI Notes
                  </button>
                  <button 
                    onClick={handleSaveNotes} 
                    disabled={saveStatus === 'saving'}
                    className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors shadow-sm ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                     {saveStatus === 'saving' ? <Loader2 className="animate-spin w-4 h-4" /> : (saveStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
                     {saveStatus === 'saved' ? 'Saved!' : 'Save Notes'}
                  </button>
                </div>
             </div>
             <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-1">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Start typing your notes here or generate them using AI..."
                  className="w-full h-full resize-none p-6 outline-none text-gray-800 dark:text-gray-100 bg-transparent leading-relaxed rounded-lg font-mono text-sm"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
             </div>
          </div>
        )}

        {/* Audio Lesson Tab */}
        {activeTab === 'audio' && (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
             <div className="p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Headphones className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Detailed Audio Lessons
                     </h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                       Listen to detailed explanations for every page.
                     </p>
                  </div>
                  
                  {/* Language Selector */}
                  <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button
                        onClick={() => { stopAudioPlayback(); setAudioLanguage('English'); }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${audioLanguage === 'English' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                      >
                        <Globe className="w-4 h-4" /> English
                      </button>
                      <button
                        onClick={() => { stopAudioPlayback(); setAudioLanguage('Hinglish'); }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${audioLanguage === 'Hinglish' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                      >
                        <span className="font-bold text-xs">अ/A</span> Hinglish
                      </button>
                  </div>
                </div>
                
                {/* Generate All Button */}
                <div className="flex justify-end">
                   <button 
                     onClick={handleGenerateAll}
                     disabled={isGeneratingAll}
                     className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60"
                   >
                     {isGeneratingAll ? <Loader2 className="animate-spin w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
                     {isGeneratingAll ? `Generating ${audioLanguage} Lessons...` : `Generate All ${audioLanguage} Audio`}
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
               {/* Document Summary Card */}
               <div 
                  className={`bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 flex items-center gap-4 transition-all shadow-sm ${activeAudioKey === `summary_${audioLanguage}` ? 'ring-2 ring-indigo-500 bg-indigo-100/50 dark:bg-indigo-900/40' : ''}`}
               >
                 <div className="h-14 w-14 rounded-full bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center shrink-0 text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-7 h-7" />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">Document Overview</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Listen to a concise {audioLanguage} summary of the entire document. Perfect for a quick start.
                    </p>
                 </div>
                 <div className="shrink-0">
                    {generatingKey === `summary_${audioLanguage}` ? (
                       <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-black/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-900">
                          <Loader2 className="animate-spin w-4 h-4" />
                          Generating...
                       </div>
                    ) : (
                      activeAudioKey === `summary_${audioLanguage}` && isPlaying ? (
                         <button 
                          onClick={handlePauseAudio}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors"
                         >
                           <Pause className="w-5 h-5 fill-current" />
                           Pause
                         </button>
                      ) : (
                        audioCache[`summary_${audioLanguage}`] ? (
                            <button 
                            onClick={() => handlePlayAudio('summary')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-md"
                            >
                            <Play className="w-5 h-5 fill-current" />
                            Play Overview
                            </button>
                        ) : (
                            <button 
                            onClick={() => handleGenerateAudio('summary', doc.text)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg font-medium transition-colors shadow-sm"
                            >
                            <Mic className="w-5 h-5" />
                            Generate Audio
                            </button>
                        )
                      )
                    )}
                 </div>
               </div>

               <div className="flex items-center gap-4 py-2">
                 <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                 <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Page-by-Page Breakdown</span>
                 <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
               </div>

               {/* Page Cards */}
               {audioPages.length > 0 ? (
                 audioPages.map((page) => (
                   <div 
                    key={page.number} 
                    className={`bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 flex items-center gap-4 transition-all shadow-sm ${activeAudioKey === `${page.number}_${audioLanguage}` ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20' : 'hover:border-indigo-300 dark:hover:border-indigo-500'}`}
                   >
                     <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 text-gray-700 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600">
                       {page.number}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Page {page.number} Explanation</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">{page.content.substring(0, 100)}...</p>
                     </div>
                     <div className="shrink-0">
                        {generatingKey === `${page.number}_${audioLanguage}` ? (
                           <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-lg text-sm font-medium">
                              <Loader2 className="animate-spin w-4 h-4" />
                              Generating...
                           </div>
                        ) : (
                          activeAudioKey === `${page.number}_${audioLanguage}` && isPlaying ? (
                             <button 
                              onClick={handlePauseAudio}
                              className="flex items-center gap-2 px-5 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors"
                             >
                               <Pause className="w-5 h-5 fill-current" />
                               Pause
                             </button>
                          ) : (
                            audioCache[`${page.number}_${audioLanguage}`] ? (
                                <button 
                                onClick={() => handlePlayAudio(page.number)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                <Play className="w-5 h-5 fill-current" />
                                Play
                                </button>
                            ) : (
                                <button 
                                onClick={() => handleGenerateAudio(page.number, page.content)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                <Mic className="w-5 h-5" />
                                Generate
                                </button>
                            )
                          )
                        )}
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-12 text-gray-500">
                    <Mic className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>No text content found to generate audio.</p>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* Flashcards Tab */}
        {activeTab === 'flashcards' && (
          <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {cards.length} Flashcards Available
              </h3>
              <button onClick={handleGenerateFlashcards} className="text-sm flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium bg-white dark:bg-gray-800 border dark:border-gray-600 px-3 py-1.5 rounded-md shadow-sm">
                  <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950">
              {cards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card) => {
                      const isFlipped = flippedCards.has(card.id);
                      return (
                      <div 
                        key={card.id} 
                        className="h-72 cursor-pointer perspective-1000 group"
                        onClick={() => toggleCardFlip(card.id)}
                      >
                        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d shadow-sm hover:shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
                          
                          {/* FRONT (Question) */}
                          <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                            <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full mb-4 tracking-wide uppercase">Question</span>
                            <p className="text-gray-800 dark:text-gray-100 font-medium text-lg leading-snug overflow-y-auto max-h-[160px] scrollbar-thin">
                              {card.front}
                            </p>
                            <p className="absolute bottom-6 text-xs text-gray-400 font-medium flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" /> Click to flip
                            </p>
                          </div>

                          {/* BACK (Answer) */}
                          <div 
                            className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-900 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-white rotate-y-180 shadow-md"
                          >
                            <span className="inline-block px-3 py-1 bg-indigo-500/30 text-indigo-100 text-xs font-bold rounded-full mb-4 tracking-wide uppercase">Answer</span>
                            <p className="font-medium text-lg leading-snug overflow-y-auto max-h-[160px] scrollbar-thin">
                              {card.back}
                            </p>
                          </div>

                        </div>
                      </div>
                      );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Layers className="w-16 h-16 text-indigo-100 dark:text-indigo-900/50 mb-6" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Flashcards Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Create flashcards from your document to master key concepts.</p>
                    <button 
                    onClick={handleGenerateFlashcards}
                    disabled={isCardsLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-md transition-all hover:scale-105"
                  >
                    {isCardsLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    Generate Flashcards
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="flex flex-col h-full p-6 overflow-y-auto max-w-4xl mx-auto w-full">
              {quizQuestions.length > 0 ? (
                !showQuizResults ? (
                  <div className="w-full">
                    <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
                          <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm">{quizQuestions.length} Qs</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm" style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-snug">{quizQuestions[currentQuestionIndex].question}</h3>
                      
                      <div className="space-y-4 mb-10">
                        {quizQuestions[currentQuestionIndex].options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[currentQuestionIndex] = idx;
                              setQuizAnswers(newAnswers);
                            }}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all group ${
                              quizAnswers[currentQuestionIndex] === idx 
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                                : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                quizAnswers[currentQuestionIndex] === idx ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-400'
                              }`}>
                                {quizAnswers[currentQuestionIndex] === idx && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                              </div>
                              <span className={`text-lg ${quizAnswers[currentQuestionIndex] === idx ? 'font-medium' : ''}`}>{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                        <button 
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        {currentQuestionIndex < quizQuestions.length - 1 ? (
                            <button 
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                              className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-transform active:scale-95"
                            >
                              Next Question
                            </button>
                        ) : (
                          <button 
                              onClick={handleSubmitQuiz}
                              className="bg-green-600 text-white px-8 py-2.5 rounded-lg hover:bg-green-700 font-medium shadow-md transition-transform active:scale-95 flex items-center gap-2"
                            >
                              Submit Quiz <Check className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-8">
                      <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <div className="inline-flex p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mb-4">
                           <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">You scored <span className="text-indigo-600 dark:text-indigo-400 font-bold">{quizQuestions.filter((q, i) => q.correctAnswer === quizAnswers[i]).length}</span> out of <span className="font-bold">{quizQuestions.length}</span></p>
                        
                        <div className="flex justify-center">
                          <button onClick={handleRetryQuiz} className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors">
                            Review Results Below
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {quizQuestions.map((q, i) => (
                          <div key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm">
                              <div className="flex gap-3 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-sm">{i + 1}</span>
                                <p className="font-semibold text-lg text-gray-900 dark:text-white pt-0.5">{q.question}</p>
                              </div>
                              
                              <div className="space-y-2.5 ml-11">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = quizAnswers[i] === optIdx;
                                  const isCorrect = q.correctAnswer === optIdx;
                                  let style = "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300";
                                  let icon = null;
                                  
                                  if (isCorrect) {
                                    style = "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 font-medium ring-1 ring-green-200 dark:ring-green-800";
                                    icon = <Check className="w-5 h-5 text-green-600 dark:text-green-400" />;
                                  } else if (isSelected && !isCorrect) {
                                    style = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800";
                                    icon = <X className="w-5 h-5 text-red-600 dark:text-red-400" />;
                                  }

                                  return (
                                    <div key={optIdx} className={`p-4 rounded-lg border flex justify-between items-center ${style}`}>
                                      <span>{opt}</span>
                                      {icon}
                                    </div>
                                  )
                                })}
                              </div>
                              
                              <div className="mt-5 ml-11 p-5 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-4">
                                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg h-fit">
                                  <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                                    <span className="font-bold block text-blue-700 dark:text-blue-300 mb-1 uppercase text-xs tracking-wider">Explanation</span>
                                    {q.explanation}
                                </div>
                              </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="sticky bottom-4 z-10 flex justify-center">
                         <button onClick={handleRetryQuiz} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all">
                            Start A New Quiz
                         </button>
                      </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-full mb-6">
                      <BrainCircuit className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">AI Quiz Generator</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md text-lg">Challenge yourself! Select the number of questions and let our AI create a custom quiz from your document.</p>
                    
                    <div className="flex items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-3 rounded-xl border dark:border-gray-700 shadow-sm">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 uppercase tracking-wide">Number of Questions:</span>
                      <div className="flex gap-2">
                        {[5, 10, 15, 20].map(count => (
                          <button
                            key={count}
                            onClick={() => setQuestionCount(count)}
                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                              questionCount === count 
                                ? 'bg-indigo-600 text-white shadow-md scale-105' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                    onClick={handleGenerateQuiz}
                    disabled={isQuizLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl flex items-center gap-3 disabled:opacity-50 text-lg font-bold shadow-lg transition-transform hover:-translate-y-1 active:scale-95"
                  >
                    {isQuizLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    {isQuizLoading ? 'Generating Questions...' : `Generate ${questionCount} Questions`}
                  </button>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
