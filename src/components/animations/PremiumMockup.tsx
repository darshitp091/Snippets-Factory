'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

function SnippetCard3D() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        {/* Main card body */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[4, 5, 0.15]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.9}
            roughness={0.1}
            emissive="#a855f7"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Glass overlay */}
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[3.8, 4.8]} />
          <meshPhysicalMaterial
            color="#0f172a"
            metalness={0.1}
            roughness={0.1}
            transparent
            opacity={0.9}
            transmission={0.1}
          />
        </mesh>

        {/* Code syntax highlighting effect */}
        <mesh position={[-1.5, 1.8, 0.09]}>
          <planeGeometry args={[0.8, 0.15]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>

        <mesh position={[0, 1.5, 0.09]}>
          <planeGeometry args={[2, 0.15]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>

        <mesh position={[0.5, 1.2, 0.09]}>
          <planeGeometry args={[1.5, 0.15]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>

        <mesh position={[-0.8, 0.9, 0.09]}>
          <planeGeometry args={[1.8, 0.15]} />
          <meshBasicMaterial color="#ec4899" />
        </mesh>

        <mesh position={[0.3, 0.6, 0.09]}>
          <planeGeometry args={[2.5, 0.15]} />
          <meshBasicMaterial color="#8b5cf6" />
        </mesh>

        {/* Glowing edges */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(4, 5, 0.15)]} />
          <lineBasicMaterial color="#a855f7" linewidth={2} />
        </lineSegments>

        {/* Particles around card */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 3;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle + i) * radius,
                Math.sin(angle + i) * radius,
                Math.sin(i) * 0.5
              ]}
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial
                color={i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#3b82f6' : '#06b6d4'}
              />
            </mesh>
          );
        })}
      </Float>
    </group>
  );
}

export default function PremiumMockup() {
  return (
    <div className="w-full h-[700px]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
          color="#a855f7"
        />
        <spotLight
          position={[-10, -10, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1.5}
          color="#3b82f6"
        />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#06b6d4" />

        <SnippetCard3D />

        {/* Environment */}
        <fog attach="fog" args={['#0a0118', 5, 25]} />
      </Canvas>
    </div>
  );
}
