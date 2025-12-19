'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

function SnippetCard3D() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[3, 4, 0.2]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.2}
          emissive="#00d4ff"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Glowing edges */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[2.8, 3.8]} />
        <meshBasicMaterial color="#00d4ff" opacity={0.1} transparent />
      </mesh>
    </Float>
  );
}

export default function RotatingMockup() {
  return (
    <div className="w-full h-[600px]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

        <SnippetCard3D />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
}
