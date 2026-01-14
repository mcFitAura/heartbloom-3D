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

  useEffect(() => {
    if (!videoRef.current || !window.Hands) return;

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
        maxNumHands: 2, // Enable tracking for 2 hands
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: Results) => {
        const numHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
        
        // Logic: 2 Hands = Gallery Mode
        if (numHands >= 2) {
            setGalleryMode(true);
        } else {
            setGalleryMode(false);
        }

        if (numHands > 0) {
          // Use the first detected hand for tension control
          const landmarks = results.multiHandLandmarks[0];

          // Key landmarks
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const wrist = landmarks[0];
          const middleFingerMCP = landmarks[9]; // Base of middle finger

          // Calculate Euclidean distance between thumb and index
          const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2) +
            Math.pow(thumbTip.z - indexTip.z, 2)
          );

          // Normalize using palm size
          const palmSize = Math.sqrt(
            Math.pow(wrist.x - middleFingerMCP.x, 2) +
            Math.pow(wrist.y - middleFingerMCP.y, 2) +
            Math.pow(wrist.z - middleFingerMCP.z, 2)
          );
          
          // Calculate tension
          let normalizedTension = (distance / palmSize - 0.2);
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
        
        // Strictly check if video is ready to prevent timeouts in MediaPipe
        if (video && video.readyState >= 2 && !video.paused && !video.ended) {
            try {
                await hands.send({ image: video });
            } catch (err) {
                console.warn("MediaPipe send warning (dropping frame):", err);
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
                // Wait for metadata to ensure dimensions are known
                await new Promise<void>((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => resolve();
                    } else {
                        resolve();
                    }
                });
                
                await videoRef.current.play();
                setCameraReady(true);
                onFrame();
            }
        } catch (e) {
            console.error(e);
            setError("Could not start camera. Please allow permissions.");
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
  }, [setHandState, setGalleryMode, setCameraReady]);

  return (
    <div className="fixed top-4 right-4 z-50 w-32 h-24 overflow-hidden rounded-lg border border-white/20 bg-black/50 shadow-lg backdrop-blur-sm transition-opacity duration-300 opacity-80 hover:opacity-100">
        {error && <div className="text-red-500 text-xs p-2">{error}</div>}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform -scale-x-100" // Mirror for user intuition
        playsInline
        muted
        autoPlay
      />
      <div className="absolute bottom-1 left-2 text-[10px] text-white/70 font-mono">
        Hand Tracking
      </div>
    </div>
  );
};

export default HandTracker;