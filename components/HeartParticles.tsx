import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { easing } from 'maath';

// Fix for React Three Fiber elements not being recognized in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const HeartParticles: React.FC = () => {
  const photos = useStore((state) => state.photos);
  const handState = useStore((state) => state.handState);
  const isGalleryMode = useStore((state) => state.isGalleryMode);
  const hiddenMessage = useStore((state) => state.hiddenMessage);
  
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null); 
  const { viewport, camera } = useThree();

  const PARTICLE_COUNT = 30;

  // Distribute active photos among particles
  const activePhotos = useMemo(() => {
    const sourcePhotos = photos.length > 0 ? photos : [];
    const result = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const photo = sourcePhotos[i % sourcePhotos.length];
        if (photo) {
          result.push({ ...photo, id: `particle-${i}-${photo.id}` });
        }
    }
    return result;
  }, [photos]);

  const particles = useMemo(() => {
    const temp = [];
    const getHeartPos = (t: number, scale: number) => {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        return new THREE.Vector3(x * scale, (y + 5) * scale, 0);
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        let pos = new THREE.Vector3();
        let scaleFactor = 1.0;

        if (i < 16) {
            // Outer Ring
            const t = (i / 16) * Math.PI * 2;
            pos = getHeartPos(t, 0.35); 
            pos.z = (Math.random() - 0.5) * 0.2;
            scaleFactor = 1.0;
        } else if (i < 26) {
            // Middle Ring
            const t = ((i - 16) / 10) * Math.PI * 2 + 0.3;
            pos = getHeartPos(t, 0.23); 
            pos.z = 0.6 + (Math.random() - 0.5) * 0.2; 
            scaleFactor = 0.8; 
        } else {
            // Inner Ring
            const t = ((i - 26) / 4) * Math.PI * 2;
            pos = getHeartPos(t, 0.12); 
            pos.z = 1.2 + (Math.random() - 0.5) * 0.2; 
            scaleFactor = 0.6; 
        }

        const rotX = (Math.random() - 0.5) * 0.2;
        const rotY = (Math.random() - 0.5) * 0.2;
        const rotZ = (Math.random() - 0.5) * 0.05;

        const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
        const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
        const r = 8;
        const gx = r * Math.cos(theta) * Math.sin(phi);
        const gy = r * Math.sin(theta) * Math.sin(phi);
        const gz = r * Math.cos(phi);

        temp.push({
            position: pos,
            rotation: new THREE.Euler(rotX, rotY, rotZ),
            explodedPosition: pos.clone().multiplyScalar(3).add(new THREE.Vector3(0, 0, 5)),
            galleryPosition: new THREE.Vector3(gx, gy, gz),
            scaleFactor: scaleFactor
        });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetTension = handState.detected ? handState.tension : 0;
    
    const desiredWidth = Math.min(viewport.width, viewport.height) * 0.8;
    const responsiveScale = Math.min(desiredWidth / 12, 1.5); 

    if (isGalleryMode) {
        groupRef.current.rotation.y += 0.1 * delta;
        const galleryScale = Math.min(viewport.width / 20, 1.2);
        easing.damp3(groupRef.current.scale, [galleryScale, galleryScale, galleryScale], 0.5, delta);
    } else {
        const beat = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.05; 
        const finalScale = responsiveScale * beat;
        easing.damp3(groupRef.current.scale, [finalScale, finalScale, finalScale], 0.5, delta);
        groupRef.current.rotation.y += 0.1 * delta * (1.1 - targetTension);
    }

    if (textRef.current) {
        let textOpacity = 0;
        if (!isGalleryMode && handState.detected) {
             textOpacity = Math.max(0, (targetTension - 0.5) * 4);
        }
        easing.damp(textRef.current.material, 'opacity', textOpacity, 0.3, delta);
        const textScale = Math.min(viewport.width / 10, 1);
        textRef.current.scale.set(textScale, textScale, textScale);
    }

    groupRef.current.children.forEach((child, i) => {
      if (i >= particles.length) return;
      const mesh = child as THREE.Mesh;
      const particle = particles[i];
      
      let tPos = new THREE.Vector3();
      let tScale = new THREE.Vector3();
      let tRot = new THREE.Euler();

      if (isGalleryMode) {
          tPos.copy(particle.galleryPosition);
          tScale.set(2, 2, 0.2);
          mesh.lookAt(camera.position);
          tRot.copy(mesh.rotation);
      } else if (targetTension > 0.95) {
          tPos.copy(particle.explodedPosition);
          tScale.set(0.5, 0.5, 0.5); 
          tRot.copy(particle.rotation);
      } else {
          const expansion = 1 + (targetTension * 1.5);
          tPos.copy(particle.position).multiplyScalar(expansion);
          
          const baseSize = responsiveScale < 0.5 ? 1.0 : 1.3; 
          const individualSize = baseSize * (particle as any).scaleFactor;
          
          const s = Math.max(0.4, individualSize - (targetTension * 0.5)); 
          tScale.set(s, s, s * 0.1); 
          tRot.copy(particle.rotation);
      }

      easing.damp3(mesh.position, tPos, 0.3, delta);
      easing.damp3(mesh.scale, tScale, 0.3, delta);
      if (!isGalleryMode) easing.dampE(mesh.rotation, tRot, 0.3, delta);
    });
  });

  return (
    <group>
      <Environment preset="city" />
      <group ref={groupRef}>
        {activePhotos.map((photo, i) => (
          <AcrylicBlock key={photo.id} url={photo.url} index={i} />
        ))}
      </group>

      <Text
        ref={textRef}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        fontSize={1.5}
        color="white"
        textAlign="center"
        position={[0, 0, 2]} 
        maxWidth={viewport.width * 0.9}
        lineHeight={1.2}
      >
        {hiddenMessage}
        <meshStandardMaterial toneMapped={false} emissive="#ff0066" emissiveIntensity={5} transparent opacity={0} />
      </Text>
    </group>
  );
};

const AcrylicBlock = React.memo(({ url, index }: { url: string, index: number }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 3;

    const loadTexture = () => {
        const loader = new THREE.TextureLoader();
        // Important: Set crossorigin BEFORE loading to avoid tainted canvas/white textures
        if (!url.startsWith('blob:') && !url.startsWith('data:')) {
            loader.setCrossOrigin('anonymous');
        }

        loader.load(
            url, 
            (tex) => {
                if (isMounted) {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.minFilter = THREE.LinearFilter;
                    tex.generateMipmaps = true;
                    tex.center.set(0.5, 0.5);
                    tex.needsUpdate = true;
                    setTexture(tex);
                    setHasError(false);
                }
            },
            undefined,
            (err) => {
                console.warn(`Load failed for: ${url}`, err);
                if (isMounted && attempts < maxAttempts) {
                    attempts++;
                    setTimeout(loadTexture, 1000 + Math.random() * 500); 
                } else if (isMounted) {
                    setHasError(true);
                }
            }
        );
    };

    loadTexture();

    return () => { isMounted = false; };
  }, [url]);

  const sideColor = "#e6004c"; 
  const sideOpacity = 0.95;
  const sideRoughness = 0.2;
  const sideEmissive = "#660022";
  
  // Face color logic:
  // - Loaded: White (allows texture to show true colors)
  // - Loading: Soft Pink
  // - Error: Red
  const faceColor = hasError ? "#ff3333" : (texture ? "#ffffff" : "#ff99aa");

  // Material props for the photo faces
  const photoMaterialProps = {
    color: faceColor,
    transparent: false, // Force opaque to fix z-sorting/visibility
    roughness: 0.4,
    map: texture || undefined,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide // Ensure visibility from inside/back
  };

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      {/* 0: Right, 1: Left, 2: Top, 3: Bottom - Transparent Acrylic Edges */}
      <meshStandardMaterial attach="material-0" color={sideColor} emissive={sideEmissive} opacity={sideOpacity} transparent roughness={sideRoughness} />
      <meshStandardMaterial attach="material-1" color={sideColor} emissive={sideEmissive} opacity={sideOpacity} transparent roughness={sideRoughness} />
      <meshStandardMaterial attach="material-2" color={sideColor} emissive={sideEmissive} opacity={sideOpacity} transparent roughness={sideRoughness} />
      <meshStandardMaterial attach="material-3" color={sideColor} emissive={sideEmissive} opacity={sideOpacity} transparent roughness={sideRoughness} />
      
      {/* 4: Front - PHOTO */}
      <meshStandardMaterial attach="material-4" {...photoMaterialProps} />
      
      {/* 5: Back - PHOTO (Duplicate photo on back so rotation doesn't hide it) */}
      <meshStandardMaterial attach="material-5" {...photoMaterialProps} />
    </mesh>
  );
});

export default HeartParticles;