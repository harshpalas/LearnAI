import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, FileText, MessageSquare, Layers, Mic, CheckCircle, ArrowRight, Zap, GraduationCap, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors">
      {/* Navbar */}
      <nav className="border-b border-gray-100 dark:border-gray-900 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
            <BrainCircuit className="w-8 h-8" />
            <span>LearnAI</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-medium transition-all text-sm shadow-md shadow-indigo-200 dark:shadow-none"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-full font-medium transition-all text-sm hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-semibold mb-6 border border-indigo-100 dark:border-indigo-800">
            <Zap className="w-4 h-4 fill-current" />
            <span>Powered by Google Gemini AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white">
            Master Any Document <br/> in Minutes.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your PDFs and let our AI turn them into interactive chats, summaries, flashcards, quizzes, and even audio lessons. Study smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 transition-transform hover:-translate-y-1"
            >
              Start Learning for Free
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
               <Globe className="w-5 h-5" />
               View Demo
            </button>
          </div>
        </div>
      </header>
      {/* Features Grid */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to ace your exams</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stop passively reading. Start actively engaging with your study material using our suite of AI tools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={MessageSquare} 
              title="Interactive AI Chat" 
              description="Ask questions about your document and get instant, accurate answers cited directly from the text."
              color="bg-blue-500"
            />
            <FeatureCard 
              icon={FileText} 
              title="Smart Summaries" 
              description="Get comprehensive executive summaries and key takeaways generated instantly from long PDFs."
              color="bg-green-500"
            />
            <FeatureCard 
              icon={Layers} 
              title="Auto-Flashcards" 
              description="Automatically generate flashcards to memorize definitions, dates, and key concepts effortlessly."
              color="bg-purple-500"
            />
             <FeatureCard 
              icon={CheckCircle} 
              title="Custom Quizzes" 
              description="Test your knowledge with AI-generated multiple choice questions tailored to your material."
              color="bg-orange-500"
            />
            <FeatureCard 
              icon={Mic} 
              title="Audio Lessons" 
              description="Turn your PDFs into engaging podcasts or lectures. Listen while you commute or workout."
              color="bg-pink-500"
            />
            <FeatureCard 
              icon={GraduationCap} 
              title="Exam-Ready Notes" 
              description="Generate perfectly formatted, high-quality study notes that highlight exactly what you need for exams."
              color="bg-indigo-500"
            />
          </div>
        </div>
      </section>
      {/* How it Works */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">How LearnAI Works</h2>    
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-200 dark:bg-gray-800 z-0"></div>            
            <Step 
              number="1" 
              title="Upload PDF" 
              description="Simply drag and drop your course material, research paper, or textbook PDF." 
            />
            <Step 
              number="2" 
              title="AI Analysis" 
              description="Gemini AI scans your document in seconds to understand context and key concepts." 
            />
            <Step 
              number="3" 
              title="Start Learning" 
              description="Interact with your document via chat, quizzes, or audio to master the content." 
            />
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 dark:bg-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to transform your learning?</h2>
          <p className="text-indigo-100 text-lg mb-10">
            Join thousands of students and professionals who are saving hours every week.
          </p>
          <button 
             onClick={() => navigate('/login')}
             className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-100 transition-colors"
          >
            Get Started for Free
          </button>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 py-12 border-t dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>LearnAI</span>
          </div>
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} LearnAI Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-indigo-600">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-indigo-600">Terms</a>
            <a href="#" className="text-gray-500 hover:text-indigo-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
const FeatureCard: React.FC<{ icon: any, title: string, description: string, color: string }> = ({ icon: Icon, title, description, color }) => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white mb-6 shadow-md`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </div>
);
const Step: React.FC<{ number: string, title: string, description: string }> = ({ number, title, description }) => (
  <div className="relative z-10 flex flex-col items-center text-center">
    <div className="w-16 h-16 bg-white dark:bg-gray-800 border-4 border-indigo-50 dark:border-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 shadow-lg mb-6">
      {number}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);



