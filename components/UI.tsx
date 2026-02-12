import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import heic2any from 'heic2any';

const UI: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPhotos = useStore((state) => state.setPhotos);
  const photos = useStore((state) => state.photos);
  const handState = useStore((state) => state.handState);
  const isGalleryMode = useStore((state) => state.isGalleryMode);
  const isCameraReady = useStore((state) => state.isCameraReady);
  
  // Hidden Message State
  const hiddenMessage = useStore((state) => state.hiddenMessage);
  const setHiddenMessage = useStore((state) => state.setHiddenMessage);
  const [isEditingMsg, setIsEditingMsg] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Clean up ObjectURLs to prevent memory leaks which cause mobile reloads
  useEffect(() => {
    return () => {
      photos.forEach(photo => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [photos]);

  const processFiles = useCallback(async (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;

    setIsProcessing(true);
    
    // NOTE: Do not revoke old blobs here manually. 
    // The useEffect cleanup above will handle it when 'photos' state updates.
    // Revoking them here causes immediate texture loss before the new ones are ready.

    const files = incomingFiles.slice(0, 30);
    const newPhotos: any[] = [];
    const MAX_SIZE = 1024; // Limit size to prevent WebGL context loss

    try {
      for (const file of files) {
          let currentBlob: Blob = file;
          let fileName = file.name;
          
          // 1. HEIC Check & Convert
          const isHeic = fileName.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
          
          if (isHeic) {
              try {
                  const convertedBlob = await heic2any({
                      blob: file,
                      toType: 'image/jpeg',
                      quality: 0.8
                  });
                  currentBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                  fileName = fileName.replace(/\.heic$/i, ".jpg");
              } catch (err) {
                  console.warn(`Failed to convert HEIC: ${fileName}`, err);
                  // Fallback: Try to use original file if conversion fails, though likely won't work in texture loader
                  // But prevents skipping entirely
              }
          }

          // 2. Resize & Compress Image (Crucial Fix for Mobile/WebGL Limit)
          try {
             const resizedBlob = await new Promise<Blob>((resolve, reject) => {
                 const img = new Image();
                 const url = URL.createObjectURL(currentBlob);
                 
                 img.onload = () => {
                     URL.revokeObjectURL(url);
                     
                     let width = img.width;
                     let height = img.height;

                     // Calculate aspect ratio fit
                     if (width > MAX_SIZE || height > MAX_SIZE) {
                         const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                         width = Math.floor(width * ratio);
                         height = Math.floor(height * ratio);
                     }

                     const canvas = document.createElement('canvas');
                     canvas.width = width;
                     canvas.height = height;
                     const ctx = canvas.getContext('2d');
                     
                     if (!ctx) {
                         reject(new Error("Canvas context failed"));
                         return;
                     }

                     // Draw and compress
                     ctx.drawImage(img, 0, 0, width, height);
                     
                     canvas.toBlob(
                         (blob) => {
                             if (blob) resolve(blob);
                             else reject(new Error("Image compression failed"));
                         },
                         'image/jpeg',
                         0.85 // 85% quality is enough for 3D textures
                     );
                 };

                 img.onerror = (e) => {
                     URL.revokeObjectURL(url);
                     reject(e);
                 };

                 img.src = url;
             });
             // If resize successful, use it
             currentBlob = resizedBlob;
          } catch (resizeErr) {
              console.warn("Resize failed, using original file.", resizeErr);
              // Fallback to original blob if resize fails
          }

          newPhotos.push({
              id: uuidv4(),
              url: URL.createObjectURL(currentBlob)
          });
      }
      
      // Update store if we have valid photos
      if (newPhotos.length > 0) {
          setPhotos(newPhotos);
      }
    } catch (error) {
        console.error("Error processing files:", error);
    } finally {
        setIsProcessing(false);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [setPhotos]); // Removed 'photos' from dep array as we don't read it directly here

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!isProcessing) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div 
        className={`absolute inset-0 z-10 flex flex-col justify-between p-6 transition-colors duration-300 ${isDragging ? 'bg-pink-500/20 backdrop-blur-sm' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
    >
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
              HeartBloom 3D
            </h1>
            <p className="text-white/60 text-sm mt-1 max-w-xs">
              A gesture-controlled memory archive.
            </p>
          </div>

          {/* Secret Message Input */}
          <div className="flex items-center gap-2 mt-2">
            {isEditingMsg ? (
                <form 
                    onSubmit={(e) => { e.preventDefault(); setIsEditingMsg(false); }} 
                    className="flex gap-2 items-center"
                >
                    <input 
                        type="text" 
                        value={hiddenMessage}
                        onChange={(e) => setHiddenMessage(e.target.value)}
                        className="bg-black/50 border border-pink-500/50 rounded px-3 py-1 text-white text-sm outline-none focus:ring-1 focus:ring-pink-500 w-40"
                        autoFocus
                        onBlur={() => setIsEditingMsg(false)}
                    />
                </form>
            ) : (
                <button 
                    type="button"
                    onClick={() => setIsEditingMsg(true)}
                    className="text-pink-300/80 hover:text-pink-300 text-xs transition-colors flex items-center gap-1 border border-pink-500/30 rounded-full px-2 py-1 bg-pink-500/10"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Msg: "{hiddenMessage}"
                </button>
            )}
          </div>
        </div>

        <button 
          type="button"
          onClick={triggerUpload}
          disabled={isProcessing}
          className={`backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2 ${isProcessing ? 'bg-white/5 cursor-wait opacity-70' : 'bg-white/10 hover:bg-white/20'}`}
        >
          {isProcessing ? (
             <>
               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Optimizing...
             </>
          ) : (
             <>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
               Upload Photos
             </>
          )}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          accept="image/png, image/jpeg, image/jpg, .heic" 
          className="hidden" 
        />
      </div>

      {/* Drop Zone Overlay Text */}
      {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-xl p-8 rounded-2xl border border-pink-500/50 text-center animate-bounce">
                  <svg className="w-16 h-16 text-pink-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p className="text-xl font-bold text-white">Drop Photos Here</p>
                  <p className="text-sm text-pink-300">Supports JPG, PNG, HEIC</p>
              </div>
          </div>
      )}

      {/* Status / Instructions */}
      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-auto">
         {!isCameraReady && (
             <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg backdrop-blur text-sm border border-red-500/30">
                 Please allow camera access to interact.
             </div>
         )}
         
         {isCameraReady && !isDragging && (
             <div className={`transition-all duration-500 ${handState.detected || isGalleryMode ? 'opacity-0' : 'opacity-100'} text-center`}>
                 <div className="animate-pulse bg-black/40 backdrop-blur px-6 py-3 rounded-xl border border-white/10">
                     <p className="text-lg font-medium text-pink-300">Raise your hand</p>
                     <p className="text-xs text-white/50">Open hand to reveal the secret</p>
                 </div>
             </div>
         )}
      </div>

      {/* Footer / Feedback */}
      <div className="flex justify-between items-end pointer-events-auto">
        <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-xs text-white/50">
           {isGalleryMode ? (
               <span className="text-blue-300 font-bold">GALLERY MODE ACTIVE</span>
           ) : (
             <>
               Tension: {(handState.tension * 100).toFixed(0)}% <br/>
               Status: {handState.detected ? (handState.tension > 0.8 ? 'Expanded' : (handState.tension > 0.3 ? 'Revealing...' : 'Secret Hidden')) : 'Idle'}
             </>
           )}
        </div>

        <div className="max-w-xs text-right text-xs text-white/40">
           <strong>Instructions:</strong><br/>
           One Hand: Open hand to reveal message<br/>
           Two Hands: Show all photos (Gallery)<br/>
           <span className="text-pink-400">Drag & Drop HEIC/JPG supported</span>
        </div>
      </div>
    </div>
  );
};

export default UI;