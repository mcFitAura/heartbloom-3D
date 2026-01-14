import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { easing } from 'maath';

interface HeartParticlesProps {
  count?: number;
}

const HeartParticles: React.FC<HeartParticlesProps> = () => {
  const photos = useStore((state) => state.photos);
  const handState = useStore((state) => state.handState);
  const isGalleryMode = useStore((state) => state.isGalleryMode);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, camera } = useThree();

  // Increase placeholder count to 80 for a much clearer shape
  const activePhotos = useMemo(() => {
    if (photos.length > 0) return photos;
    return Array.from({ length: 80 }).map((_, i) => ({
      id: `placeholder-${i}`,
      url: `https://picsum.photos/seed/${i + 15}/300/300`
    }));
  }, [photos]);

  // Generate Positions (Heart & Gallery Sphere)
  const particles = useMemo(() => {
    const temp = [];
    const count = activePhotos.length;
    
    // Golden angle for Fibonacci sphere
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      // --- Heart Calculation ---
      const t = (i / count) * Math.PI * 2 - Math.PI; 
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const hzDepth = 4 * Math.cos(t); 
      const hz = (Math.random() - 0.5) * Math.abs(hzDepth);
      const heartScale = 0.35;

      // --- Sphere Calculation (Gallery Mode) ---
      // Fibonacci sphere distribution for even spread
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const sx = Math.cos(theta) * radius;
      const sz = Math.sin(theta) * radius;
      const sphereRadius = 8; // Size of the gallery sphere

      temp.push({
        position: new THREE.Vector3(hx * heartScale, hy * heartScale, hz * heartScale),
        rotation: new THREE.Euler(
            (Math.random() - 0.5) * 0.4, 
            (Math.random() - 0.5) * 0.4, 
            (Math.random() - 0.5) * 0.2
        ),
        explodedPosition: new THREE.Vector3(
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 12
        ),
        galleryPosition: new THREE.Vector3(sx * sphereRadius, y * sphereRadius, sz * sphereRadius)
      });
    }
    return temp;
  }, [activePhotos]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetTension = handState.detected ? handState.tension : 0.5;
    
    // ROTATION LOGIC
    if (isGalleryMode) {
        // In gallery mode, auto-rotate slowly to show all photos
        groupRef.current.rotation.y += 0.1 * delta;
        // Gently correct X rotation back to 0
        easing.damp(groupRef.current.rotation, 'x', 0, 0.5, delta);
    } else {
        // In heart mode, rotation slows down when tense
        groupRef.current.rotation.y += 0.15 * delta * (1.1 - targetTension);
    }

    groupRef.current.children.forEach((child, i) => {
      const particle = particles[i];
      if (!particle) return;

      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;

      let targetPos = new THREE.Vector3();
      let targetScale = new THREE.Vector3();
      let targetOpacity = 0.5;
      let targetEmissive = new THREE.Color();
      let targetColor = new THREE.Color(1, 1, 1);
      let targetRotation = new THREE.Euler();

      // --- STATE MACHINE ---

      if (isGalleryMode) {
          // MODE: GALLERY (SPHERE)
          targetPos.copy(particle.galleryPosition);
          targetScale.set(1.5, 1.5, 1.5); // Make photos larger in gallery
          targetOpacity = 1.0;
          targetEmissive.setRGB(0, 0, 0); // No emissive glow, just plain photo
          
          // Make mesh look at the camera
          mesh.lookAt(camera.position);
          targetRotation.copy(mesh.rotation); // Capture the lookAt rotation
      } 
      else if (targetTension > 0.88) {
        // MODE: REVEAL SINGLE PHOTO
        if (i === 0) {
            targetPos.set(0, 0, 7); 
            const s = Math.min(viewport.width, viewport.height) * 0.45;
            targetScale.set(s, s, 1);
            targetOpacity = 1;
            targetEmissive.setRGB(0,0,0);
            targetRotation.set(0, -groupRef.current.rotation.y, 0); // Cancel parent rotation
        } else {
            targetPos.copy(particle.explodedPosition).multiplyScalar(3.5);
            targetScale.set(0, 0, 0);
            targetOpacity = 0;
            targetRotation.copy(particle.rotation);
        }
      } 
      else if (targetTension > 0.25) {
         // MODE: EXPANDING
         const expansionFactor = (targetTension - 0.25) / 0.63;
         targetPos.lerpVectors(particle.position, particle.explodedPosition, expansionFactor);
         targetScale.set(1.2, 1.2, 1.2);
         targetOpacity = 0.8;
         targetEmissive.setRGB(expansionFactor * 0.3, expansionFactor * 0.1, expansionFactor * 0.2);
         targetRotation.copy(particle.rotation);
      }
      else {
         // MODE: CONTRACTED HEART
         targetPos.copy(particle.position);
         const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05;
         targetScale.set(0.4 + pulse, 0.4 + pulse, 0.4 + pulse);
         targetOpacity = 0.7;
         targetEmissive.setRGB(2.5, 0.3, 0.6); 
         targetRotation.copy(particle.rotation);
      }

      // Apply changes with damping
      easing.damp3(mesh.position, targetPos, 0.4, delta);
      easing.damp3(mesh.scale, targetScale, 0.4, delta);
      
      // Handle rotation manually since lookAt changes it instantly in Gallery logic
      if (!isGalleryMode) {
         easing.dampE(mesh.rotation, targetRotation, 0.4, delta);
      } else {
          // For gallery, we updated rotation via lookAt above, but we want smooth transition TO it
          // However, lookAt is frame-dependent on camera. 
          // Simplification: Direct update for gallery lookAt is cleaner.
          // But to smooth transition IN:
           mesh.rotation.copy(targetRotation);
      }

      if (material) {
        easing.damp(material, 'opacity', targetOpacity, 0.2, delta);
        easing.dampC(material.color, targetColor, 0.2, delta);
        easing.dampC(material.emissive, targetEmissive, 0.1, delta);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {activePhotos.map((photo, i) => (
        <PhotoMesh key={photo.id} url={photo.url} />
      ))}
    </group>
  );
};

const PhotoMesh: React.FC<{ url: string }> = ({ url }) => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (materialRef.current) {
          materialRef.current.map = tex;
          materialRef.current.needsUpdate = true;
        }
      },
      undefined,
      (err) => {
        console.warn(`Texture load failed for ${url}`);
      }
    );
  }, [url]);
  
  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial 
        ref={materialRef}
        transparent 
        side={THREE.DoubleSide}
        toneMapped={false}
        color="#ff69b4" 
      />
    </mesh>
  );
};

export default HeartParticles;