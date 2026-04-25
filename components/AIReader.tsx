
import React, { useState, useRef, useEffect } from 'react';
import { simplifyText, extractTextFromImage, speakText, getWordDefinition, getPhonicsBreakdown } from '../services/geminiService';
import { playFlexibleAudio, PlaybackControl } from '../services/audioUtils';
import { useAccessibility } from './AccessibilityContext';
import { useGamification } from './GamificationContext';
import { Wand2, Upload, Play, Square, Image as ImageIcon, Loader, Trash2, Book, Plus, Volume2, Type, Ear } from 'lucide-react';

interface DefinitionPopup {
    word: string;
    definition: string | null;
    x: number;
    y: number;
    isLoading: boolean;
}

export const AIReader: React.FC = () => {
  const { settings } = useAccessibility();
  const { addToGlossary } = useGamification();
  const [inputText, setInputText] = useState('');
  const [simplifiedText, setSimplifiedText] = useState('');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Audio State
  const [playbackControl, setPlaybackControl] = useState<PlaybackControl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [cachedAudio, setCachedAudio] = useState<Record<string, string>>({}); 

  // Definition Popup State
  const [definitionPopup, setDefinitionPopup] = useState<DefinitionPopup | null>(null);
  const [loadingPhonics, setLoadingPhonics] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textOutputRef = useRef<HTMLDivElement>(null);

  // Update playback rate in real-time when slider changes
  useEffect(() => {
    if (playbackControl && isPlaying) {
        playbackControl.setRate(speechRate);
    }
  }, [speechRate, playbackControl, isPlaying]);

  // Handle Text Selection
  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
        // If clicking outside selection, close popup
        if (definitionPopup) setDefinitionPopup(null);
        return;
    }

    const word = selection.toString().trim();
    // Only process single words (no spaces) to keep it simple, or short phrases
    if (word.split(' ').length > 2) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Relative to viewport, but we might need adjustment if scrolling
    const x = rect.left + window.scrollX + (rect.width / 2);
    const y = rect.bottom + window.scrollY + 10;

    setDefinitionPopup({
        word,
        definition: null,
        x,
        y,
        isLoading: true
    });

    try {
        const def = await getWordDefinition(word);
        setDefinitionPopup(prev => prev ? { ...prev, definition: def, isLoading: false } : null);
    } catch (e) {
        setDefinitionPopup(null);
    }
  };

  const handleAddToGlossary = () => {
      if (definitionPopup && definitionPopup.definition) {
          addToGlossary(definitionPopup.word, definitionPopup.definition);
          setDefinitionPopup(null);
          // Clear selection
          window.getSelection()?.removeAllRanges();
      }
  };

  const handleSimplify = async () => {
    if (!inputText.trim()) return;
    setIsSimplifying(true);
    setDefinitionPopup(null);
    try {
      const result = await simplifyText(inputText);
      setSimplifiedText(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSimplifying(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const extractedText = await extractTextFromImage(base64String, file.type);
        setInputText(extractedText);
      } catch (error) {
        alert("Could not read file. Please try a clear image.");
      } finally {
        setIsSimplifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to play popup audio (words/spelling) without interrupting main flow state too much
  const handlePopupAudio = async (text: string, rate: number = 0.9) => {
      if (playbackControl) playbackControl.stop(); // Stop main text if reading
      
      try {
          const audio = await speakText(text);
          if (audio) {
              await playFlexibleAudio(audio, 24000, rate);
          }
      } catch(e) {
          console.error(e);
      }
  };

  const playWord = () => definitionPopup && handlePopupAudio(definitionPopup.word, 1.0);
  
  const spellWord = () => {
      if (!definitionPopup) return;
      // "C... A... T..."
      const spelled = definitionPopup.word.split('').join('. ');
      handlePopupAudio(spelled, 0.8);
  };

  const soundItOut = async () => {
      if (!definitionPopup || loadingPhonics) return;
      setLoadingPhonics(true);
      try {
        const phonics = await getPhonicsBreakdown(definitionPopup.word);
        await handlePopupAudio(phonics, 0.75); // Slightly slower for phonics
      } catch(e) {
        console.error(e);
      } finally {
        setLoadingPhonics(false);
      }
  };

  const handlePlay = async (textToRead: string) => {
    if (isPlaying && playbackControl) {
        playbackControl.stop();
        setIsPlaying(false);
        setPlaybackControl(null);
        return;
    }

    if (!textToRead) return;
    
    let audioData = cachedAudio[textToRead];

    if (!audioData) {
        setIsGeneratingAudio(true);
        try {
            audioData = (await speakText(textToRead)) || "";
            if (audioData) {
                setCachedAudio(prev => ({ ...prev, [textToRead]: audioData }));
            }
        } catch (e) {
            console.error("TTS Error", e);
        } finally {
            setIsGeneratingAudio(false);
        }
    }

    if (audioData) {
        setIsPlaying(true);
        const control = await playFlexibleAudio(audioData, 24000, speechRate);
        setPlaybackControl(control);
        
        control.onEnded.then(() => {
            setIsPlaying(false);
            setPlaybackControl(null);
        });
    }
  };

  useEffect(() => {
      return () => {
          if (playbackControl) playbackControl.stop();
      };
  }, [playbackControl]);

  const handleClear = () => {
      if (playbackControl) playbackControl.stop();
      setInputText('');
      setSimplifiedText('');
      setIsPlaying(false);
      setPlaybackControl(null);
      setDefinitionPopup(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 space-y-8 animate-fade-in relative">
      
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-lumena-dark font-comic mb-2">AI Magic Reader 🪄</h2>
        <p className="text-xl text-gray-600">Make difficult words easy to understand. <span className="text-lumena-accent font-bold">Highlight a word to define it!</span></p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
        <div className="flex justify-between items-center mb-4">
            <label className="font-bold text-gray-500 uppercase text-sm tracking-wide">Original Text</label>
            <div className="flex gap-2">
                {inputText && (
                    <button 
                        onClick={handleClear}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1 rounded-full transition font-bold text-sm"
                    >
                        <Trash2 size={16} /> Clear
                    </button>
                )}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-lumena-accent hover:bg-blue-50 px-3 py-1 rounded-full transition font-bold text-sm"
                >
                    <Upload size={16} /> Upload Image/File
                </button>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
            />
        </div>

        <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text here, or upload a picture of your notes..."
            className={`w-full h-40 p-4 rounded-xl border-2 border-gray-100 focus:border-lumena-accent outline-none resize-none transition text-lg ${settings.font === 'comic' ? 'font-comic' : settings.font === 'lexend' ? 'font-lexend' : 'font-open'}`}
        />

        <div className="flex justify-end mt-4">
            <button 
                onClick={handleSimplify}
                disabled={!inputText.trim() || isSimplifying}
                className="bg-lumena-accent hover:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
                {isSimplifying ? <Loader className="animate-spin" /> : <Wand2 size={20} />}
                {isSimplifying ? "Simplifying..." : "Simplify Text"}
            </button>
        </div>
      </div>

      {/* Output Section */}
      {(simplifiedText || isSimplifying) && (
        <div className="bg-blue-50 p-8 rounded-3xl shadow-inner border-2 border-blue-100 relative">
           <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
               <h3 className="text-2xl font-bold text-lumena-dark">Simplified Version</h3>
               
               {/* Audio Controls */}
               <div className="flex items-center gap-4 bg-white p-3 rounded-full shadow-sm px-5">
                   <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-gray-400 uppercase">Speed</span>
                       <input 
                         type="range" 
                         min="0.5" 
                         max="2" 
                         step="0.1" 
                         value={speechRate}
                         onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                         className="w-24 accent-lumena-accent cursor-pointer"
                       />
                       <span className="text-xs w-8 font-mono font-bold">{speechRate.toFixed(1)}x</span>
                   </div>
                   <div className="h-6 w-px bg-gray-200"></div>
                   <button 
                        onClick={() => handlePlay(simplifiedText)}
                        disabled={isGeneratingAudio}
                        className={`p-2 rounded-full flex items-center gap-2 px-6 font-bold transition-all ${isPlaying ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-lumena-accent text-white hover:bg-blue-400 hover:scale-105'}`}
                   >
                       {isGeneratingAudio ? (
                           <>
                               <Loader className="animate-spin" size={20} />
                               <span className="text-sm">Loading...</span>
                           </>
                       ) : isPlaying ? (
                           <>
                               <Square size={20} fill="currentColor" />
                               <span className="text-sm">Stop</span>
                           </>
                       ) : (
                           <>
                               <Play size={20} fill="currentColor" />
                               <span className="text-sm">Read Aloud</span>
                           </>
                       )}
                   </button>
               </div>
           </div>

           {isSimplifying ? (
               <div className="h-32 flex flex-col items-center justify-center text-gray-400 gap-3">
                   <Loader className="animate-spin text-lumena-accent" size={32} /> 
                   <span className="font-bold animate-pulse">Working magic...</span>
               </div>
           ) : (
               <div 
                   ref={textOutputRef}
                   onMouseUp={handleTextSelection}
                   className={`text-lg leading-loose text-gray-800 whitespace-pre-wrap p-4 bg-white/50 rounded-xl cursor-text selection:bg-yellow-200 selection:text-black ${settings.font === 'comic' ? 'font-comic' : settings.font === 'lexend' ? 'font-lexend' : 'font-open'}`}
               >
                   {simplifiedText === "QUOTA_EXCEEDED" ? (
                       <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-700">
                           <p className="font-bold mb-1">API Quota Exceeded</p>
                           <p className="text-sm">
                               You've reached the limit for the free tier. 
                               Wait a minute for the limit to reset, or 
                               <a href="https://aistudio.google.com/app/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold ml-1">
                                   set up billing
                               </a> to increase your limits.
                           </p>
                       </div>
                   ) : simplifiedText}
               </div>
           )}
        </div>
      )}

      {/* Definition Popup */}
      {definitionPopup && (
          <div 
              className="absolute z-50 bg-white rounded-xl shadow-2xl p-4 w-72 border border-gray-200 animate-fade-in"
              style={{ top: definitionPopup.y, left: definitionPopup.x, transform: 'translateX(-50%)' }}
          >
              <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-xl text-lumena-accent capitalize">{definitionPopup.word}</h4>
              </div>

              {/* Reading Tools */}
              <div className="flex gap-2 mb-4 justify-between">
                  <button 
                    onClick={playWord} 
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg flex flex-col items-center text-xs font-bold gap-1 transition"
                    title="Read Word"
                  >
                      <Volume2 size={18} /> Say
                  </button>
                  <button 
                    onClick={spellWord} 
                    className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 py-2 rounded-lg flex flex-col items-center text-xs font-bold gap-1 transition"
                    title="Spell Letters"
                  >
                      <Type size={18} /> Spell
                  </button>
                  <button 
                    onClick={soundItOut} 
                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg flex flex-col items-center text-xs font-bold gap-1 transition"
                    title="Phonics Breakdown"
                    disabled={loadingPhonics}
                  >
                      {loadingPhonics ? <Loader size={18} className="animate-spin" /> : <Ear size={18} />} 
                      Sound
                  </button>
              </div>
              
              {definitionPopup.isLoading ? (
                  <div className="flex justify-center p-4">
                      <Loader className="animate-spin text-gray-400" size={20} />
                  </div>
              ) : (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="text-gray-700 leading-relaxed text-sm font-medium">{definitionPopup.definition}</p>
                    </div>
                    <button 
                        onClick={handleAddToGlossary}
                        className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                        <Book size={16} /> Add to Glossary
                    </button>
                  </>
              )}
              {/* Arrow */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-white"></div>
          </div>
      )}

    </div>
  );
};
