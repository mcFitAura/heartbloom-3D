import React, { Suspense } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import HandTracker from './components/HandTracker';
import AmbientSound from './components/AmbientSound';

function App() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Audio Layer */}
      <AmbientSound />

      {/* MediaPipe Logic Layer */}
      <HandTracker />
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-white/50">Loading 3D Engine...</div>}>
           <Scene />
        </Suspense>
      </div>

      {/* UI Overlay Layer */}
      <UI />
    </div>
  );
}

export default App;