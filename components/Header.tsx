
import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityContext';
import { useGamification } from './GamificationContext';
import { View } from '../types';
import { Settings, BookOpen, MessageSquare, Layout, Volume2, VolumeX, Trophy, Home as HomeIcon, Sparkles, Sun } from 'lucide-react';

interface HeaderProps {
  currentView: View;
  setView: (v: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const { settings, updateSettings } = useAccessibility();
  const { stats } = useGamification();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* Logo Area */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(View.HOME)}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-10 group-hover:opacity-20 transition"></div>
              <Sun size={22} className="text-yellow-100" fill="currentColor" />
          </div>
          <div className="hidden sm:block">
             <h1 className="font-bold text-2xl tracking-tight text-lumena-dark leading-none">Lumena</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex gap-2 bg-gray-50 p-1 rounded-full border border-gray-200 overflow-x-auto">
          <button 
            onClick={() => setView(View.HOME)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition whitespace-nowrap ${currentView === View.HOME ? 'bg-lumena-dark text-white' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <HomeIcon size={18} /> Home
          </button>
          <button 
            onClick={() => setView(View.AI_READER)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition whitespace-nowrap ${currentView === View.AI_READER ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <Sparkles size={18} /> AI Reader
          </button>
          <button 
            onClick={() => setView(View.ROADMAP)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition whitespace-nowrap ${currentView === View.ROADMAP ? 'bg-lumena-accent text-white' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <Layout size={18} /> Roadmap
          </button>
          <button 
            onClick={() => setView(View.STUDY)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition whitespace-nowrap ${currentView === View.STUDY ? 'bg-green-500 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <BookOpen size={18} /> Study
          </button>
          <button 
            onClick={() => setView(View.CHAT)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition whitespace-nowrap ${currentView === View.CHAT ? 'bg-purple-500 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            <MessageSquare size={18} /> Chat
          </button>
        </nav>

        {/* Right Side: Gamification & Settings */}
        <div className="flex items-center gap-3">
            {/* Gamification Pills (Small View) */}
            <div className="flex items-center gap-2 mr-2">
                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full font-bold text-sm border border-yellow-200" title="Total Points">
                    <Trophy size={16} />
                    <span>{stats.points}</span>
                </div>
            </div>

            {/* Settings Toggle */}
            <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                <button 
                    onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                    className={`p-2 rounded-full hover:bg-gray-100 transition ${settings.voiceEnabled ? 'text-lumena-accent' : 'text-gray-400'}`}
                    title="Toggle Voice"
                >
                    {settings.voiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>
                <button 
                    onClick={() => setView(View.SETTINGS)}
                    className={`p-2 rounded-full hover:bg-gray-100 transition ${currentView === View.SETTINGS ? 'text-lumena-accent bg-gray-100' : 'text-gray-600'}`}
                    title="Settings"
                >
                    <Settings size={24} />
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};
