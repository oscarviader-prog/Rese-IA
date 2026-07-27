import React, { useMemo } from 'react';

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  glow: boolean;
}

export const Starfield: React.FC = () => {
  const stars = useMemo(() => {
    const starArray: Star[] = [];
    const count = 120; // Dense, elegant star field
    for (let i = 0; i < count; i++) {
      starArray.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() < 0.2 ? Math.random() * 2.5 + 2 : Math.random() * 1.5 + 1, // Tiny stars
        duration: Math.random() * 4 + 2, // 2s to 6s
        delay: Math.random() * 5,
        opacity: Math.random() * 0.7 + 0.3,
        glow: Math.random() < 0.25, // 25% glowing phosphorescent blue stars
      });
    }
    return starArray;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#02040a] select-none">
      {/* Deep space background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#02040a] to-[#02040a]"></div>
      
      {/* Geometric Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #00f2ff 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}
      ></div>

      {/* Tiny Phosphorescent Blue Twinkling Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.glow ? '#38bdf8' : '#7dd3fc',
            boxShadow: star.glow
              ? '0 0 8px 2px rgba(56, 189, 248, 0.95), 0 0 14px rgba(14, 165, 233, 0.6)'
              : '0 0 4px rgba(125, 211, 252, 0.8)',
            opacity: star.opacity,
            '--twinkle-duration': `${star.duration}s`,
            '--twinkle-delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
