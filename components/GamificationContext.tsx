
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserStats, Badge, UserProfile, StudyLog, GlossaryItem } from '../types';

const INITIAL_BADGES: Badge[] = [
  { id: 'first_step', name: 'First Spark', description: 'Complete your first task', icon: 'star', unlocked: false },
  { id: 'on_fire', name: 'On Fire', description: 'Complete 3 tasks in a row', icon: 'zap', unlocked: false },
  { id: 'focus_guru', name: 'Focus Guru', description: 'Earn 500 points', icon: 'trophy', unlocked: false },
  { id: 'early_bird', name: 'Early Bird', description: 'Study in the morning', icon: 'sun', unlocked: false },
  { id: 'exercise_champ', name: 'Mover', description: 'Complete a focus exercise', icon: 'target', unlocked: false },
  { id: 'mission_complete', name: 'Grand Master', description: 'Complete an entire roadmap', icon: 'medal', unlocked: false },
];

const DEFAULT_PROFILE: UserProfile = {
  name: "Superstar",
  avatar: "🚀",
  superpower: "Seeing the Big Picture",
  bio: "One step at a time."
};

interface GamificationContextType {
  stats: UserStats;
  userProfile: UserProfile;
  studyLogs: StudyLog[];
  glossary: GlossaryItem[];
  updateProfile: (profile: Partial<UserProfile>) => void;
  addPoints: (amount: number, reason?: string) => void;
  completeActivity: (type: 'task' | 'exercise' | 'session') => void;
  unlockBadge: (badgeId: string) => void;
  addStudyLog: (log: Omit<StudyLog, 'id'>) => void;
  addToGlossary: (word: string, definition: string) => void;
  removeFromGlossary: (id: string) => void;
  notification: string | null;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    streak: 0,
    tasksCompleted: 0,
    badges: INITIAL_BADGES,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  const unlockBadge = (badgeId: string) => {
    setStats(prev => {
      const badgeIndex = prev.badges.findIndex(b => b.id === badgeId);
      // Check if badge exists and is NOT already unlocked
      if (badgeIndex !== -1 && !prev.badges[badgeIndex].unlocked) {
        const newBadges = [...prev.badges];
        newBadges[badgeIndex] = { 
            ...newBadges[badgeIndex], 
            unlocked: true, 
            unlockedAt: new Date().toISOString() 
        };
        
        setTimeout(() => setNotification(`🏆 Badge Unlocked: ${newBadges[badgeIndex].name}!`), 100);
        
        return { ...prev, badges: newBadges };
      }
      return prev;
    });
  };

  const checkBadges = (currentStats: UserStats) => {
    // First Step
    if (currentStats.tasksCompleted >= 1) unlockBadge('first_step');
    
    // On Fire
    if (currentStats.streak >= 3) unlockBadge('on_fire');
    
    // Focus Guru
    if (currentStats.points >= 500) unlockBadge('focus_guru');

    // Early Bird
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) unlockBadge('early_bird');
  };

  const addPoints = (amount: number) => {
    setStats(prev => {
      const newStats = { ...prev, points: prev.points + amount };
      checkBadges(newStats);
      return newStats;
    });
  };

  const addStudyLog = (log: Omit<StudyLog, 'id'>) => {
    const newLog: StudyLog = { ...log, id: Date.now().toString() };
    setStudyLogs(prev => [newLog, ...prev]);
  };

  const addToGlossary = (word: string, definition: string) => {
    const newItem: GlossaryItem = {
      id: Date.now().toString(),
      word,
      definition,
      dateAdded: new Date().toISOString()
    };
    setGlossary(prev => [newItem, ...prev]);
    setNotification(`📖 Added "${word}" to Glossary`);
  };

  const removeFromGlossary = (id: string) => {
    setGlossary(prev => prev.filter(item => item.id !== id));
  };

  const completeActivity = (type: 'task' | 'exercise' | 'session') => {
    let pointsToAdd = 0;
    let message = '';

    setStats(prev => {
      let newStats = { ...prev };

      if (type === 'task') {
        pointsToAdd = 100;
        message = '+100 Points! Task Complete!';
        newStats.tasksCompleted += 1;
        newStats.streak += 1;
      } else if (type === 'exercise') {
        pointsToAdd = 25;
        message = '+25 Points! Brain Break Complete!';
        // Note: We call checkBadges separately, but for specific triggers:
        if (!prev.badges.find(b => b.id === 'exercise_champ')?.unlocked) {
             setTimeout(() => unlockBadge('exercise_champ'), 100);
        }
      } else if (type === 'session') {
        pointsToAdd = 10;
        message = '+10 Points! Session Active';
      }

      newStats.points += pointsToAdd;
      setNotification(message);
      
      // Check general stats badges
      setTimeout(() => checkBadges(newStats), 0);
      
      return newStats;
    });
  };

  return (
    <GamificationContext.Provider value={{ stats, userProfile, studyLogs, glossary, updateProfile, addPoints, completeActivity, unlockBadge, addStudyLog, addToGlossary, removeFromGlossary, notification }}>
      {children}
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-lumena-dark text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 animate-bounce-in border border-lumena-success">
           <span className="text-xl">🌟</span>
           <span className="font-bold">{notification}</span>
        </div>
      )}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used within GamificationProvider");
  return context;
};
