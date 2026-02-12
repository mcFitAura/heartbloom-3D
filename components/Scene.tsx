import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrbitControls, Sparkles, Float } from '@react-three/drei';
import HeartParticles from './HeartParticles';
import { useStore } from '../store';

const Scene: React.FC = () => {
  const isGalleryMode = useStore((state) => state.isGalleryMode);

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 45 }}
      gl={{ 
        antialias: true,
        alpha: false,
        stencil: false,
        depth: true,
        powerPreference: "high-performance"
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#080406']} />
      
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-10, -5, 5]} intensity={1.5} color="#ff0066" />
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <HeartParticles />
      </Float>
      
      <Sparkles 
        count={200} 
        scale={20} 
        size={1.5} 
        speed={0.3} 
        opacity={0.4} 
        color="#ffccdd" 
      />

      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate={isGalleryMode}
        autoRotateSpeed={0.5}
        enableRotate={!isGalleryMode}
      />

      <EffectComposer multisampling={4}>
        <Bloom 
          luminanceThreshold={0.5} 
          intensity={0.8} 
          mipmapBlur
        />
        <Vignette darkness={0.8} offset={0.2} />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene;