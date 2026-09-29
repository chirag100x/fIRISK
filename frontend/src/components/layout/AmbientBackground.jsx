import React from 'react';

export default function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Drifting radial-gradient blurred blobs */}
      <div
        className="absolute rounded-full animate-blob-1"
        style={{
          width: '520px',
          height: '520px',
          top: '-10%',
          left: '15%',
          background: 'radial-gradient(circle, #C9A24B 0%, rgba(201, 162, 75, 0) 70%)',
          filter: 'blur(90px)',
          opacity: 'var(--blob-opacity)',
          transition: 'opacity 0.4s ease',
        }}
      />
      <div
        className="absolute rounded-full animate-blob-2"
        style={{
          width: '460px',
          height: '460px',
          top: '25%',
          right: '10%',
          background: 'radial-gradient(circle, #3B7A8F 0%, rgba(59, 122, 143, 0) 70%)',
          filter: 'blur(90px)',
          opacity: 'var(--blob-opacity)',
          transition: 'opacity 0.4s ease',
        }}
      />
      <div
        className="absolute rounded-full animate-blob-3"
        style={{
          width: '500px',
          height: '500px',
          bottom: '5%',
          left: '30%',
          background: 'radial-gradient(circle, #8A7038 0%, rgba(138, 112, 56, 0) 70%)',
          filter: 'blur(90px)',
          opacity: 'var(--blob-opacity)',
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* SVG fractalNoise grain overlay */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: 'overlay',
          opacity: 'var(--grain-opacity)',
          transition: 'opacity 0.4s ease',
        }}
      >
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
    </div>
  );
}
