
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

const AppContent: React.FC = () => {
  const { completeActivity } = useGamification();
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const startStudySession = (task: Task) => {
    setActiveTask(task);
    setCurrentView(View.STUDY);
  };

  const handleTaskComplete = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t));
    setActiveTask(null);
    setCurrentView(View.ROADMAP); // Return to roadmap after completing task
    
    // Award Points
    completeActivity('task');

    // Trigger Confetti
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
    <AccessibilityProvider>
      <GamificationProvider>
        <AppContent />
      </GamificationProvider>
    </AccessibilityProvider>
  );
}

export default App;
