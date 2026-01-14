import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

const AmbientSound: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handState = useStore((state) => state.handState);
  const isCameraReady = useStore((state) => state.isCameraReady);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Use a royalty-free ethereal track
  const AUDIO_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ethereal-meditation-110299.mp3";

  useEffect(() => {
    // Create audio object
    const audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.volume = 0; // Start silent
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Handle browser autoplay policy
  useEffect(() => {
    const startAudio = () => {
      if (audioRef.current && !hasInteracted && isCameraReady) {
        audioRef.current.play().then(() => {
            setHasInteracted(true);
            // Fade in
            let vol = 0;
            const fade = setInterval(() => {
                vol += 0.05;
                if (vol >= 0.3) {
                    clearInterval(fade);
                    vol = 0.3;
                }
                if(audioRef.current) audioRef.current.volume = vol;
            }, 200);
        }).catch(e => console.log("Audio play failed (waiting for interaction):", e));
      }
    };

    // Try to start when camera is ready (usually implies user interaction/permission granted)
    if (isCameraReady) {
        startAudio();
    }
    
    window.addEventListener('click', startAudio);
    return () => window.removeEventListener('click', startAudio);
  }, [isCameraReady, hasInteracted]);

  // Modulate Audio based on Tension
  useEffect(() => {
    if (!audioRef.current || !hasInteracted) return;

    // Base volume
    const baseVolume = 0.3;
    
    // When tension increases (expanding heart), increase volume and playback rate slightly
    // to create a "time dilation" or "energy build-up" effect
    const tension = handState.detected ? handState.tension : 0;
    
    const targetVolume = baseVolume + (tension * 0.4); // Max 0.7
    // Playback rate: 0.9 (slow/deep heart) -> 1.1 (excited/expanding)
    // Note: adjusting playback rate too fast causes glitches, so we keep it subtle
    const targetRate = 0.95 + (tension * 0.15); 

    // Smooth transition could be done here, but setting directly is usually fine for these updates
    audioRef.current.volume = Math.min(1, Math.max(0, targetVolume));
    
    // Optional: Pitch shift effect (preserves pitch in some browsers, speeds up in others)
    audioRef.current.playbackRate = targetRate;

  }, [handState.tension, handState.detected, hasInteracted]);

  return null; // Audio component is invisible
};

export default AmbientSound;