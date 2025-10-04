// Simple sound utilities using Web Audio API

let audioContext = null;

// Initialize audio context (required for user interaction)
const initAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      return false;
    }
  }
  
  // Resume context if it's suspended (required by browser policies)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return true;
};

// Play a bright notification tone
export const playNotificationSound = () => {
  if (!initAudioContext()) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect oscillator to gain to speakers
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set up a bright, pleasant notification tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Bright tone at 800Hz
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1); // Rise to 1000Hz
    
    // Create a quick fade-in and fade-out envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05); // Quick fade in
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15); // Hold
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3); // Fade out
    
    // Play for 300ms
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

// Play a success sound (for accepted invitations, etc.)
export const playSuccessSound = () => {
  if (!initAudioContext()) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant ascending tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
    
  } catch (error) {
    console.warn('Failed to play success sound:', error);
  }
};

// Initialize audio context on first user interaction
export const initSounds = () => {
  initAudioContext();
};