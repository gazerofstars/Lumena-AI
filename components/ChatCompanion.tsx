
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getCompanionResponse, speakText } from '../services/geminiService';
import { playPcmAudio } from '../services/audioUtils';
import { useAccessibility } from './AccessibilityContext';
import { Send, Mic, MicOff, Volume2, Loader } from 'lucide-react';

export const ChatCompanion: React.FC = () => {
  const { settings } = useAccessibility();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Hi there! I am Lumena. How are you feeling right now?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await getCompanionResponse(history, userMsg.text);
      
      let finalResponse = responseText;
      if (responseText === "QUOTA_EXCEEDED") {
          finalResponse = "I'm sorry, I've reached my limit for today! 🛑 You can wait a bit for my energy to recharge, or ask your parent to help me get more energy in the settings.";
      }

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: finalResponse };
      setMessages(prev => [...prev, aiMsg]);

      // Auto-speak if enabled
      if (settings.voiceEnabled && finalResponse && responseText !== "QUOTA_EXCEEDED") {
        const audio = await speakText(finalResponse);
        if (audio) playPcmAudio(audio);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSpeakMessage = async (text: string) => {
      const audio = await speakText(text);
      if (audio) playPcmAudio(audio);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-3xl mx-auto bg-white rounded-t-3xl shadow-xl border border-gray-200 overflow-hidden mt-4">
        
        {/* Header */}
        <div className="bg-lumena-blue p-4 text-center border-b border-blue-100">
            <h2 className="font-bold text-lg text-lumena-dark">Lumena Companion</h2>
            <p className="text-sm opacity-70">Here to listen and help.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-opacity-50 bg-slate-50">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm relative group ${
                        msg.role === 'user' 
                        ? 'bg-lumena-accent text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                        
                        {/* Speak Button for AI messages */}
                        {msg.role === 'model' && (
                            <button 
                                onClick={() => handleSpeakMessage(msg.text)}
                                className="absolute -right-8 top-2 p-1 text-gray-400 hover:text-lumena-accent opacity-0 group-hover:opacity-100 transition"
                            >
                                <Volume2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-full border border-gray-200 focus-within:border-lumena-accent transition">
                <button 
                    onClick={toggleListening}
                    className={`p-3 rounded-full transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:bg-gray-200'}`}
                    title={isListening ? "Stop Listening" : "Tap to Speak"}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isListening ? "Listening..." : "Type your thought here..."}
                    className="flex-1 bg-transparent outline-none px-2"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="p-3 bg-lumena-accent text-white rounded-full hover:bg-blue-400 transition disabled:opacity-50 disabled:hover:bg-lumena-accent"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    </div>
  );
};
