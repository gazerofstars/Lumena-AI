
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task } from '../types';
import { generateRoadmap, speakText } from '../services/geminiService';
import { playPcmAudio, playWinSound } from '../services/audioUtils';
import { useAccessibility } from './AccessibilityContext';
import { useGamification } from './GamificationContext';
import { Confetti } from './Confetti';
import { Play, Loader, Star, Trophy, Zap, Target, Sun, Medal, Lock, Check, Cloud, TreePine, Gem, Mic, MicOff, RotateCcw, PartyPopper } from 'lucide-react';

interface RoadmapProps {
  setTasks: (tasks: Task[]) => void;
  tasks: Task[];
  startStudySession: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  showConfetti: boolean;
}

export const Roadmap: React.FC<RoadmapProps> = ({ tasks, setTasks, startStudySession, onTaskComplete, showConfetti }) => {
  const { settings } = useAccessibility();
  const { unlockBadge } = useGamification();
  const [brainDump, setBrainDump] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingTaskId, setSpeakingTaskId] = useState<string | null>(null);
  const [showGrandPrizeModal, setShowGrandPrizeModal] = useState(false);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Refs for scrolling
  const taskRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Randomly generate decorative elements for the map background
  const decorations = useMemo(() => {
    return tasks.map((_, i) => ({
        id: i,
        type: i % 3, // 0: Cloud, 1: Tree, 2: Gem
        x: (i % 2 === 0 ? 10 : 80) + (Math.random() * 10 - 5), // Alternating sides
        y: i * 180 + 80 + (Math.random() * 40 - 20),
        scale: 0.6 + Math.random() * 0.4,
        delay: Math.random() * 2
    }));
  }, [tasks.length]);

  // Auto-Scroll and Grand Prize Detection
  useEffect(() => {
    if (tasks.length === 0) return;

    const allComplete = tasks.every(t => t.completed);
    
    if (allComplete) {
        // Trigger Grand Prize Flow
        if (!showGrandPrizeModal) {
            playWinSound();
            setTimeout(() => {
                setShowGrandPrizeModal(true);
                unlockBadge('mission_complete');
            }, 1500); 
        }
    } else {
        // Find the first incomplete task (current level)
        const currentIndex = tasks.findIndex(t => !t.completed);
        
        if (currentIndex !== -1 && taskRefs.current[currentIndex]) {
            // Scroll to the task after a short delay
            setTimeout(() => {
                taskRefs.current[currentIndex]?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 1000);
        }
    }
  }, [tasks, unlockBadge, showGrandPrizeModal]);

  // Play sound when confetti is shown via props (single task completion)
  useEffect(() => {
    if (showConfetti) {
        playWinSound();
    }
  }, [showConfetti]);

  const handleGenerate = async () => {
    if (!brainDump.trim()) return;
    setIsLoading(true);
    try {
      const generatedTasks = await generateRoadmap(brainDump);
      setTasks(generatedTasks);
    } catch (error) {
      alert("Something went wrong generating the plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      // Stop & Process
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        // Wait a moment for the final transcript to settle then generate
        setTimeout(() => {
            if (brainDump.trim().length > 0) {
                handleGenerate();
            }
        }, 800);
      }
    } else {
      // Start Listening
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
             setBrainDump(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleReadTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!settings.voiceEnabled) return;
    setSpeakingTaskId(task.id);
    const text = `Level ${tasks.indexOf(task) + 1}: ${task.title}. ${task.description}`;
    const audioData = await speakText(text);
    if (audioData) {
      await playPcmAudio(audioData);
    }
    setSpeakingTaskId(null);
  };

  const handleQuickComplete = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskComplete(task);
  };

  const handleReset = () => {
      setTasks([]);
      setBrainDump('');
      setShowGrandPrizeModal(false);
  };

  // Input View
  if (tasks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 pb-20">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 text-lumena-dark font-comic">Unclutter Your Mind 🧠</h2>
          <p className="text-xl opacity-80 mb-8 max-w-lg mx-auto leading-relaxed">
            Overwhelmed? Speak or type your tasks below. We'll build your adventure map instantly!
          </p>
          
          <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-lumena-blue max-w-2xl mx-auto relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-lumena-accent to-purple-400"></div>
             
             <div className="relative">
                <textarea
                  className={`w-full h-48 p-4 rounded-xl border border-gray-200 focus:border-lumena-accent focus:ring-2 focus:ring-blue-100 outline-none resize-none text-lg transition-all ${settings.font === 'comic' ? 'font-comic' : settings.font === 'lexend' ? 'font-lexend' : 'font-open'} ${isListening ? 'bg-red-50' : 'bg-white'}`}
                  placeholder={isListening ? "Listening... (Say your tasks!)" : "Example: \n- Math homework due tomorrow\n- Walk the dog\n- Clean my room"}
                  value={brainDump}
                  onChange={(e) => setBrainDump(e.target.value)}
                />
                
                {/* Mic Button */}
                <button 
                    onClick={toggleListening}
                    className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Voice Input"
                >
                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
             </div>

             <div className="mt-6 flex justify-center">
               <button 
                 onClick={handleGenerate}
                 disabled={!brainDump.trim() || isLoading}
                 className="bg-lumena-accent text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 flex items-center gap-3"
               >
                 {isLoading ? <Loader className="animate-spin" /> : <Zap fill="currentColor" />}
                 {isLoading ? "Building Map..." : "Create My Map!"}
               </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Map View
  return (
    <div className="relative min-h-screen pb-20 overflow-x-hidden">
       {showConfetti && <Confetti />}

       {/* Map Header */}
       <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto relative z-10">
           <h2 className="text-3xl font-bold font-comic text-lumena-dark drop-shadow-sm">Adventure Map</h2>
           <button 
               onClick={handleReset}
               className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full shadow-sm backdrop-blur"
           >
               <RotateCcw size={14} /> Start Over
           </button>
       </div>

       {/* World Background */}
       <div className="absolute inset-0 bg-gradient-to-b from-blue-200 via-purple-100 to-green-100 rounded-t-[3rem] pointer-events-none -z-10 opacity-60"></div>
       
       {/* Map Container */}
       <div className="relative max-w-2xl mx-auto py-10">
           
           {/* Winding Path SVG */}
           <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minHeight: `${tasks.length * 200}px` }}>
               {/* Border Path */}
               <path 
                   d={`M 330 0 ${tasks.map((_, i) => {
                       const x = i % 2 === 0 ? 150 : 510;
                       return `C ${330} ${i * 180 + 50}, ${x} ${i * 180 + 50}, ${x} ${i * 180 + 100}`;
                   }).join(' ')}`}
                   fill="none"
                   stroke="white"
                   strokeWidth="30"
                   strokeLinecap="round"
               />
               {/* Inner Path */}
               <path 
                   d={`M 330 0 ${tasks.map((_, i) => {
                       const x = i % 2 === 0 ? 150 : 510;
                       return `C ${330} ${i * 180 + 50}, ${x} ${i * 180 + 50}, ${x} ${i * 180 + 100}`;
                   }).join(' ')}`}
                   fill="none"
                   stroke="#E0E7FF" // Light Indigo
                   strokeWidth="20"
                   strokeDasharray="30 10"
                   strokeLinecap="round"
               />
           </svg>

           {/* Decorations */}
           {decorations.map((deco) => (
               <div 
                   key={deco.id}
                   className="absolute text-lumena-accent opacity-80"
                   style={{ 
                       top: `${deco.y}px`, 
                       left: `${deco.x}%`, 
                       transform: `scale(${deco.scale})`,
                       animation: `float 4s ease-in-out infinite ${deco.delay}s`
                   }}
               >
                   {deco.type === 0 ? <Cloud size={48} fill="white" className="text-blue-200" /> : 
                    deco.type === 1 ? <TreePine size={40} fill="#82E0AA" className="text-green-600" /> : 
                    <Gem size={32} className="text-purple-400" />}
               </div>
           ))}

           {/* Task Nodes */}
           <div className="relative space-y-24">
               {tasks.map((task, index) => {
                   const isLeft = index % 2 === 0;
                   const isActive = !task.completed && (index === 0 || tasks[index - 1].completed);
                   const isLocked = !task.completed && !isActive;

                   return (
                       <div 
                           key={task.id} 
                           ref={el => { 
                               if(el) taskRefs.current[index] = el; 
                               else taskRefs.current[index] = null; 
                           }}
                           className={`flex ${isLeft ? 'justify-start pl-12' : 'justify-end pr-12'} relative`}
                       >
                           {/* Level Card */}
                           <div 
                               className={`
                                   relative group w-64 p-5 rounded-3xl border-4 shadow-xl transition-all duration-500 transform
                                   ${task.completed 
                                       ? 'bg-lumena-success border-green-400 opacity-80 scale-95 grayscale-[30%]' 
                                       : isActive 
                                           ? 'bg-white border-lumena-accent scale-110 z-20 shadow-blue-300/50 animate-pulse-slow' 
                                           : 'bg-gray-100 border-gray-300 opacity-60 scale-90 blur-[1px]'}
                               `}
                           >
                               {/* Header Badge */}
                               <div className="flex justify-between items-center mb-2">
                                   <span className={`font-black text-sm uppercase tracking-wider ${task.completed ? 'text-white' : isActive ? 'text-lumena-accent' : 'text-gray-400'}`}>
                                       Level {index + 1}
                                   </span>
                                   {task.completed ? <Star fill="white" className="text-yellow-300" /> : 
                                    isActive ? <Sun className="text-orange-400 animate-spin-slow" /> : 
                                    <Lock size={16} className="text-gray-400" />}
                               </div>

                               {/* Title */}
                               <h3 className={`font-bold text-lg mb-1 leading-tight ${task.completed ? 'text-white line-through' : 'text-gray-800'}`}>
                                   {task.title}
                               </h3>
                               
                               {/* Description (only if active/completed) */}
                               {!isLocked && (
                                   <p className={`text-xs mb-4 ${task.completed ? 'text-green-100' : 'text-gray-500'}`}>
                                       {task.description}
                                   </p>
                               )}

                               {/* Action Buttons */}
                               {!isLocked && !task.completed && (
                                   <div className="flex gap-2 mt-3">
                                       <button 
                                           onClick={() => startStudySession(task)}
                                           className="flex-1 bg-lumena-accent hover:bg-blue-400 text-white py-2 rounded-xl font-bold shadow-md flex items-center justify-center gap-1 text-sm transition"
                                       >
                                           <Play size={14} fill="currentColor" /> Start
                                       </button>
                                       <button 
                                           onClick={(e) => handleQuickComplete(task, e)}
                                           className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-xl transition border border-green-200"
                                           title="Mark as Done"
                                       >
                                           <Check size={18} />
                                       </button>
                                       <button 
                                           onClick={(e) => handleReadTask(task, e)}
                                           className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-xl transition"
                                           title="Read Aloud"
                                       >
                                           {speakingTaskId === task.id ? <Loader className="animate-spin" size={18} /> : <Target size={18} />}
                                       </button>
                                   </div>
                               )}
                           </div>
                       </div>
                   );
               })}
           </div>
       </div>

       {/* Mission Complete Modal */}
       {showGrandPrizeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center border-4 border-yellow-400 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-50 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-block p-4 rounded-full bg-yellow-100 mb-4 shadow-inner">
                            <Trophy size={64} className="text-yellow-500 animate-bounce" strokeWidth={1.5} />
                        </div>
                        
                        <h2 className="text-4xl font-black text-lumena-dark mb-2 font-comic tracking-tight">MISSION COMPLETE!</h2>
                        <p className="text-xl text-gray-600 mb-8">You conquered the map! Incredible work!</p>
                        
                        <div className="flex flex-col gap-3">
                            <div className="bg-lumena-blue/30 p-4 rounded-xl flex items-center gap-3 border border-blue-100">
                                <Medal className="text-blue-500" size={32} />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-blue-400 uppercase">Badge Unlocked</p>
                                    <p className="font-bold text-lumena-dark">Grand Master</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleReset}
                            className="mt-8 w-full bg-lumena-accent hover:bg-blue-400 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <PartyPopper /> Start New Adventure
                        </button>
                    </div>
                </div>
            </div>
       )}
    </div>
  );
};
