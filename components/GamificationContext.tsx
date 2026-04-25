
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserStats, Badge, UserProfile, StudyLog, GlossaryItem, Task } from '../types';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

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
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addPoints: (amount: number, reason?: string) => void;
  completeActivity: (type: 'task' | 'exercise' | 'session') => void;
  unlockBadge: (badgeId: string) => void;
  addStudyLog: (log: Omit<StudyLog, 'id'>) => void;
  addToGlossary: (word: string, definition: string) => void;
  removeFromGlossary: (id: string) => void;
  saveTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  notification: string | null;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    streak: 0,
    tasksCompleted: 0,
    badges: INITIAL_BADGES,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      // Reset state on logout
      setStats({ points: 0, streak: 0, tasksCompleted: 0, badges: INITIAL_BADGES });
      setUserProfile(DEFAULT_PROFILE);
      setStudyLogs([]);
      setGlossary([]);
      setTasks([]);
      return;
    }

    // 1. Sync User Profile & Stats
    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.points !== undefined) {
          setStats({
            points: data.points || 0,
            streak: data.streak || 0,
            tasksCompleted: data.tasksCompleted || 0,
            badges: data.badges || INITIAL_BADGES
          });
        }
        setUserProfile({
          name: data.name || DEFAULT_PROFILE.name,
          avatar: data.avatar || DEFAULT_PROFILE.avatar,
          superpower: data.superpower || DEFAULT_PROFILE.superpower,
          bio: data.bio || DEFAULT_PROFILE.bio
        });
      } else {
        // Initialize user doc if it doesn't exist
        setDoc(userRef, {
          uid: user.uid,
          ...DEFAULT_PROFILE,
          points: 0,
          streak: 0,
          tasksCompleted: 0,
          badges: INITIAL_BADGES
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    // 2. Sync Tasks
    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const taskList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskList);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/tasks`));

    // 3. Sync Study Logs
    const logsRef = collection(db, 'users', user.uid, 'studyLogs');
    const qLogs = query(logsRef, orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyLog));
      setStudyLogs(logs);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/studyLogs`));

    // 4. Sync Glossary
    const glossaryRef = collection(db, 'users', user.uid, 'glossary');
    const qGlossary = query(glossaryRef, orderBy('dateAdded', 'desc'));
    const unsubGlossary = onSnapshot(qGlossary, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlossaryItem));
      setGlossary(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/glossary`));

    return () => {
      unsubUser();
      unsubTasks();
      unsubLogs();
      unsubGlossary();
    };
  }, [user]);

  // Actions
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const unlockBadge = async (badgeId: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    
    // We need current badges to update properly
    const newBadges = [...stats.badges];
    const badgeIndex = newBadges.findIndex(b => b.id === badgeId);
    
    if (badgeIndex !== -1 && !newBadges[badgeIndex].unlocked) {
      newBadges[badgeIndex] = { 
          ...newBadges[badgeIndex], 
          unlocked: true, 
          unlockedAt: new Date().toISOString() 
      };
      
      setNotification(`🏆 Badge Unlocked: ${newBadges[badgeIndex].name}!`);
      
      try {
        await updateDoc(userRef, { badges: newBadges });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const checkBadges = (currentStats: UserStats) => {
    if (currentStats.tasksCompleted >= 1) unlockBadge('first_step');
    if (currentStats.streak >= 3) unlockBadge('on_fire');
    if (currentStats.points >= 500) unlockBadge('focus_guru');
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) unlockBadge('early_bird');
  };

  const addPoints = async (amount: number) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const newPoints = stats.points + amount;
    try {
      await updateDoc(userRef, { points: newPoints });
      checkBadges({ ...stats, points: newPoints });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addStudyLog = async (log: Omit<StudyLog, 'id'>) => {
    if (!user) return;
    const logsRef = collection(db, 'users', user.uid, 'studyLogs');
    try {
      await addDoc(logsRef, { ...log, timestamp: new Date().toISOString() });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/studyLogs`);
    }
  };

  const addToGlossary = async (word: string, definition: string) => {
    if (!user) return;
    const glossaryRef = collection(db, 'users', user.uid, 'glossary');
    try {
      await addDoc(glossaryRef, {
        word,
        definition,
        dateAdded: new Date().toISOString()
      });
      setNotification(`📖 Added "${word}" to Glossary`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/glossary`);
    }
  };

  const removeFromGlossary = async (id: string) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'glossary', id);
    try {
      await deleteDoc(itemRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/glossary/${id}`);
    }
  };

  const saveTask = async (task: Task) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
    try {
      await setDoc(taskRef, task);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/tasks/${task.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    try {
      await deleteDoc(taskRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/tasks/${taskId}`);
    }
  };

  const completeActivity = async (type: 'task' | 'exercise' | 'session') => {
    if (!user) return;
    let pointsToAdd = 0;
    let message = '';
    const userRef = doc(db, 'users', user.uid);

    let updates: any = {};

    if (type === 'task') {
      pointsToAdd = 100;
      message = '+100 Points! Task Complete!';
      updates.tasksCompleted = stats.tasksCompleted + 1;
      updates.streak = stats.streak + 1;
    } else if (type === 'exercise') {
      pointsToAdd = 25;
      message = '+25 Points! Brain Break Complete!';
      if (!stats.badges.find(b => b.id === 'exercise_champ')?.unlocked) {
           setTimeout(() => unlockBadge('exercise_champ'), 100);
      }
    } else if (type === 'session') {
      pointsToAdd = 10;
      message = '+10 Points! Session Active';
    }

    updates.points = stats.points + pointsToAdd;
    setNotification(message);
    
    try {
      await updateDoc(userRef, updates);
      checkBadges({ ...stats, ...updates });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <GamificationContext.Provider value={{ 
      stats, 
      userProfile, 
      studyLogs, 
      glossary, 
      tasks,
      setTasks: (taskList) => {
        setTasks(taskList);
        // Persist batch? Usually generateRoadmap will replace the whole list.
        // For simplicity, we'll assume the caller saves individual tasks or we handle batching here.
      },
      updateProfile, 
      addPoints, 
      completeActivity, 
      unlockBadge, 
      addStudyLog, 
      addToGlossary, 
      removeFromGlossary,
      saveTask,
      deleteTask,
      notification 
    }}>
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
