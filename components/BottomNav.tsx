
import React from 'react';
import { View } from '../types';
import { Home, Sparkles, Layout, BookOpen, MessageSquare } from 'lucide-react';

interface BottomNavProps {
  currentView: View;
  setView: (v: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: View.HOME, icon: Home, label: 'Home' },
    { view: View.AI_READER, icon: Sparkles, label: 'Reader' },
    { view: View.ROADMAP, icon: Layout, label: 'Roadmap' },
    { view: View.STUDY, icon: BookOpen, label: 'Study' },
    { view: View.CHAT, icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-1 z-50 pb-safe">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => setView(item.view)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
            currentView === item.view ? 'text-lumena-accent' : 'text-gray-400'
          }`}
        >
          <item.icon size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
