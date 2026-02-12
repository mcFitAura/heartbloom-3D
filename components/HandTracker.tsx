import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

// Define types locally since we aren't importing the module
interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface Results {
  multiHandLandmarks: Landmark[][];
  image: any;
}

declare global {
  interface Window {
    Hands: any;
  }
}

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setHandState = useStore((state) => state.setHandState);
  const setGalleryMode = useStore((state) => state.setGalleryMode);
  const setCameraReady = useStore((state) => state.setCameraReady);
  const [error, setError] = useState<string | null>(null);
  const [handsLoaded, setHandsLoaded] = useState(false);

  // Poll for window.Hands availability
  useEffect(() => {
    const checkHands = setInterval(() => {
      if (window.Hands) {
        setHandsLoaded(true);
        clearInterval(checkHands);
      }
    }, 100);
    return () => clearInterval(checkHands);
  }, []);

  useEffect(() => {
    if (!handsLoaded || !videoRef.current) return;

    let hands: any = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let isRunning = true;

    const setupHands = () => {
       hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: Results) => {
        if (!isRunning) return;
        
        const numHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
        
        setGalleryMode(numHands >= 2);

        if (numHands > 0 && results.multiHandLandmarks[0]) {
          const landmarks = results.multiHandLandmarks[0];
          if (!landmarks[4] || !landmarks[8] || !landmarks[0] || !landmarks[9]) return;

          // Key landmarks
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const wrist = landmarks[0];
          const middleFingerMCP = landmarks[9];

          // Calculate Euclidean distance between thumb and index
          const dx = thumbTip.x - indexTip.x;
          const dy = thumbTip.y - indexTip.y;
          const dz = thumbTip.z - indexTip.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Normalize using palm size
          const pdx = wrist.x - middleFingerMCP.x;
          const pdy = wrist.y - middleFingerMCP.y;
          const pdz = wrist.z - middleFingerMCP.z;
          const palmSize = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
          
          // Calculate tension
          let normalizedTension = (distance / (palmSize || 0.1) - 0.2);
          normalizedTension = Math.max(0, Math.min(1, normalizedTension));

          setHandState({
            detected: true,
            tension: normalizedTension,
            x: 1 - landmarks[9].x, // Mirror X
            y: landmarks[9].y,
          });
        } else {
          setHandState({ detected: false });
        }
      });
    };

    const onFrame = async () => {
        if (!isRunning || !hands) return;
        const video = videoRef.current;
        
        if (video && video.readyState >= 2 && !video.paused && !video.ended) {
            try {
                await hands.send({ image: video });
            } catch (err) {
                // MediaPipe frame drop
            }
        }
        animationFrameId = requestAnimationFrame(onFrame);
    };

    const startCamera = async () => {
        try {
            setupHands();

            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().then(() => {
                        setCameraReady(true);
                        onFrame();
                    }).catch(e => console.warn("Video playback blocked:", e));
                };
            }
        } catch (e) {
            console.error(e);
            setError("Camera permission denied.");
        }
    };

    startCamera();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      if (stream) {
         stream.getTracks().forEach(track => track.stop());
      }
      if (hands) {
          hands.close();
      }
    };
  }, [handsLoaded, setHandState, setGalleryMode, setCameraReady]);

  return (
    <div className="fixed top-4 right-4 z-50 w-32 h-24 overflow-hidden rounded-lg border border-white/20 bg-black/50 shadow-lg backdrop-blur-sm transition-opacity duration-300 opacity-80 hover:opacity-100">
        {error && <div className="text-red-400 text-[10px] p-2 leading-tight font-sans">{error}</div>}
        {!handsLoaded && !error && <div className="text-white/50 text-[10px] p-2 absolute top-0 left-0">Loading AI...</div>}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform -scale-x-100"
        playsInline
        muted
        autoPlay
      />
      <div className="absolute bottom-1 left-2 text-[8px] text-white/50 font-mono">TRACKER</div>
    </div>
  );
};

export default HandTracker;