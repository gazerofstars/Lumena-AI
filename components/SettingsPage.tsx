
import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityContext';
import { useGamification } from './GamificationContext';
import { FontType, ThemeType, View } from '../types';
import { useAuth } from './AuthContext';
import { Check, Type, Palette, Monitor, Book, Plus, Trash2, AlertTriangle, RefreshCcw, Sparkles, Shield, LogOut, User } from 'lucide-react';

// Import setView prop to navigate
interface SettingsPageProps {
  setView?: (view: View) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ setView }) => {
  const { settings, updateSettings, resetToDefaults } = useAccessibility();
  const { glossary, addToGlossary, removeFromGlossary, userProfile } = useGamification();
  const { logoutUser, user } = useAuth();

  // Manual Glossary Add State
  const [newWord, setNewWord] = useState('');
  const [newDef, setNewDef] = useState('');

  const solidThemes: { id: ThemeType; name: string; color: string; textColor: string }[] = [
    { id: 'alice-blue', name: 'Alice Blue', color: '#F0F8FF', textColor: '#1A202C' },
    { id: 'mint-cream', name: 'Mint Cream', color: '#F5FFFA', textColor: '#1A202C' },
    { id: 'light-yellow', name: 'Light Yellow', color: '#FFFFE0', textColor: '#1A202C' },
    { id: 'lavender', name: 'Lavender', color: '#E6E6FA', textColor: '#1A202C' },
    { id: 'dark', name: 'Dark Mode', color: '#1A202C', textColor: '#E2E8F0' },
  ];

  const aestheticThemes: { id: ThemeType; name: string; gradient: string; textColor: string }[] = [
    { id: 'aesthetic-sunset', name: 'Sunset Vibe', gradient: 'linear-gradient(135deg, #FFE4E1 0%, #FFF8DC 100%)', textColor: '#1A202C' },
    { id: 'aesthetic-ocean', name: 'Ocean Breeze', gradient: 'linear-gradient(135deg, #E0F7FA 0%, #E8EAF6 100%)', textColor: '#1A202C' },
    { id: 'aesthetic-dream', name: 'Dreamy Pop', gradient: 'linear-gradient(135deg, #F3E5F5 0%, #FCE4EC 100%)', textColor: '#1A202C' },
  ];

  const handleManualAdd = () => {
      if (newWord.trim() && newDef.trim()) {
          addToGlossary(newWord, newDef);
          setNewWord('');
          setNewDef('');
      }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24 animate-fade-in">
      <div className="text-center mb-10">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-lumena-blue rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl">
            {userProfile.avatar}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-lumena-dark font-comic">{userProfile.name}</h2>
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <User size={14} /> {user?.email}
            </p>
          </div>
        </div>
        <h2 className="text-4xl font-bold mb-2 font-comic">App Settings ⚙️</h2>
        <p className="opacity-80 text-lg">Customize Lumena to fit your unique style.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- LEFT COLUMN: VISUALS --- */}
        <div className="space-y-8">
            
            {/* Visual Comfort Section */}
            <div className="bg-white/50 p-8 rounded-3xl border border-gray-200 shadow-sm backdrop-blur-sm">
                <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
                    <Type className="text-lumena-accent" /> Text & Readability
                </h3>
                
                {/* Font Family */}
                <div className="mb-6">
                    <label className="block font-bold mb-3 text-sm uppercase tracking-wider opacity-70">Font Style</label>
                    <div className="flex gap-3">
                        {[
                            { id: 'lexend', label: 'Clean (Lexend)' },
                            { id: 'comic', label: 'Friendly (Comic)' },
                            { id: 'open', label: 'Standard (Open Sans)' }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => updateSettings({ font: f.id as FontType })}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${settings.font === f.id ? 'border-lumena-accent bg-blue-50 text-lumena-accent' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font Size Slider */}
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <label className="font-bold text-sm uppercase tracking-wider opacity-70">Font Size</label>
                        <span className="font-mono font-bold bg-gray-100 px-2 rounded text-sm">{settings.fontSize}px</span>
                    </div>
                    <input 
                        type="range" 
                        min="14" 
                        max="32" 
                        step="1" 
                        value={settings.fontSize}
                        onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lumena-accent"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>14px</span>
                        <span>32px</span>
                    </div>
                </div>

                {/* Letter Spacing Slider */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="font-bold text-sm uppercase tracking-wider opacity-70">Letter Spacing</label>
                        <span className="font-mono font-bold bg-gray-100 px-2 rounded text-sm">{settings.letterSpacing.toFixed(1)}px</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        step="0.1" 
                        value={settings.letterSpacing}
                        onChange={(e) => updateSettings({ letterSpacing: parseFloat(e.target.value) })}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lumena-accent"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Normal</span>
                        <span>Very Wide</span>
                    </div>
                </div>
            </div>

            {/* Theme Section */}
            <div className="bg-white/50 p-8 rounded-3xl border border-gray-200 shadow-sm backdrop-blur-sm">
                <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
                    <Palette className="text-pink-500" /> Color Themes
                </h3>
                
                {/* Solid Colors */}
                <h4 className="font-bold text-sm text-gray-400 uppercase mb-3">Focus Colors</h4>
                <div className="grid grid-cols-1 gap-3 mb-6">
                    {solidThemes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => updateSettings({ theme: theme.id })}
                            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${settings.theme === theme.id ? 'border-lumena-accent scale-105 shadow-md' : 'border-transparent hover:bg-white/60'}`}
                            style={{ backgroundColor: theme.color }}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${settings.theme === theme.id ? 'border-lumena-accent' : 'border-black/10'}`} style={{ backgroundColor: theme.color }}>
                                {settings.theme === theme.id && <Check size={16} className="text-lumena-accent" />}
                            </div>
                            <span className="font-bold" style={{ color: theme.textColor }}>{theme.name}</span>
                        </button>
                    ))}
                </div>

                {/* Aesthetic Gradients */}
                <h4 className="font-bold text-sm text-gray-400 uppercase mb-3 flex items-center gap-2"><Sparkles size={14}/> Aesthetic Vibes</h4>
                <div className="grid grid-cols-1 gap-3">
                    {aestheticThemes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => updateSettings({ theme: theme.id })}
                            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${settings.theme === theme.id ? 'border-lumena-accent scale-105 shadow-md' : 'border-transparent hover:bg-white/60'}`}
                            style={{ background: theme.gradient }}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${settings.theme === theme.id ? 'border-lumena-accent' : 'border-black/10'}`} style={{ background: theme.gradient }}>
                                {settings.theme === theme.id && <Check size={16} className="text-lumena-accent" />}
                            </div>
                            <span className="font-bold" style={{ color: theme.textColor }}>{theme.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Live Preview */}
             <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 opacity-70">
                    <Monitor size={20} />
                    <span className="font-bold uppercase tracking-wider text-sm">Live Preview</span>
                </div>
                <div className={`p-8 rounded-3xl border-2 border-dashed border-gray-300 transition-all duration-300 shadow-sm ${settings.theme === 'dark' ? 'bg-[#1A202C] text-[#E2E8F0]' : 'bg-white/80 backdrop-blur-sm text-slate-800'}`}>
                    <h1 className="font-bold mb-4" style={{ fontSize: '1.5em' }}>The Quick Brown Fox</h1>
                    <p className="mb-4" style={{ lineHeight: '1.6' }}>
                        This is how your text will look across the entire app. 
                        Adjust sliders until words feel steady.
                    </p>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: GLOSSARY & RESET --- */}
        <div className="space-y-8">
             {/* Personal Glossary */}
             <div className="bg-white/50 p-8 rounded-3xl border border-gray-200 shadow-sm backdrop-blur-sm flex-1 flex flex-col">
                <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
                    <Book className="text-yellow-500" /> Personal Glossary
                </h3>
                
                {/* Manual Add Form */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6">
                    <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-3">Add New Word</h4>
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Word (e.g. Metaphor)" 
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-lumena-accent outline-none"
                        />
                        <input 
                            type="text" 
                            placeholder="Simple definition..." 
                            value={newDef}
                            onChange={(e) => setNewDef(e.target.value)}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-lumena-accent outline-none"
                        />
                        <button 
                            onClick={handleManualAdd}
                            disabled={!newWord.trim() || !newDef.trim()}
                            className="w-full bg-lumena-accent text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-400 transition"
                        >
                            <Plus size={16} /> Add to Glossary
                        </button>
                    </div>
                </div>

                {/* Glossary List */}
                <div className="flex-1 overflow-y-auto pr-2 max-h-[400px]">
                    {glossary.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Book size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No words saved yet.</p>
                            <p className="text-sm">Highlight words in AI Reader to add them here!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {glossary.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group relative">
                                    <h4 className="font-bold text-lg text-lumena-dark capitalize">{item.word}</h4>
                                    <p className="text-gray-600 leading-relaxed">{item.definition}</p>
                                    <button 
                                        onClick={() => removeFromGlossary(item.id)}
                                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                        title="Remove"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>

             {/* Danger Zone & Parent Zone */}
             <div className="space-y-4">
                 {/* Parent Zone */}
                 <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-blue-900">Parent Zone</h3>
                            <p className="text-blue-700 text-sm">View progress insights.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setView && setView(View.PARENT_DASHBOARD)}
                        className="w-full bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 py-3 rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-2"
                    >
                        Access Dashboard
                    </button>
                 </div>

                 {/* Reset */}
                 <div className="bg-red-50 p-6 rounded-3xl border border-red-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-red-900">Reset to Default</h3>
                            <p className="text-red-700 text-sm">Restore original look and feel.</p>
                        </div>
                    </div>
                    <button 
                        onClick={resetToDefaults}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 mb-4"
                    >
                        <RefreshCcw size={18} /> Reset Settings
                    </button>

                    <button 
                        onClick={logoutUser}
                        className="w-full bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};
