import React, { useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

interface RadiatingParticle {
  originIdx: number;
  angle: number;
  distance: number;
  maxDistance: number;
  speed: number;
  radius: number;
  baseAlpha: number;
  color: string;
  trail: TrailPoint[];
  maxTrailLength: number;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMediaChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Focal emission centers:
    // Origin 1: behind hero headline / main content (~35% width, ~30% height)
    // Origin 2: behind right side gauge / constellation (~72% width, ~40% height)
    const getOrigins = (w: number, h: number) => [
      { x: w * 0.35, y: h * 0.30 },
      { x: w * 0.72, y: h * 0.40 },
    ];

    let origins = getOrigins(width, height);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      origins = getOrigins(width, height);
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 24;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 24;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Strict Design System Palette:
    // #5FC9E8 (75% icy steel-blue)
    // #E0A458 (15% amber)
    // #D9705A (10% clay-red)
    const colors = [
      '#5FC9E8', '#5FC9E8', '#5FC9E8', '#5FC9E8', '#5FC9E8', '#5FC9E8',
      '#E0A458',
      '#D9705A',
    ];

    const particleCount = Math.min(115, Math.max(65, Math.floor((width * height) / 16000)));
    const particles: RadiatingParticle[] = [];

    const spawnParticle = (p?: Partial<RadiatingParticle>, prewarm = false): RadiatingParticle => {
      const originIdx = Math.random() < 0.65 ? 0 : 1;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.8 + 1.6; // 1.6 to 4.4 px/frame
      const maxDistance = Math.sqrt(width * width + height * height) * (0.55 + Math.random() * 0.35);
      // Density gradient: prewarmed particles concentrated closer to origin
      const distance = prewarm
        ? Math.pow(Math.random(), 1.6) * maxDistance
        : Math.random() * 15;

      const radius = speed > 3.2 ? Math.random() * 0.8 + 0.7 : Math.random() * 1.3 + 1.2;
      const baseAlpha = Math.random() * 0.45 + 0.45;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const maxTrailLength = Math.floor(Math.random() * 4 + 4);

      return {
        originIdx,
        angle,
        distance,
        maxDistance,
        speed,
        radius,
        baseAlpha,
        color,
        trail: [],
        maxTrailLength,
        ...p,
      };
    };

    // Pre-populate particles across simulation distance
    for (let i = 0; i < particleCount; i++) {
      particles.push(spawnParticle(undefined, true));
    }

    const render = () => {
      // Clear frame cleanly
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;
      const parallaxX = mouseRef.current.x;
      const parallaxY = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const origin = origins[p.originIdx] || origins[0];

        if (prefersReducedMotion) {
          // Slow ambient drift fallback for reduced motion users
          p.distance += p.speed * 0.12;
        } else {
          // Dynamic radiating outward velocity
          p.distance += p.speed;
        }

        // Current coordinate
        const currentX = origin.x + Math.cos(p.angle) * p.distance + parallaxX * (p.radius / 2);
        const currentY = origin.y + Math.sin(p.angle) * p.distance + parallaxY * (p.radius / 2);

        // Distance attenuation: bright/dense near center, soft fade near edges
        const progress = p.distance / p.maxDistance;
        const fadeAlpha = Math.max(0, Math.min(1, Math.sin(Math.min(Math.PI, progress * Math.PI * 1.2))));
        const alpha = p.baseAlpha * fadeAlpha;

        // Check if out of bounds or expired
        if (
          p.distance >= p.maxDistance ||
          currentX < -60 ||
          currentX > width + 60 ||
          currentY < -60 ||
          currentY > height + 60
        ) {
          // Respawn at origin focal point
          particles[i] = spawnParticle();
          continue;
        }

        // Record motion trail history
        p.trail.unshift({ x: currentX, y: currentY, alpha });
        if (p.trail.length > p.maxTrailLength) {
          p.trail.pop();
        }

        // 1. Draw Motion Trail Streak
        if (!prefersReducedMotion && p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);

          for (let t = 1; t < p.trail.length; t++) {
            ctx.lineTo(p.trail[t].x, p.trail[t].y);
          }

          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.radius * 0.85;
          ctx.lineCap = 'round';
          ctx.globalAlpha = alpha * 0.45;
          ctx.stroke();
        }

        // 2. Draw Leading Particle Head with Subtle Glow
        ctx.beginPath();
        ctx.arc(currentX, currentY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Radiating Burst Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Radial Gradient Glow Underlay: icy steel-blue origin focal glow + clay-red ambient balance */}
      <div
        className="absolute top-[-10%] left-[20%] w-[680px] h-[680px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(95, 201, 232, 0.12) 0%, rgba(95, 201, 232, 0.03) 45%, rgba(95, 201, 232, 0) 70%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute top-[25%] right-[10%] w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(95, 201, 232, 0.08) 0%, rgba(95, 201, 232, 0) 65%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[-5%] w-[720px] h-[720px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(217, 112, 90, 0.07) 0%, rgba(217, 112, 90, 0) 70%)',
          filter: 'blur(70px)',
        }}
      />
    </div>
  );
};
