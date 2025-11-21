
import React, { useState } from 'react';
import { useGamification } from './GamificationContext';
import { View } from '../types';
import { Edit2, Mic, Save, Trophy, Star, Layout, BookOpen, MessageSquare, Zap, Medal, Target, Sun, RotateCw, Sparkles, Settings } from 'lucide-react';

interface HomeProps {
  setView: (view: View) => void;
}

const AVAILABLE_AVATARS = ["🚀", "🦄", "🦁", "🎨", "🐶", "🤖", "🧠", "⭐", "🐯", "🐼"];

const MOTIVATIONAL_QUOTES = [
  "Your speed doesn't matter, forward is forward.",
  "Dyslexia is a different kind of brilliance.",
  "Small steps lead to big adventures.",
  "You are capable of amazing things.",
  "Focus on progress, not perfection.",
  "Your brain is beautiful and unique.",
  "Mistakes are just proof that you are trying.",
  "Dream big, stay focused, make it happen.",
  "You have a superpower the world needs.",
  "Believe in yourself and you will be unstoppable."
];

export const Home: React.FC<HomeProps> = ({ setView }) => {
  const { userProfile, updateProfile, stats } = useGamification();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);
  
  // Randomly select a quote on mount
  const [dailyQuote, setDailyQuote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  const handleRefreshQuote = () => {
    let newQuote = dailyQuote;
    while (newQuote === dailyQuote) {
        newQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    }
    setDailyQuote(newQuote);
  };

  const handleSave = () => {
    updateProfile(editForm);
    setIsEditing(false);
    setShowAvatarPicker(false);
  };

  const handleVoiceInput = (field: keyof typeof editForm) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setEditForm(prev => ({ ...prev, [field]: text }));
    };
    recognition.start();
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-fade-in">
      
      {/* Welcome Section */}
      <div className="text-center py-4">
        <h1 className="text-4xl font-black text-lumena-dark mb-2 font-comic">
          Good Afternoon, <span className="text-lumena-accent">{userProfile.name}!</span>
        </h1>
      </div>

      {/* Profile Card */}
      <div className="bg-yellow-50 rounded-3xl p-8 border-2 border-yellow-200 relative shadow-sm transition-all duration-500">
         {!isEditing && (
             <button 
                onClick={() => { setEditForm(userProfile); setIsEditing(true); }}
                className="absolute top-4 right-4 p-2 text-yellow-600 hover:bg-yellow-100 rounded-full transition"
                title="Edit Profile"
             >
                 <Edit2 size={20} />
             </button>
         )}

         <div className="flex flex-col md:flex-row items-center gap-8">
             {/* Avatar */}
             <div className="relative">
                 <div 
                    onClick={() => isEditing && setShowAvatarPicker(!showAvatarPicker)}
                    className={`w-32 h-32 rounded-full bg-white border-4 border-yellow-300 flex items-center justify-center text-6xl shadow-lg ${isEditing ? 'cursor-pointer hover:scale-105' : ''} transition`}
                 >
                     {isEditing ? editForm.avatar : userProfile.avatar}
                 </div>
                 {showAvatarPicker && isEditing && (
                     <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-3 rounded-xl shadow-xl border border-gray-200 grid grid-cols-5 gap-2 w-64 z-10">
                         {AVAILABLE_AVATARS.map(av => (
                             <button 
                                key={av}
                                onClick={() => { setEditForm(prev => ({...prev, avatar: av})); setShowAvatarPicker(false); }}
                                className="text-2xl p-2 hover:bg-gray-100 rounded-lg"
                             >
                                 {av}
                             </button>
                         ))}
                     </div>
                 )}
             </div>

             {/* Details */}
             <div className="flex-1 text-center md:text-left w-full">
                 {isEditing ? (
                     <div className="space-y-4 max-w-md">
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">My Name</label>
                             <div className="flex gap-2 relative">
                                <input 
                                    type="text" 
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                                    className="w-full p-2 rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-400 outline-none pr-10"
                                />
                                <button onClick={() => handleVoiceInput('name')} className="absolute right-2 top-2 text-gray-400 hover:text-lumena-accent">
                                    <Mic size={18} />
                                </button>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Dyslexic Superpower</label>
                             <div className="flex gap-2 relative">
                                <input 
                                    type="text" 
                                    value={editForm.superpower}
                                    onChange={(e) => setEditForm(prev => ({...prev, superpower: e.target.value}))}
                                    className="w-full p-2 rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-400 outline-none pr-10"
                                />
                                <button onClick={() => handleVoiceInput('superpower')} className="absolute right-2 top-2 text-gray-400 hover:text-lumena-accent">
                                    <Mic size={18} />
                                </button>
                             </div>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">About Me</label>
                            <div className="flex gap-2 relative">
                                <textarea 
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                                    className="w-full p-2 rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-400 outline-none resize-none h-20"
                                />
                                <button onClick={() => handleVoiceInput('bio')} className="absolute right-2 bottom-2 text-gray-400 hover:text-lumena-accent">
                                    <Mic size={18} />
                                </button>
                            </div>
                         </div>
                         <button 
                            onClick={handleSave}
                            className="bg-lumena-dark text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-gray-800 transition"
                         >
                             <Save size={18} /> Save Profile
                         </button>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         {/* Superpower */}
                         <div>
                             <p className="text-xs font-bold text-yellow-600 tracking-wider mb-1 uppercase">My Superpower</p>
                             <h3 className="text-2xl font-bold text-lumena-dark font-comic">"{userProfile.superpower}"</h3>
                         </div>

                         {/* Daily Shine (Random Quote) */}
                         <div className="bg-yellow-100/60 p-4 rounded-2xl border border-yellow-200 relative group">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold text-yellow-700 tracking-wider flex items-center gap-2 uppercase">
                                    <Sparkles size={14} className="text-yellow-600" /> Daily Shine
                                </p>
                                <button 
                                    onClick={handleRefreshQuote}
                                    className="text-yellow-600 hover:bg-yellow-200 p-1 rounded-full transition opacity-0 group-hover:opacity-100"
                                    title="New Quote"
                                >
                                    <RotateCw size={14} />
                                </button>
                            </div>
                            <p className="text-lg text-lumena-dark italic font-medium leading-relaxed">
                                "{dailyQuote}"
                            </p>
                         </div>

                         {/* About Me (User Bio) */}
                         {userProfile.bio && (
                            <div>
                                <p className="text-xs font-bold text-gray-400 tracking-wider mb-1 uppercase">About Me</p>
                                <p className="text-gray-600 leading-relaxed">{userProfile.bio}</p>
                            </div>
                         )}
                     </div>
                 )}
             </div>
         </div>
      </div>

      {/* Stats & Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Points Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
                  <Zap size={32} fill="currentColor" />
              </div>
              <h3 className="text-5xl font-black text-lumena-dark mb-1">{stats.points}</h3>
              <p className="text-gray-500 font-bold uppercase text-sm tracking-wide">Total Points</p>
          </div>

          {/* Badges Collection */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-500" /> Trophy Case
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {stats.badges.map((badge) => (
                      <div key={badge.id} className="flex flex-col items-center text-center group relative">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 ${badge.unlocked ? 'bg-yellow-100 text-yellow-600 rotate-0 shadow-sm scale-100' : 'bg-gray-100 text-gray-300 rotate-12 grayscale scale-90'}`}>
                              {badge.icon === 'star' ? <Star size={24} fill={badge.unlocked ? "currentColor" : "none"} /> :
                               badge.icon === 'zap' ? <Zap size={24} fill={badge.unlocked ? "currentColor" : "none"} /> :
                               badge.icon === 'trophy' ? <Trophy size={24} /> :
                               badge.icon === 'target' ? <Target size={24} /> :
                               badge.icon === 'sun' ? <Sun size={24} /> :
                               <Medal size={24} />}
                          </div>
                          <span className={`text-xs font-bold leading-tight ${badge.unlocked ? 'text-gray-800' : 'text-gray-300'}`}>
                              {badge.name}
                          </span>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-gray-800 text-white text-xs p-2 rounded-lg z-20 pointer-events-none">
                              {badge.description}
                              {!badge.unlocked && <div className="mt-1 text-gray-400">(Locked)</div>}
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <button 
            onClick={() => setView(View.AI_READER)}
            className="group bg-blue-500 hover:bg-blue-400 text-white p-6 rounded-3xl text-left transition-all hover:-translate-y-1 shadow-lg relative overflow-hidden"
          >
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen size={28} />
                </div>
                <h3 className="text-xl font-bold mb-1">AI Reader</h3>
                <p className="text-blue-100 text-xs">Listen to text & files</p>
              </div>
              <div className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
                  →
              </div>
          </button>

          <button 
            onClick={() => setView(View.STUDY)}
            className="group bg-green-500 hover:bg-green-400 text-white p-6 rounded-3xl text-left transition-all hover:-translate-y-1 shadow-lg relative overflow-hidden"
          >
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <Target size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Target size={28} />
                </div>
                <h3 className="text-xl font-bold mb-1">Focused Learning</h3>
                <p className="text-green-100 text-xs">Timer & Motion Exercises</p>
              </div>
               <div className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
                  →
              </div>
          </button>

          <button 
            onClick={() => setView(View.ROADMAP)}
            className="group bg-purple-500 hover:bg-purple-400 text-white p-6 rounded-3xl text-left transition-all hover:-translate-y-1 shadow-lg relative overflow-hidden"
          >
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <Layout size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Layout size={28} />
                </div>
                <h3 className="text-xl font-bold mb-1">My Tasks</h3>
                <p className="text-purple-100 text-xs">Plan & prioritize tasks</p>
              </div>
              <div className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
                  →
              </div>
          </button>

          <button 
            onClick={() => setView(View.SETTINGS)}
            className="group bg-orange-500 hover:bg-orange-400 text-white p-6 rounded-3xl text-left transition-all hover:-translate-y-1 shadow-lg relative overflow-hidden"
          >
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <Settings size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <Settings size={28} />
                </div>
                <h3 className="text-xl font-bold mb-1">Settings</h3>
                <p className="text-orange-100 text-xs">Customize your app</p>
              </div>
               <div className="absolute bottom-4 right-4 bg-white/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
                  →
              </div>
          </button>
      </div>

    </div>
  );
};
