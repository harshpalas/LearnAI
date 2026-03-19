import React, { useEffect, useState } from 'react';
import { getDocuments, getQuizAttempts, getActivities } from '../services/storageService';
import { Document, QuizAttempt, ActivityLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Layers, BrainCircuit, Activity, PlusCircle, PlayCircle, FileQuestion } from 'lucide-react';

// --- SUB-COMPONENTS --- //

const StatsCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border dark:border-gray-700 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const PerformanceChart = ({ data }: { data: any[] }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm h-full flex flex-col">
    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Performance</h2>
    <div className="flex-1 min-h-[250px]">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} className="dark:text-gray-400" />
            <YAxis unit="%" tick={{ fontSize: 12, fill: '#6b7280' }} className="dark:text-gray-400" />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', backdropFilter: 'blur(5px)', borderRadius: '8px', border: '1px solid #374151', color: '#fff' }}
              itemStyle={{ color: '#818cf8' }}
              labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
            />
            <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
          No quiz data available yet
        </div>
      )}
    </div>
  </div>
);

const ActivityList = ({ activities }: { activities: ActivityLog[] }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm flex flex-col h-full">
    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
    <div className="flex-1 overflow-y-auto max-h-[250px] space-y-4 pr-2">
      {activities.length > 0 ? (
        activities.map((log) => (
          <div key={log.id} className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-700/50 pb-3 last:border-0 last:pb-0">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.action}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-gray-400 dark:text-gray-500 text-sm">No recent activity</div>
      )}
    </div>
  </div>
);

const QuickActions = () => (
  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm flex flex-col justify-center">
    <h2 className="text-lg font-semibold mb-4 text-indigo-900 dark:text-indigo-100">Quick Actions</h2>
    <div className="space-y-3">
      <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg transition-colors text-sm font-medium">
        <PlusCircle className="w-4 h-4" /> Upload New PDF
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-lg border dark:border-gray-700 transition-colors text-sm font-medium">
          <FileQuestion className="w-4 h-4 text-purple-500" /> New Quiz
        </button>
        <button className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-lg border dark:border-gray-700 transition-colors text-sm font-medium">
          <PlayCircle className="w-4 h-4 text-green-500" /> Audio Gen
        </button>
      </div>
    </div>
  </div>
);

// --- MAIN DASHBOARD COMPONENT --- //

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalDocs: 0, totalQuizzes: 0, avgScore: 0, totalQuestions: 0 });
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Promise.resolve ensures it works even if your functions aren't returning native Promises yet
        const [docs, quizAttempts, activityLogs] = await Promise.all([
          Promise.resolve(getDocuments()),
          Promise.resolve(getQuizAttempts()),
          Promise.resolve(getActivities())
        ]);

        const totalScore = quizAttempts.reduce((acc, curr) => acc + curr.score, 0);
        const totalPossible = quizAttempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);

        setStats({
          totalDocs: docs.length,
          totalQuizzes: quizAttempts.length,
          avgScore: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
          totalQuestions: totalPossible,
        });
        setAttempts(quizAttempts.slice(0, 5));
        setActivities(activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = attempts.map((a, i) => ({
    name: 'Quiz ' + (attempts.length - i),
    score: Math.round((a.score / a.totalQuestions) * 100),
  })).reverse();

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your AI Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={FileText} label="Documents" value={stats.totalDocs} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatsCard icon={Layers} label="Quizzes Taken" value={stats.totalQuizzes} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/20" />
        <StatsCard icon={BrainCircuit} label="Avg Score" value={`${stats.avgScore}%`} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-900/20" />
        <StatsCard icon={Activity} label="Questions" value={stats.totalQuestions} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      {/* Content Grid (Adjusted for the new widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <PerformanceChart data={chartData} />
        </div>

        {/* Right column stacks Activity and Quick Actions */}
        <div className="flex flex-col gap-6">
          <QuickActions />
          <ActivityList activities={activities} />
        </div>

      </div>
    </div>
  );
};