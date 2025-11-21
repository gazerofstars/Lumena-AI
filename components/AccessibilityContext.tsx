
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  font: 'lexend',
  fontSize: 18, // px
  letterSpacing: 0.5, // px
  theme: 'alice-blue',
  voiceEnabled: true,
};

interface AccessContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
  getThemeClasses: () => string;
  getDynamicStyles: () => React.CSSProperties;
}

const AccessibilityContext = createContext<AccessContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  const getThemeClasses = () => {
    let classes = "min-h-screen transition-all duration-500 bg-fixed ";
    
    // Font Family
    if (settings.font === 'lexend') classes += "font-lexend ";
    else if (settings.font === 'comic') classes += "font-comic ";
    else classes += "font-open ";

    // Background & Text Color (Tailwind classes for themes)
    switch (settings.theme) {
      case 'alice-blue':
        classes += "bg-[#F0F8FF] text-slate-900 ";
        break;
      case 'mint-cream':
        classes += "bg-[#F5FFFA] text-slate-900 ";
        break;
      case 'light-yellow':
        classes += "bg-[#FFFFE0] text-slate-900 ";
        break;
      case 'lavender':
        classes += "bg-[#E6E6FA] text-slate-900 ";
        break;
      case 'dark':
        classes += "bg-[#1A202C] text-[#E2E8F0] ";
        break;
      case 'aesthetic-sunset':
        classes += "bg-gradient-to-br from-rose-100 via-orange-50 to-indigo-100 text-slate-900 ";
        break;
      case 'aesthetic-ocean':
        classes += "bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 text-slate-900 ";
        break;
      case 'aesthetic-dream':
        classes += "bg-gradient-to-br from-purple-100 via-pink-50 to-rose-100 text-slate-900 ";
        break;
      default:
        classes += "bg-[#F0F8FF] text-slate-900 ";
    }

    return classes;
  };

  const getDynamicStyles = (): React.CSSProperties => {
    return {
      fontSize: `${settings.fontSize}px`,
      letterSpacing: `${settings.letterSpacing}px`,
      lineHeight: '1.6', // Maintain good readability
    };
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetToDefaults, getThemeClasses, getDynamicStyles }}>
      <div className={getThemeClasses()} style={getDynamicStyles()}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return context;
};
