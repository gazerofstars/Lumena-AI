
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, signInWithGoogle, logout } from '../services/firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
