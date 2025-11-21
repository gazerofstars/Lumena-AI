
/**
 * Decodes base64 string to a Uint8Array
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data into an AudioBuffer
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // Convert Uint8Array to Int16Array
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize 16-bit integer to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Interface for controlling active playback
export interface PlaybackControl {
    stop: () => void;
    setRate: (rate: number) => void;
    onEnded: Promise<void>;
}

let globalController: PlaybackControl | null = null;

/**
 * Plays raw PCM audio and returns controls to manipulate it in real-time.
 */
export const playFlexibleAudio = async (base64Audio: string, sampleRate = 24000, initialRate = 1.0): Promise<PlaybackControl> => {
    // Stop any globally playing audio first
    if (globalController) {
        globalController.stop();
        globalController = null;
    }

    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const audioContext = new AudioContextClass({ sampleRate });
    
    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, sampleRate);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = initialRate;
    source.connect(audioContext.destination);
    
    source.start(0);
    
    let isStopped = false;

    const stop = () => {
        if (!isStopped) {
            try { source.stop(); } catch(e) {}
            isStopped = true;
            // Small delay to allow cleanup
            setTimeout(() => {
                if (audioContext.state !== 'closed') {
                    try { audioContext.close(); } catch(e) {}
                }
            }, 100);
            
            if (globalController === controller) {
                globalController = null;
            }
        }
    };

    const setRate = (rate: number) => {
        if (!isStopped) {
            try {
                // AudioParam.value updates happen immediately
                source.playbackRate.value = rate;
            } catch(e) {
                console.warn("Could not set playback rate", e);
            }
        }
    };

    const onEnded = new Promise<void>((resolve) => {
        source.onended = () => {
            if (!isStopped) {
                isStopped = true;
                try { audioContext.close(); } catch(e) {}
                if (globalController === controller) {
                    globalController = null;
                }
            }
            resolve();
        };
    });

    const controller: PlaybackControl = { stop, setRate, onEnded };
    globalController = controller;
    return controller;
};

/**
 * Legacy wrapper for simple playback (waits until finished)
 */
export const playPcmAudio = async (base64Audio: string, sampleRate = 24000, playbackRate = 1.0) => {
  try {
      const control = await playFlexibleAudio(base64Audio, sampleRate, playbackRate);
      return control.onEnded;
  } catch (error) {
    console.error("Error playing audio:", error);
  }
};

export const stopAudio = () => {
    if (globalController) {
        globalController.stop();
        globalController = null;
    }
};

/**
 * Synthesize a simple "Winning" fanfare sound
 */
export const playWinSound = () => {
  const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
  const ctx = new AudioContextClass();
  
  const playNote = (freq: number, time: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
  };

  const now = ctx.currentTime;
  // A simple Major triad arpeggio (C - E - G - C)
  playNote(523.25, now, 0.2);       // C5
  playNote(659.25, now + 0.1, 0.2); // E5
  playNote(783.99, now + 0.2, 0.2); // G5
  playNote(1046.50, now + 0.3, 0.6); // C6
};

/**
 * Synthesize an "Alert/Beep" sound for distraction
 */
export const playAlertSound = () => {
  const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.value = 880; // A5
  osc.type = 'square'; // Harsher sound for alert
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

/**
 * Manager for Synthesized Focus Sounds (White Noise, Rain, etc.)
 */
export class FocusSoundManager {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    if (this.source) {
      try { this.source.stop(); } catch(e) {}
      try { this.source.disconnect(); } catch(e) {}
      this.source = null;
    }
    if (this.gainNode) {
        try { this.gainNode.disconnect(); } catch(e) {}
    }
    if (this.filterNode) {
        try { this.filterNode.disconnect(); } catch(e) {}
    }
  }

  play(type: string) {
    this.initCtx();
    if (!this.ctx) return;
    this.stop(); // Stop any existing sound

    // Create 5 seconds of noise buffer and loop it
    const bufferSize = 5 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate White Noise base
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();

    if (type === 'White Noise') {
       // Simple lowpass to remove extreme harshness
       this.filterNode.type = 'lowpass';
       this.filterNode.frequency.value = 8000;
       this.gainNode.gain.value = 0.02; // Very quiet
    } else if (type === 'Rain') {
       // Pink-ish approximation via LowPass around 400-600Hz
       this.filterNode.type = 'lowpass';
       this.filterNode.frequency.value = 500; 
       this.gainNode.gain.value = 0.08;
    } else if (type === 'Lo-Fi') {
       // Brown Noise equivalent for "Deep Focus"
       // Very low pass filter makes it a deep rumble
       this.filterNode.type = 'lowpass';
       this.filterNode.frequency.value = 150;
       this.gainNode.gain.value = 0.15;
    }

    this.source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.source.start();
  }
}

export const focusSoundManager = new FocusSoundManager();
