import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).slice(0, 30).map(file => ({
        id: uuidv4(),
        url: URL.createObjectURL(file as Blob)
      }));
      setPhotos(newPhotos);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      
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
          onClick={triggerUpload}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Upload Photos ({photos.length}/30)
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Status / Instructions */}
      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-auto">
         {!isCameraReady && (
             <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg backdrop-blur text-sm border border-red-500/30">
                 Please allow camera access to interact.
             </div>
         )}
         
         {isCameraReady && (
             <div className={`transition-all duration-500 ${handState.detected || isGalleryMode ? 'opacity-0' : 'opacity-100'} text-center`}>
                 <div className="animate-pulse bg-black/40 backdrop-blur px-6 py-3 rounded-xl border border-white/10">
                     <p className="text-lg font-medium text-pink-300">Raise your hand</p>
                     <p className="text-xs text-white/50">Open hand to reveal the secret</p>
                 </div>
             </div>
         )}
      </div>

      {/* Footer / Feedback */}
      <div className="flex justify-between items-end">
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
           Two Hands: Show all photos (Gallery)
        </div>
      </div>
    </div>
  );
};

export default UI;