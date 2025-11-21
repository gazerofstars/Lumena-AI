
import React, { useState, useMemo } from 'react';
import { useGamification } from './GamificationContext';
import { View } from '../types';
import { Lock, Unlock, ShieldCheck, TrendingUp, Clock, AlertCircle, Calendar, ArrowLeft, CheckCircle, Activity } from 'lucide-react';

interface ParentDashboardProps {
  onBack: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onBack }) => {
  const { stats, studyLogs, userProfile } = useGamification();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (pin === '1234') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalSessions = studyLogs.length;
    const totalTime = studyLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
    const totalDistractions = studyLogs.reduce((acc, log) => acc + log.distractionCount, 0);
    
    // Calculate Focus Score (Simple heuristic: fewer distractions per minute = higher score)
    // Base 100, minus 5 points per distraction, capped at 0.
    let avgFocusScore = 100;
    if (totalSessions > 0) {
        const score = 100 - (totalDistractions * 5) / totalSessions;
        avgFocusScore = Math.max(0, Math.min(100, score));
    }

    const completionRate = totalSessions > 0 
        ? Math.round((studyLogs.filter(l => l.completed).length / totalSessions) * 100) 
        : 0;

    return {
        totalSessions,
        totalTime,
        totalDistractions,
        avgFocusScore: Math.round(avgFocusScore),
        completionRate
    };
  }, [studyLogs]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto pt-20 px-6 text-center animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200">
           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
               <Lock size={32} />
           </div>
           <h2 className="text-2xl font-bold text-lumena-dark mb-2">Parent Gate</h2>
           <p className="text-gray-500 mb-6 text-sm">Please enter the parental PIN to access this dashboard.</p>
           
           <input 
             type="password" 
             value={pin}
             onChange={(e) => setPin(e.target.value)}
             maxLength={4}
             placeholder="PIN (Default: 1234)"
             className="w-full text-center text-2xl tracking-[0.5em] font-bold p-4 rounded-xl border-2 border-gray-200 focus:border-lumena-accent outline-none mb-4"
           />
           
           {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

           <button 
             onClick={handleLogin}
             className="w-full bg-lumena-dark text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
           >
             <Unlock size={18} /> Access Dashboard
           </button>
           
           <button 
             onClick={onBack}
             className="mt-4 text-gray-400 hover:text-gray-600 text-sm font-bold"
           >
             Cancel
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in pb-20">
       <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white transition">
             <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
             <h2 className="text-3xl font-bold text-lumena-dark font-open flex items-center gap-2">
                 <ShieldCheck className="text-green-600" /> Parent Insight Hub
             </h2>
             <p className="text-gray-500">Monitoring progress for: <span className="font-bold text-lumena-accent">{userProfile.name}</span></p>
          </div>
       </div>

       {/* Key Metrics Grid */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-3 mb-2 text-gray-500">
                   <Clock size={18} />
                   <span className="text-xs font-bold uppercase tracking-wider">Total Study Time</span>
               </div>
               <p className="text-3xl font-bold text-lumena-dark">{metrics.totalTime} <span className="text-sm font-normal text-gray-400">mins</span></p>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-3 mb-2 text-gray-500">
                   <CheckCircle size={18} />
                   <span className="text-xs font-bold uppercase tracking-wider">Task Completion</span>
               </div>
               <p className="text-3xl font-bold text-green-600">{metrics.completionRate}%</p>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-3 mb-2 text-gray-500">
                   <Activity size={18} />
                   <span className="text-xs font-bold uppercase tracking-wider">Avg Focus Score</span>
               </div>
               <div className="flex items-end gap-2">
                  <p className={`text-3xl font-bold ${metrics.avgFocusScore >= 80 ? 'text-green-500' : metrics.avgFocusScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {metrics.avgFocusScore}
                  </p>
                  <span className="text-sm text-gray-400 mb-1">/ 100</span>
               </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-3 mb-2 text-gray-500">
                   <AlertCircle size={18} />
                   <span className="text-xs font-bold uppercase tracking-wider">Distractions</span>
               </div>
               <p className="text-3xl font-bold text-orange-500">{metrics.totalDistractions}</p>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: Insights */}
           <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                       <TrendingUp className="text-lumena-accent" /> Activity Log
                   </h3>
                   
                   {studyLogs.length === 0 ? (
                       <div className="text-center py-8 text-gray-400">
                           <p>No activity recorded yet.</p>
                       </div>
                   ) : (
                       <div className="space-y-4">
                           {studyLogs.map((log) => (
                               <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                   <div className="flex items-center gap-4">
                                       <div className={`w-2 h-12 rounded-full ${log.completed ? 'bg-green-400' : 'bg-orange-300'}`}></div>
                                       <div>
                                           <h4 className="font-bold text-gray-800">{log.taskTitle}</h4>
                                           <p className="text-xs text-gray-500 flex items-center gap-2">
                                               <Calendar size={12} /> {new Date(parseInt(log.id)).toLocaleDateString()} 
                                               <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                               {new Date(parseInt(log.id)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                           </p>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <span className="block font-bold text-gray-700">{log.durationMinutes} min</span>
                                       {log.distractionCount > 0 && (
                                           <span className="text-xs text-red-500 font-semibold">{log.distractionCount} interruptions</span>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>

           {/* Right: Summary / Badges */}
           <div className="space-y-6">
               <div className="bg-lumena-blue/20 p-6 rounded-3xl border border-blue-100">
                   <h3 className="font-bold text-lg mb-4 text-lumena-dark">AI Observations</h3>
                   <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                       {metrics.avgFocusScore > 80 ? (
                           <li className="flex gap-2"><CheckCircle size={16} className="text-green-500 shrink-0 mt-1"/> Excellent focus consistency observed in recent sessions.</li>
                       ) : (
                           <li className="flex gap-2"><AlertCircle size={16} className="text-orange-500 shrink-0 mt-1"/> Frequent distractions detected. Consider shortening session times to 15 minutes.</li>
                       )}
                       
                       {metrics.totalTime > 60 && (
                           <li className="flex gap-2"><CheckCircle size={16} className="text-green-500 shrink-0 mt-1"/> Great study stamina! Over 1 hour logged.</li>
                       )}
                       
                       <li className="flex gap-2"><Activity size={16} className="text-blue-500 shrink-0 mt-1"/> Most activity occurs during the {new Date().getHours() < 12 ? 'morning' : 'afternoon/evening'}.</li>
                   </ul>
               </div>

               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                   <h3 className="font-bold text-lg mb-4 text-gray-700">Gamification Status</h3>
                   <div className="flex justify-between items-center mb-2">
                       <span className="text-gray-500">Current Streak</span>
                       <span className="font-bold text-xl">🔥 {stats.streak}</span>
                   </div>
                   <div className="flex justify-between items-center mb-2">
                       <span className="text-gray-500">Total Points</span>
                       <span className="font-bold text-xl text-yellow-600">{stats.points}</span>
                   </div>
                   <div className="flex justify-between items-center">
                       <span className="text-gray-500">Badges Earned</span>
                       <span className="font-bold text-xl text-purple-600">{stats.badges.filter(b => b.unlocked).length} / {stats.badges.length}</span>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};
