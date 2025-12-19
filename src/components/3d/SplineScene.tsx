'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styles from './SplineScene.module.css';

// Dynamically import Spline to avoid SSR issues
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>Loading 3D Scene...</p>
    </div>
  ),
});

interface SplineSceneProps {
  scene?: string;
  className?: string;
}

export default function SplineScene({ scene, className }: SplineSceneProps) {
  // You can replace this with your actual Spline scene URL
  // For now, we'll use a fallback 3D CSS animation
  const sceneUrl = scene || 'https://prod.spline.design/your-scene-id/scene.splinecode';

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Suspense fallback={
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading 3D Scene...</p>
        </div>
      }>
        {/* Fallback 3D CSS Component until you add your Spline scene */}
        <div className={styles.fallback3D}>
          <div className={styles.codeBlock}>
            <div className={styles.blockHeader}>
              <div className={styles.dots}>
                <span className={styles.dot} style={{ background: '#FF5F56' }}></span>
                <span className={styles.dot} style={{ background: '#FFBD2E' }}></span>
                <span className={styles.dot} style={{ background: '#27C93F' }}></span>
              </div>
              <span className={styles.fileName}>snippet.tsx</span>
            </div>
            <div className={styles.blockContent}>
              <code className={styles.code}>
                <span style={{ color: '#A3B18A' }}>const</span>{' '}
                <span style={{ color: '#588157' }}>snippet</span>{' '}
                <span style={{ color: '#6B7B66' }}>=</span>{' '}
                <span style={{ color: '#A3B18A' }}>{'{'}</span>
                <br />
                {'  '}
                <span style={{ color: '#4A5F47' }}>title</span>
                <span style={{ color: '#6B7B66' }}>:</span>{' '}
                <span style={{ color: '#D4A373' }}>"React Hook"</span>
                <span style={{ color: '#6B7B66' }}>,</span>
                <br />
                {'  '}
                <span style={{ color: '#4A5F47' }}>language</span>
                <span style={{ color: '#6B7B66' }}>:</span>{' '}
                <span style={{ color: '#D4A373' }}>"typescript"</span>
                <span style={{ color: '#6B7B66' }}>,</span>
                <br />
                {'  '}
                <span style={{ color: '#4A5F47' }}>usage</span>
                <span style={{ color: '#6B7B66' }}>:</span>{' '}
                <span style={{ color: '#588157' }}>1247</span>
                <br />
                <span style={{ color: '#A3B18A' }}>{'}'}</span>
              </code>
            </div>
          </div>

          {/* Floating particles */}
          <div className={styles.particle} style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
          <div className={styles.particle} style={{ top: '60%', left: '80%', animationDelay: '1s' }}></div>
          <div className={styles.particle} style={{ top: '35%', left: '70%', animationDelay: '2s' }}></div>
          <div className={styles.particle} style={{ top: '80%', left: '20%', animationDelay: '1.5s' }}></div>
          <div className={styles.particle} style={{ top: '25%', left: '50%', animationDelay: '0.5s' }}></div>
        </div>

        {/* Uncomment this when you have a Spline scene URL */}
        {/* <Spline scene={sceneUrl} /> */}
      </Suspense>
    </div>
  );
}
