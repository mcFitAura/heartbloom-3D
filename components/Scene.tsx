import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls, Sparkles } from '@react-three/drei';
import HeartParticles from './HeartParticles';
import { useStore } from '../store';

const Scene: React.FC = () => {
  const isGalleryMode = useStore((state) => state.isGalleryMode);

  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 45 }}
      gl={{ antialias: false, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#050505']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0055" />

      <HeartParticles />
      
      {/* Atmospheric Sparkles */}
      <Sparkles 
        count={150} 
        scale={12} 
        size={2} 
        speed={0.4} 
        opacity={0.5} 
        color="#ffb6c1" 
      />
      
      {/* Secondary darker sparkles for depth */}
      <Sparkles 
        count={100} 
        scale={15} 
        size={5} 
        speed={0.2} 
        opacity={0.2} 
        color="#60a5fa" 
      />

      {/* Controls - Disable user interaction if gestures are active to prevent conflict */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate={isGalleryMode} // Auto rotate only works nicely if OrbitControls isn't fighting local rotation
        autoRotateSpeed={0.5}
        enableRotate={!isGalleryMode} // Disable manual rotation in gallery mode to let the auto-spin work
      />

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.5} 
          intensity={1.2} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene;