
import React, { useState } from 'react';
import { AccessibilityProvider } from './components/AccessibilityContext';
import { GamificationProvider, useGamification } from './components/GamificationContext';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Roadmap } from './components/Roadmap';
import { StudySession } from './components/StudySession';
import { ChatCompanion } from './components/ChatCompanion';
import { AIReader } from './components/AIReader';
import { SettingsPage } from './components/SettingsPage';
import { ParentDashboard } from './components/ParentDashboard';
import { BottomNav } from './components/BottomNav';
import { View, Task } from './types';

import { AuthProvider, useAuth } from './components/AuthContext';
import { LogIn } from 'lucide-react';

const AppContent: React.FC = () => {
  const { completeActivity, tasks, setTasks, saveTask } = useGamification();
  const { user, login } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-lumena-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border-4 border-white text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 bg-lumena-blue rounded-full flex items-center justify-center mx-auto text-5xl">
            🌟
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-lumena-dark tracking-tight">Welcome to Lumena</h1>
            <p className="text-gray-500 text-lg">Your dyslexic-friendly study companion. Let's make learning fun and easy!</p>
          </div>
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-lumena-dark text-white py-5 rounded-2xl text-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl"
          >
            <LogIn size={24} /> Get Started with Google
          </button>
          <p className="text-sm text-gray-400">Secure sign-in keeps your progress saved across devices.</p>
        </div>
      </div>
    );
  }

  const startStudySession = (task: Task) => {
    setActiveTask(task);
    setCurrentView(View.STUDY);
  };

  const handleTaskComplete = async (task: Task) => {
    // 1. Update task in Firestore via GamificationContext
    const updatedTask = { ...task, completed: true };
    await saveTask(updatedTask);
    
    setActiveTask(null);
    setCurrentView(View.ROADMAP); // Return to roadmap after completing task
    
    // 2. Award Points
    await completeActivity('task');

    // 3. Trigger Confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Header currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {currentView === View.HOME && (
          <Home setView={setCurrentView} />
        )}

        {currentView === View.AI_READER && (
          <AIReader />
        )}

        {currentView === View.ROADMAP && (
          <Roadmap 
            tasks={tasks} 
            setTasks={setTasks} 
            startStudySession={startStudySession}
            onTaskComplete={handleTaskComplete}
            showConfetti={showConfetti}
          />
        )}
        
        {currentView === View.STUDY && (
          <StudySession 
            activeTask={activeTask} 
            onComplete={handleTaskComplete}
            onBack={() => setCurrentView(View.ROADMAP)}
          />
        )}

        {currentView === View.CHAT && (
          <ChatCompanion />
        )}

        {currentView === View.SETTINGS && (
          <SettingsPage setView={setCurrentView} />
        )}

        {currentView === View.PARENT_DASHBOARD && (
          <ParentDashboard onBack={() => setCurrentView(View.SETTINGS)} />
        )}
      </main>

      <BottomNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <GamificationProvider>
          <AppContent />
        </GamificationProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
