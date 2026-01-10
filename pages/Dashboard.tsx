import React, { useEffect, useState } from 'react';
import { getDocuments, getQuizAttempts, getActivities } from '../services/storageService';
import { Document, QuizAttempt, ActivityLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Layers, BrainCircuit, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalQuizzes: 0,
    avgScore: 0,
    totalQuestions: 0
  });
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const docs = getDocuments();
    const quizAttempts = getQuizAttempts();
    const activityLogs = getActivities();
    
    const totalScore = quizAttempts.reduce((acc, curr) => acc + curr.score, 0);
    const totalPossible = quizAttempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);

    setStats({
      totalDocs: docs.length,
      totalQuizzes: quizAttempts.length,
      avgScore: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
      totalQuestions: totalPossible
    });
    setAttempts(quizAttempts.slice(0, 5)); // Recent 5
    setActivities(activityLogs);
  }, []);

  const chartData = attempts.map((a, i) => ({
    name: `Quiz ${i + 1}`,
    score: Math.round((a.score / a.totalQuestions) * 100)
  })).reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={FileText} label="Documents" value={stats.totalDocs} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatsCard icon={Layers} label="Quizzes Taken" value={stats.totalQuizzes} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/20" />
        <StatsCard icon={BrainCircuit} label="Avg Score" value={`${stats.avgScore}%`} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-900/20" />
        <StatsCard icon={Activity} label="Questions" value={stats.totalQuestions} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Performance Overview</h2>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} />
                  <YAxis tick={{fontSize: 12, fill: '#6b7280'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    itemStyle={{ color: '#6366f1' }}
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

        {/* Activity Feed */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
          <div className="flex-1 overflow-y-auto max-h-[250px] space-y-4">
            {activities.length > 0 ? (
              activities.map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            ) : (
               <div className="text-gray-400 dark:text-gray-500 text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
    <div className={`p-3 rounded-lg ${bg} ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);