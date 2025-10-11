// Sound utilities using Web Audio API and HTML5 Audio
import soundMappings from '../data/soundMappings.json';
import movementSounds from '../data/movementSounds.json';

let audioContext = null;
let audioCache = new Map();
let soundSettings = soundMappings.soundSettings;

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

// Load and cache an audio file
const loadAudioFile = async (filename) => {
  if (audioCache.has(filename)) {
    return audioCache.get(filename);
  }

  try {
    const audio = new Audio(`/sounds/combat/${filename}`);
    audio.preload = 'auto';
    audio.volume = soundSettings.volume;
    
    // Wait for the audio to be loaded
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve);
      audio.addEventListener('error', reject);
      audio.load();
    });
    
    audioCache.set(filename, audio);
    return audio;
  } catch (error) {
    console.warn(`Failed to load audio file: ${filename}`, error);
    return null;
  }
};

// Play an MP3 sound file
const playAudioFile = async (filename) => {
  if (!soundSettings.enabled) return;
  
  try {
    const audio = await loadAudioFile(filename);
    if (!audio) return;
    
    // Clone the audio to allow overlapping sounds
    const audioClone = audio.cloneNode();
    audioClone.volume = soundSettings.volume;
    
    // Set up fade in if configured
    if (soundSettings.fadeInDuration > 0) {
      audioClone.volume = 0;
      audioClone.play();
      
      const fadeInterval = setInterval(() => {
        if (audioClone.volume < soundSettings.volume) {
          audioClone.volume = Math.min(audioClone.volume + 0.1, soundSettings.volume);
        } else {
          clearInterval(fadeInterval);
        }
      }, soundSettings.fadeInDuration * 100);
    } else {
      audioClone.play();
    }
    
    // Clean up after playback
    audioClone.addEventListener('ended', () => {
      audioClone.remove();
    });
    
  } catch (error) {
    console.warn(`Failed to play audio file: ${filename}`, error);
  }
};

// Get combat sound for a specific unit
export const getCombatSound = (unitClass, unitId, armyId) => {
  console.log('🔊 getCombatSound debug:', { unitClass, unitId, armyId });
  
  // Check for special unit override first
  if (soundMappings.combatSounds.specialUnits[unitId]) {
    const sound = soundMappings.combatSounds.specialUnits[unitId];
    console.log('🔊 Using special unit sound:', sound);
    return sound;
  }
  
  // Check for army-specific class mapping
  if (soundMappings.combatSounds.byClass[unitClass] && 
      soundMappings.combatSounds.byClass[unitClass][armyId]) {
    const sound = soundMappings.combatSounds.byClass[unitClass][armyId];
    console.log('🔊 Using army-specific class sound:', sound);
    return sound;
  }
  
  // Fall back to default class mapping
  if (soundMappings.combatSounds.byClass[unitClass] && 
      soundMappings.combatSounds.byClass[unitClass].default) {
    const sound = soundMappings.combatSounds.byClass[unitClass].default;
    console.log('🔊 Using default class sound:', sound);
    return sound;
  }
  
  // Final fallback to army theme
  const sound = soundMappings.armyThemes[armyId] || soundMappings.armyThemes.default;
  console.log('🔊 Using army theme fallback sound:', sound);
  return sound;
};

// Get movement sound for a specific unit
export const getMovementSound = (unitClass, unitId, armyId) => {
  console.log('🚶 getMovementSound debug:', { unitClass, unitId, armyId });
  
  // Check for special unit override first
  if (movementSounds.movementSounds.specialUnits[unitId]) {
    const sound = movementSounds.movementSounds.specialUnits[unitId];
    console.log('🚶 Using special unit movement sound:', sound);
    return sound;
  }
  
  // Check for army-specific class mapping
  if (movementSounds.movementSounds.byClass[unitClass] && 
      movementSounds.movementSounds.byClass[unitClass][armyId]) {
    const sound = movementSounds.movementSounds.byClass[unitClass][armyId];
    console.log('🚶 Using army-specific class movement sound:', sound);
    return sound;
  }
  
  // Fall back to default class mapping
  if (movementSounds.movementSounds.byClass[unitClass] && 
      movementSounds.movementSounds.byClass[unitClass].default) {
    const sound = movementSounds.movementSounds.byClass[unitClass].default;
    console.log('🚶 Using default class movement sound:', sound);
    return sound;
  }
  
  // Final fallback to army theme
  const sound = movementSounds.armyThemes[armyId] || movementSounds.armyThemes.default;
  console.log('🚶 Using army theme fallback movement sound:', sound);
  return sound;
};

// Play combat sound for a unit
export const playCombatSound = async (unitClass, unitId, armyId) => {
  const soundFile = getCombatSound(unitClass, unitId, armyId);
  console.log('🔊 Playing combat sound file:', soundFile);
  await playAudioFile(soundFile);
};

// Play movement sound for a unit
export const playUnitMovementSound = async (unitClass, unitId, armyId) => {
  const soundFile = getMovementSound(unitClass, unitId, armyId);
  console.log('🚶 Playing movement sound file:', soundFile);
  await playAudioFile(soundFile);
};

// Play game sounds
export const playGameSound = async (soundType) => {
  if (soundMappings.gameSounds[soundType]) {
    await playAudioFile(soundMappings.gameSounds[soundType]);
  }
};

// Play piece movement sound (fallback for when unit details aren't available)
export const playMoveSound = async () => {
  // Use default movement sound when unit-specific details aren't available
  await playAudioFile(movementSounds.defaultSounds.movement);
};

// Play victory sound
export const playVictorySound = async () => {
  await playGameSound('victory');
};

// Play defeat sound
export const playDefeatSound = async () => {
  await playGameSound('defeat');
};

// Play flag capture sound
export const playFlagCaptureSound = async () => {
  await playGameSound('flagCapture');
};

// Play bomb explosion sound
export const playBombExplosionSound = async () => {
  await playGameSound('bombExplosion');
};

// Play scout reveal sound
export const playScoutRevealSound = async () => {
  await playGameSound('scoutReveal');
};

// Sound settings management
export const setSoundVolume = (volume) => {
  soundSettings.volume = Math.max(0, Math.min(1, volume));
  
  // Update cached audio volumes
  audioCache.forEach(audio => {
    audio.volume = soundSettings.volume;
  });
};

export const setSoundEnabled = (enabled) => {
  soundSettings.enabled = enabled;
};

export const getSoundSettings = () => {
  return { ...soundSettings };
};

// Preload critical sounds for better performance
export const preloadCriticalSounds = async () => {
  const criticalSounds = [
    movementSounds.defaultSounds.movement,
    soundMappings.gameSounds.victory,
    soundMappings.gameSounds.defeat,
    soundMappings.armyThemes.default
  ];
  
  for (const soundFile of criticalSounds) {
    await loadAudioFile(soundFile);
  }
};