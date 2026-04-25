
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Task, StudyLog } from "../types";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

// 1. Generate Prioritized Roadmap from Brain Dump
export const generateRoadmap = async (input: string): Promise<Task[]> => {
  try {
    const ai = getClient();
    
    const prompt = `
      I am a student with dyslexia who feels overwhelmed. Here is a raw list of everything I need to do:
      "${input}"

      Please act as an executive function coach. 
      1. Analyze these tasks.
      2. Sort them by priority (Highest Impact/Urgency first).
      3. Break down any vaguely worded tasks into clearer steps.
      4. Assign a realistic time estimate (in minutes) for each.
      
      Return the response as a JSON array of tasks.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedTime: { type: Type.NUMBER, description: "Time in minutes" },
              completed: { type: Type.BOOLEAN }
            },
            required: ["id", "title", "description", "estimatedTime"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (e) {
    console.error("Roadmap Error:", e);
  }
  return [];
};

// 2. Emotional Support / Chat
export const getCompanionResponse = async (history: {role: string, text: string}[], message: string) => {
  try {
    const ai = getClient();
    
    const systemInstruction = `
      You are Lumena, a supportive, empathetic, and patient AI study companion for a student with dyslexia.
      
      Your Core Rules:
      1. **Simple Language**: Use short sentences and easy words. Avoid metaphors.
      2. **Empathy First**: Validated feelings. If the user is sad, be kind.
      3. **Sensitive Topics**: 
         - If the user mentions **bullying**, **depression**, or **sadness**: Provide very simple, comforting advice. Remind them they are brave. Gently suggest talking to a trusted adult, parent, or teacher.
      4. **Overwhelm & Games**:
         - If the user feels **overwhelmed** or **stressed**: Offer to play a quick, simple game to distract them (like "I Spy", "20 Questions", or "Two Truths and a Lie") OR guide them through a simple breathing exercise (Box Breathing).
      5. **Formatting**: Use bullet points for lists. Keep responses under 60 words unless playing a game.
    `;

    // Map history to API format if needed, but for simple calls we can use chat
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: { systemInstruction },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't think of a response. Can you try again?";
  } catch (e: any) {
    console.error("Companion Error:", e);
    const msg = e.message || String(e);
    if (msg.includes("quota") || msg.includes("limit")) {
        return "QUOTA_EXCEEDED";
    }
    return "I'm having a little trouble thinking right now. Can we try again in a moment?";
  }
};

// 3. Text-to-Speech (TTS)
export const speakText = async (text: string): Promise<string | null> => {
  if (!text || text.trim().length === 0) return null;
  
  try {
    const ai = getClient();
    
    // Sanitize text: remove excessive whitespace, markdown symbols, and limit length
    // 500 errors are often caused by too much text or problematic characters
    const sanitizedText = text
      .trim()
      .replace(/[*_#`~]/g, '') // Remove common markdown formatting
      .replace(/\s+/g, ' ')
      .slice(0, 1000); // Reduced limit for better stability

    const attemptTTS = async (voice: string, retryCount: number = 0): Promise<string | null> => {
      try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: sanitizedText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data in response");
        return base64Audio;
      } catch (e: any) {
        // Only log as warning for first attempts to reduce noise if retries work
        if (retryCount < 2) {
            console.warn(`TTS Attempt ${retryCount + 1} failed (${voice}). Retrying...`);
        } else {
            console.error(`TTS Final Attempt failed (${voice}):`, e);
        }
        
        if (retryCount < 2) {
            // Try different voices in order: Charon (Deep), Puck (Youthful), Zephyr (Soft)
            const voices = ['Charon', 'Puck', 'Zephyr'];
            const nextVoice = voices[retryCount] || 'Zephyr';
            
            await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1)));
            return attemptTTS(nextVoice, retryCount + 1);
        }
        return null;
      }
    };

    // Starting with 'Charon' as it tends to be very stable for long text
    return attemptTTS('Charon');
  } catch (e) {
    console.error("TTS Setup Error:", e);
    return null;
  }
};

// 4. Focus Analysis (Vision)
export const analyzeFocus = async (imageBase64: string): Promise<{status: 'FOCUSED' | 'DISTRACTED' | 'ABSENT', message: string}> => {
    try {
        const ai = getClient();
        
        const prompt = `Analyze student focus in this frame.
          Determine their status:
          - 'ABSENT': No person is visible.
          - 'DISTRACTED': Person is yawning, on phone, eyes closed, or looking away.
          - 'FOCUSED': Person is reading, writing, or looking at screen.
          
          Return JSON with status and 1-sentence message.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING, enum: ['FOCUSED', 'DISTRACTED', 'ABSENT'] },
                        message: { type: Type.STRING }
                    },
                    required: ["status", "message"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
    } catch (e: any) {
        console.error("Vision Error", e);
        const msg = e.message || String(e);
        if (msg.includes("quota") || msg.includes("limit")) {
            return { status: 'FOCUSED', message: "QUOTA_EXCEEDED" };
        }
    }
    
    return { status: 'FOCUSED', message: "Keep up the great work!" };
};

// 5. Simplify Text
export const simplifyText = async (text: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
          Rewrite the following text to be easier to read and understand for someone with dyslexia. 
          - Use simpler words.
          - Break long sentences into shorter ones.
          - Use bullet points if appropriate.
          - Keep the original meaning.
          
          Text to simplify:
          "${text}"
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || "Could not simplify text.";
    } catch (e: any) {
        console.error("Simplification Error:", e);
        const msg = e.message || String(e);
        
        if (msg === "API_KEY_MISSING") {
            return "Error: Gemini API Key is missing. Please set GEMINI_API_KEY in your Vercel environment variables and redeploy.";
        }
        if (msg.includes("API key not valid") || msg.includes("invalid")) {
            return "Error: The Gemini API Key provided is invalid. Please check your settings.";
        }
        if (msg.includes("SAFETY")) {
            return "Error: This content was flagged by safety filters. Please try different text.";
        }
        if (msg.includes("quota") || msg.includes("limit")) {
            return "QUOTA_EXCEEDED";
        }
        
        return `Error simplifying text: ${msg.slice(0, 100)}`;
    }
};

// 6. OCR (Extract Text from Image)
export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = "Extract all readable text from this image. Format it nicely.";
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Flash is good for OCR
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("OCR Error:", e);
        return "Error extracting text from image.";
    }
};

// 7. Generate Study Insights
export const generateStudyInsights = async (logs: StudyLog[]): Promise<string> => {
  try {
    const ai = getClient();
    
    const logSummary = logs.slice(0, 5).map(l => 
      `- ${l.taskTitle}: ${l.durationMinutes} mins, ${l.distractionCount} distractions. Status: ${l.completed ? 'Completed' : 'Not finished'}.`
    ).join('\n');

    const prompt = `
      You are a helpful study coach for a student with dyslexia.
      Here is their recent activity log:
      ${logSummary}

      Based on this data, provide 3 short, personalized, and encouraging tips to help them improve their focus or schedule.
      Talk directly to them. Use simple language. Focus on positives and gentle improvements.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    });
    return response.text || "Keep up the great work! Try shorter sessions with more breaks.";
  } catch (e) {
    console.error("Insights Error:", e);
    return "Great job studying! Remember to take breaks to keep your brain fresh.";
  }
};

// Simple in-memory cache to reduce API calls
const definitionCache: Record<string, string> = {};
const phonicsCache: Record<string, string> = {};

// 8. Get Word Definition (Simple)
export const getWordDefinition = async (word: string): Promise<string> => {
    const lowerWord = word.toLowerCase().trim();
    if (definitionCache[lowerWord]) return definitionCache[lowerWord];

    try {
        const ai = getClient();
        const prompt = `
          Define the word "${word}" in a very simple, easy-to-understand way for a student. 
          Keep the definition under 15 words.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        const definition = response.text?.trim() || "Definition not found.";
        definitionCache[lowerWord] = definition;
        return definition;
    } catch (e) {
        console.error("Definition Error:", e);
        return "Could not load definition.";
    }
};

// 9. Get Phonics Breakdown
export const getPhonicsBreakdown = async (word: string): Promise<string> => {
    const lowerWord = word.toLowerCase().trim();
    if (phonicsCache[lowerWord]) return phonicsCache[lowerWord];

    try {
        const ai = getClient();
        const prompt = `
          Break down the word "${word}" into its distinct phonemes/sounds for a dyslexic student learning to read.
          Write it phonetically so a text-to-speech engine will pronounce the sounds (not letter names).
          Use hyphens to separate sounds.
          Example: "Cat" -> "Kuh - aah - tuh"
          Example: "Phone" -> "Fff - oh - nn"
          Return ONLY the phonetic string.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        const phonics = response.text?.trim() || word.split('').join(' - ');
        phonicsCache[lowerWord] = phonics;
        return phonics;
    } catch (e) {
        console.error("Phonics Error:", e);
        return word.split('').join(' - ');
    }
};
