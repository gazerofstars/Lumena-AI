
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '../types';
import { analyzeFocus, speakText, generateStudyInsights } from '../services/geminiService';
import { playPcmAudio, playAlertSound, focusSoundManager, playFlexibleAudio, PlaybackControl } from '../services/audioUtils';
import { useAccessibility } from './AccessibilityContext';
import { useGamification } from './GamificationContext';
import { Play, Pause, RotateCcw, Eye, Check, Loader, AlertCircle, Volume2, StopCircle, Clock, Calendar, Lightbulb, ChevronRight, ArrowLeft, Bell } from 'lucide-react';

interface StudySessionProps {
  activeTask: Task | null;
  onComplete: (task: Task) => void;
  onBack: () => void;
}

// --- Dashboard Component (Activity Log & Insights) ---
const StudyDashboard: React.FC<{ 
  onStartNew: () => void; 
  onBack: () => void 
}> = ({ onStartNew, onBack }) => {
  const { studyLogs } = useGamification();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [playbackControl, setPlaybackControl] = useState<PlaybackControl | null>(null);

  const handleGetInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const text = await generateStudyInsights(studyLogs);
      setInsights(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleReadInsights = async () => {
    if (playbackControl) {
      playbackControl.stop();
      setPlaybackControl(null);
      return;
    }
    if (insights) {
      const audio = await speakText(insights);
      if (audio) {
        const ctrl = await playFlexibleAudio(audio);
        setPlaybackControl(ctrl);
        ctrl.onEnded.then(() => setPlaybackControl(null));
      }
    }
  };

  useEffect(() => {
    return () => { if (playbackControl) playbackControl.stop(); };
  }, [playbackControl]);

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-lumena-dark font-comic">Study Journal</h2>
            <p className="text-gray-500">Track your progress and grow.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Insight Card */}
          <div className="md:col-span-3 bg-gradient-to-r from-lumena-blue to-white p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-lumena-dark">
                      <Lightbulb className="text-yellow-500" fill="currentColor" /> AI-Powered Insights
                  </h3>
                  
                  {!insights ? (
                     <div className="mt-4">
                        <p className="text-gray-600 mb-4 max-w-lg">
                           Get personalized tips based on your recent activity to help improve your focus and schedule.
                        </p>
                        <button 
                          onClick={handleGetInsights}
                          disabled={studyLogs.length === 0 || isLoadingInsights}
                          className="bg-white text-lumena-accent px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition disabled:opacity-50 flex items-center gap-2"
                        >
                           {isLoadingInsights ? <Loader className="animate-spin" size={20} /> : <Lightbulb size={20} />}
                           {isLoadingInsights ? "Analyzing..." : "Get My Tips"}
                        </button>
                     </div>
                  ) : (
                     <div className="mt-4 bg-white/60 p-4 rounded-2xl backdrop-blur-sm">
                        <p className="whitespace-pre-line leading-relaxed text-gray-800 mb-4">
                           {insights}
                        </p>
                        <button 
                          onClick={handleReadInsights}
                          className="flex items-center gap-2 text-lumena-accent font-bold hover:text-blue-600"
                        >
                           {playbackControl ? <StopCircle size={20} /> : <Volume2 size={20} />}
                           {playbackControl ? "Stop Reading" : "Read Aloud"}
                        </button>
                     </div>
                  )}
              </div>
          </div>

          {/* Start New Session Card */}
          <div className="md:col-span-3 bg-green-50 p-4 rounded-3xl border-dashed border-2 border-green-200 flex items-center justify-between hover:bg-green-100 transition cursor-pointer group" onClick={onStartNew}>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition">
                   <Play fill="currentColor" />
                </div>
                <div>
                   <h4 className="font-bold text-lg text-green-900">Start New Session</h4>
                   <p className="text-green-700 text-sm">Focus Timer & Motion Tracking</p>
                </div>
             </div>
             <ChevronRight className="text-green-400" />
          </div>
      </div>

      <h3 className="font-bold text-xl mb-4 text-gray-700">Recent Activity</h3>
      <div className="space-y-4">
         {studyLogs.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 rounded-3xl border border-gray-100">
                <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No sessions yet. Start studying to see your log!</p>
             </div>
         ) : (
             studyLogs.map((log) => (
                 <div key={log.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition">
                     <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.completed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                             {log.completed ? <Check size={20} /> : <Clock size={20} />}
                         </div>
                         <div>
                             <h4 className="font-bold text-gray-800">{log.taskTitle}</h4>
                             <p className="text-xs text-gray-400 flex items-center gap-2">
                                <Calendar size={12} /> {new Date(parseInt(log.id)).toLocaleDateString()} • {log.durationMinutes} mins
                             </p>
                         </div>
                     </div>
                     <div className="text-right">
                         {log.distractionCount > 0 ? (
                            <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-md font-bold">
                                {log.distractionCount} Distractions
                            </span>
                         ) : (
                            <span className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-md font-bold">
                                Perfect Focus
                            </span>
                         )}
                     </div>
                 </div>
             ))
         )}
      </div>
    </div>
  );
};


// --- Active Timer Component ---
const ActiveSession: React.FC<{
  activeTask: Task | null;
  onComplete: (task: Task | null, distractionCount: number, timeSpent: number) => void;
  onExit: (distractionCount: number, timeSpent: number) => void;
}> = ({ activeTask, onComplete, onExit }) => {
  const { settings } = useAccessibility();
  const { completeActivity } = useGamification();
  
  // Timer State
  const [duration, setDuration] = useState(activeTask ? activeTask.estimatedTime : 25);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Focus/Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [focusStatus, setFocusStatus] = useState<'Active' | 'Distracted' | 'Analyzing' | 'Absent'>('Active');
  const [aiMessage, setAiMessage] = useState<string>("Ready to focus? I'm here with you.");
  
  // Modal States
  const [showExercise, setShowExercise] = useState(false);
  const [isDistractedMode, setIsDistractedMode] = useState(false); // "Missing User" Overlay
  const [isUrgentExercise, setIsUrgentExercise] = useState(false); // "Yawning/Distracted" Red Modal
  
  const [distractionCount, setDistractionCount] = useState(0);

  // Sound State
  const [activeSound, setActiveSound] = useState<string | null>(null);

  // Sync timeLeft with duration slider when not active
  useEffect(() => {
    if (!isActive && !isDistractedMode && !showExercise) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isActive, isDistractedMode, showExercise]);

  // Setup Camera on mount
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera permission denied or error", err);
      setAiMessage("Camera unavailable. That's okay, we can still study!");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      // Stop sounds
      focusSoundManager.stop();
    };
  }, []);

  // Timer Interval Logic
  useEffect(() => {
    let interval: any;
    if (isActive && !isDistractedMode && !showExercise) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isDistractedMode, showExercise]);

  // Completion Check Logic
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false);
      triggerExercise(false); // Normal exercise (Green/Blue)
    }
  }, [timeLeft, isActive]);

  const triggerExercise = async (isUrgent: boolean = false, customMessage?: string) => {
    setIsActive(false);
    
    const msg = customMessage || (isUrgent 
        ? "Alert! Focus slipping. Let's do a quick stretch NOW!" 
        : "Great job! Time for a brain break. Let's do a quick stretch.");
    
    setAiMessage(msg);
    setIsUrgentExercise(isUrgent);
    setShowExercise(true);

    if (settings.voiceEnabled) {
        const audio = await speakText(msg);
        if (audio) playPcmAudio(audio);
    }
  };

  const handleExerciseComplete = () => {
    completeActivity('exercise');
    setShowExercise(false);
    setIsUrgentExercise(false);
    setIsActive(true); 
  };

  const calculateTimeSpent = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      return Math.ceil(elapsedSeconds / 60); // Minutes
  };

  const handleTaskCompletion = () => {
    if (!activeTask) {
        completeActivity('session');
    }
    onComplete(activeTask, distractionCount, calculateTimeSpent());
  };

  const handleExit = () => {
      onExit(distractionCount, calculateTimeSpent());
  };

  // Handle "Missing Student" (Red Overlay + Beep)
  const handleMissingStudent = () => {
    setIsActive(false); 
    setIsDistractedMode(true);
    setDistractionCount(prev => prev + 1);
  };

  // Beeping Effect for Missing User OR Urgent Exercise (Yawn)
  useEffect(() => {
      let beepInt: any;
      // Play alert if:
      // 1. User is Missing (DistractedMode)
      // 2. Exercise is shown AND it is urgent (Yawning)
      if (isDistractedMode || (showExercise && isUrgentExercise)) {
          playAlertSound(); 
          beepInt = setInterval(playAlertSound, 2000);
      }
      return () => clearInterval(beepInt);
  }, [isDistractedMode, showExercise, isUrgentExercise]);

  const handleImBack = () => {
      setIsDistractedMode(false);
      setIsActive(true); 
      setFocusStatus('Active');
      setAiMessage("Welcome back! Let's get into the zone.");
      // Trigger an immediate check to confirm presence
      setTimeout(checkFocus, 500); 
  };

  // Focus Check Logic
  const checkFocus = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    
    setFocusStatus('Analyzing');
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Capture frame at a lower resolution for better performance
    const captureWidth = 400;
    const aspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
    canvasRef.current.width = captureWidth;
    canvasRef.current.height = captureWidth / aspectRatio;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Use a lower quality for the JPEG to further reduce size
    const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
    
    try {
        const result = await analyzeFocus(base64Image);
        
        if (result.status === 'ABSENT') {
            setFocusStatus('Absent');
            handleMissingStudent(); // Triggers Red Overlay + Beep
        } else if (result.status === 'DISTRACTED') {
            setFocusStatus('Distracted');
            setDistractionCount(prev => prev + 1);
            // Triggers Red Stretch Modal + Beep
            triggerExercise(true, result.message || "Distraction detected. Quick reset!");
        } else {
            setFocusStatus('Active');
            setAiMessage(result.message);
        }

    } catch (e) {
        setFocusStatus('Active');
    }

  }, [cameraActive]);

  // Check focus every 60 seconds if active and not already interrupted
  useEffect(() => {
    let focusInterval: any;
    if (isActive && cameraActive && !isDistractedMode && !showExercise) {
        focusInterval = setInterval(checkFocus, 60000); 
    }
    return () => clearInterval(focusInterval);
  }, [isActive, cameraActive, checkFocus, isDistractedMode, showExercise]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSound = (sound: string) => {
    if (activeSound === sound) {
        focusSoundManager.stop();
        setActiveSound(null);
    } else {
        focusSoundManager.play(sound);
        setActiveSound(sound);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left: Timer & Controls */}
      <div className="lg:col-span-2 flex flex-col gap-6 relative">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center flex-1 relative overflow-hidden">
          <div className="absolute top-4 left-4 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-500 font-medium">
             {activeTask ? activeTask.title : 'Free Study Session'}
          </div>

          <div className="text-8xl font-bold text-lumena-dark font-mono tracking-widest mb-8">
            {formatTime(timeLeft)}
          </div>
          
          {/* Time Slider */}
          {!isActive && (
              <div className="w-full max-w-md mb-8 px-4">
                  <div className="flex justify-between text-sm text-gray-500 font-bold mb-2">
                      <span>1 min</span>
                      <span>{duration} mins</span>
                      <span>120 mins</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="120" 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lumena-accent"
                  />
              </div>
          )}

          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 ${isActive ? 'bg-yellow-400' : 'bg-lumena-accent'}`}
            >
              {isActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
            </button>
            <button 
              onClick={() => {
                  setIsActive(false);
                  setDuration(activeTask ? activeTask.estimatedTime : 25);
                  setTimeLeft((activeTask ? activeTask.estimatedTime : 25) * 60);
              }}
              className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            >
              <RotateCcw size={28} />
            </button>
          </div>

           {/* AI Message Banner */}
           <div className="bg-blue-50 text-lumena-dark px-6 py-3 rounded-xl text-center border border-blue-100 animate-fade-in max-w-md">
             <span className="mr-2">✨</span> {aiMessage}
           </div>
        </div>

        {/* Distracted Overlay - "I Am Back" (MISSING USER CASE) */}
        {isDistractedMode && (
            <div className="absolute inset-0 z-50 bg-red-500/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-8 text-white animate-pulse">
                <AlertCircle size={80} className="mb-4" />
                <h2 className="text-4xl font-black mb-2">Are you there?</h2>
                <p className="text-xl mb-8 opacity-90">We lost visual contact!</p>
                <button 
                    onClick={handleImBack}
                    className="bg-white text-red-500 px-10 py-6 rounded-2xl font-black text-2xl shadow-xl hover:scale-105 transition transform"
                >
                    I AM BACK! 🚀
                </button>
            </div>
        )}

        {/* Exercise Modal (YAWN / DISTRACTED CASE vs NORMAL) */}
        {showExercise && (
            <div className={`absolute inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 ${isUrgentExercise ? 'bg-red-900/40' : 'bg-black/60'}`}>
                <div className={`bg-white rounded-3xl p-8 max-w-lg text-center animate-bounce-in shadow-2xl border-8 ${isUrgentExercise ? 'border-red-500' : 'border-lumena-accent'}`}>
                    {isUrgentExercise && <div className="flex justify-center mb-2 text-red-500"><Bell className="animate-bounce" size={48} /></div>}
                    
                    <h2 className={`text-3xl font-bold mb-4 ${isUrgentExercise ? 'text-red-600' : 'text-lumena-accent'}`}>
                        {isUrgentExercise ? "WAKE UP! 🚨" : "Time to Move! 🤸"}
                    </h2>
                    
                    <p className="text-xl mb-6 text-gray-600 font-medium">
                        {aiMessage || "Stand up and do 5 jumping jacks or stretch your arms to the sky!"}
                    </p>
                    
                    <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
                        <div className={`h-full animate-pulse w-full origin-left ${isUrgentExercise ? 'bg-red-500' : 'bg-green-400'}`}></div>
                    </div>
                    
                    <button 
                        onClick={handleExerciseComplete}
                        className={`px-8 py-4 rounded-xl font-bold hover:opacity-90 text-lg shadow-lg transform hover:scale-105 transition text-white ${isUrgentExercise ? 'bg-red-500 hover:bg-red-600' : 'bg-lumena-dark'}`}
                    >
                        {isUrgentExercise ? "I'm Awake & Ready!" : "I'm Ready to Continue"}
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Right: Companion View */}
      <div className="flex flex-col gap-4">
        
        {/* Camera Feed */}
        <div className="bg-black rounded-3xl overflow-hidden aspect-video relative shadow-lg group">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-80" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay UI */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md text-xs font-bold text-white ${focusStatus === 'Active' ? 'bg-green-100/30' : (focusStatus === 'Distracted' || focusStatus === 'Absent') ? 'bg-red-500/70' : 'bg-blue-500/50'}`}>
                    {focusStatus === 'Analyzing' ? <Loader className="animate-spin" size={12} /> : <Eye size={12} />}
                    {focusStatus}
                </div>
                {/* Dev Tool: Simulations */}
                <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-2 items-end">
                    <button 
                        onClick={() => triggerExercise(true, "Simulated: Yawning detected! Wake up stretch!")}
                        className="text-xs bg-blue-500/50 px-2 py-1 rounded text-white backdrop-blur-md hover:bg-blue-500 transition"
                    >
                        Simulate Yawn (Red Modal)
                    </button>
                    <button 
                        onClick={handleMissingStudent}
                        className="text-xs bg-red-500/50 px-2 py-1 rounded text-white backdrop-blur-md hover:bg-red-500 transition"
                    >
                        Simulate Missing (Red Overlay)
                    </button>
                </div>
            </div>
        </div>

        {/* Audio Focus */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 flex-1">
            <h3 className="font-bold text-lg mb-4">Focus Sounds</h3>
            <div className="space-y-2">
                {['White Noise', 'Rain', 'Lo-Fi'].map((sound) => (
                    <button 
                        key={sound} 
                        onClick={() => toggleSound(sound)}
                        className={`w-full p-3 text-left rounded-xl transition flex justify-between items-center group ${activeSound === sound ? 'bg-lumena-blue text-lumena-dark border border-blue-200' : 'bg-gray-50 hover:bg-lumena-blue/30 text-gray-600'}`}
                    >
                        <div className="flex items-center gap-3">
                            {activeSound === sound ? <Volume2 size={18} className="animate-pulse text-lumena-accent" /> : <div className="w-[18px]" />}
                            <span>{sound}</span>
                        </div>
                        {activeSound === sound && <StopCircle size={18} className="text-red-400 hover:text-red-600" />}
                        {activeSound !== sound && <Play size={16} className="opacity-0 group-hover:opacity-100 transition text-lumena-accent" />}
                    </button>
                ))}
            </div>
        </div>

        <button 
            onClick={handleTaskCompletion}
            className="w-full py-4 bg-lumena-success text-white rounded-2xl font-bold text-lg shadow-md hover:bg-green-400 transition flex items-center justify-center gap-2"
        >
            <Check size={24} /> Mark Complete
        </button>
        
         <button 
            onClick={handleExit}
            className="w-full py-2 text-gray-400 hover:text-gray-600 font-semibold"
        >
            Exit Session
        </button>

      </div>
    </div>
  );
};

// --- Main Container ---
export const StudySession: React.FC<StudySessionProps> = ({ activeTask, onComplete, onBack }) => {
  const { addStudyLog } = useGamification();
  const [viewMode, setViewMode] = useState<'dashboard' | 'active'>('dashboard');

  // If activeTask is provided (from Roadmap), start immediately
  useEffect(() => {
    if (activeTask) {
      setViewMode('active');
    }
  }, [activeTask]);

  const saveLog = (taskTitle: string, completed: boolean, distractionCount: number, timeSpent: number) => {
    addStudyLog({
      taskTitle,
      durationMinutes: timeSpent,
      timestamp: new Date().toISOString(),
      distractionCount,
      completed
    });
  };

  const handleActiveComplete = (task: Task | null, distractionCount: number, timeSpent: number) => {
    saveLog(task ? task.title : "Free Study Session", true, distractionCount, timeSpent);
    if (task) {
      // If it was a real task, pass it up to App to update Roadmap
      onComplete(task);
    } else {
      // Free session just goes back to dashboard
      setViewMode('dashboard');
    }
  };

  const handleActiveExit = (distractionCount: number, timeSpent: number) => {
    saveLog(activeTask ? activeTask.title : "Free Study Session", false, distractionCount, timeSpent);
    setViewMode('dashboard');
    // Note: We don't call onBack() here because we want to show them the log/dashboard first
  };

  if (viewMode === 'active') {
    return (
      <ActiveSession 
        activeTask={activeTask} 
        onComplete={handleActiveComplete} 
        onExit={handleActiveExit}
      />
    );
  }

  return (
    <StudyDashboard 
      onStartNew={() => setViewMode('active')} 
      onBack={onBack} 
    />
  );
};
