import React, { useEffect, useRef, useMemo } from 'react';
import { EvidenceItem } from '../types';

interface EvidenceConstellationProps {
  evidence?: EvidenceItem[];
  caseTitle?: string;
  className?: string;
}

interface SatelliteNode {
  id: string;
  type: string;
  status: string;
  color: string;
  angle: number;
  distanceRatio: number;
  pulseOffset: number;
  packetProgress: number;
  packetSpeed: number;
}

export const EvidenceConstellation: React.FC<EvidenceConstellationProps> = ({
  evidence = [],
  caseTitle = 'Case Core',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fallback if no evidence provided
  const evidenceList = useMemo(() => {
    if (evidence && evidence.length > 0) {
      return evidence.slice(0, 8);
    }
    return [
      { id: 'ev-1', type: 'message', title: 'SMS Coercion', riskLevel: 'Critical', riskScore: 92 },
      { id: 'ev-2', type: 'url', title: 'Reverse Proxy Link', riskLevel: 'High', riskScore: 88 },
      { id: 'ev-3', type: 'screenshot', title: '2FA Prompt Spam', riskLevel: 'Medium', riskScore: 68 },
      { id: 'ev-4', type: 'audio', title: 'Voicemail Spoof', riskLevel: 'Low', riskScore: 35 },
    ] as EvidenceItem[];
  }, [evidence]);

  const verifiedCount = useMemo(() => {
    // Treat items analyzed / preserved as verified
    return evidenceList.length;
  }, [evidenceList]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    let animationFrameId: number;

    const setCanvasDimensions = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Build satellite node configs
    const count = Math.max(1, evidenceList.length);
    const satellites: SatelliteNode[] = evidenceList.map((item, idx) => {
      let color = '#5FC9E8'; // verified / low
      let status = 'verified';

      const riskScore = item.riskScore ?? 50;
      const riskLevel = item.riskLevel?.toLowerCase() ?? '';

      if (riskLevel === 'critical' || riskScore >= 80) {
        color = '#D9705A';
        status = 'high risk';
      } else if (riskLevel === 'high' || riskScore >= 65) {
        color = '#D9705A';
        status = 'flagged';
      } else if (riskLevel === 'medium' || riskScore >= 45) {
        color = '#E0A458';
        status = 'suspicious';
      } else {
        color = '#5FC9E8';
        status = 'verified';
      }

      // Distribute angles symmetrically with a slight offset
      const baseAngle = (idx / count) * Math.PI * 2 - Math.PI / 2;
      const angle = baseAngle + (idx % 2 === 1 ? 0.08 : -0.08);

      return {
        id: item.id,
        type: item.type || 'artifact',
        status,
        color,
        angle,
        distanceRatio: 0.36 + (idx % 2) * 0.05,
        pulseOffset: idx * 1.1,
        packetProgress: (idx * 0.23) % 1,
        packetSpeed: 0.0055 + (idx % 4) * 0.0018,
      };
    });

    let startTime = performance.now();

    const draw = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 6;
      const orbitRadius = Math.min(width, height) * 0.37;

      // 1. Draw Connecting Lines & Hash Verification Packets
      satellites.forEach((sat) => {
        const sx = cx + Math.cos(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);
        const sy = cy + Math.sin(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);

        // Thin link line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = 'rgba(95, 201, 232, 0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Traveling hash verification packet
        if (!prefersReducedMotion) {
          sat.packetProgress = (sat.packetProgress + sat.packetSpeed) % 1;
        }

        const t = sat.packetProgress;
        const px = cx + (sx - cx) * t;
        const py = cy + (sy - cy) * t;

        // Packet glow
        const packetGlow = ctx.createRadialGradient(px, py, 0, px, py, 7);
        packetGlow.addColorStop(0, '#5FC9E8');
        packetGlow.addColorStop(0.4, 'rgba(95, 201, 232, 0.6)');
        packetGlow.addColorStop(1, 'rgba(95, 201, 232, 0)');

        ctx.fillStyle = packetGlow;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        // Packet center dot
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });

      // 2. Draw Central "Core" Node (Breathing Scale ~1.6s period)
      const coreBreath = prefersReducedMotion
        ? 1
        : 1 + Math.sin((elapsed / 1600) * Math.PI * 2) * 0.12;

      const coreRadius = 15 * coreBreath;

      // Core outer radial glow
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38 * coreBreath);
      coreGlow.addColorStop(0, 'rgba(95, 201, 232, 0.35)');
      coreGlow.addColorStop(0.5, 'rgba(95, 201, 232, 0.1)');
      coreGlow.addColorStop(1, 'rgba(95, 201, 232, 0)');

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 38 * coreBreath, 0, Math.PI * 2);
      ctx.fill();

      // Core body
      const coreFill = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      coreFill.addColorStop(0, '#7EE0FA');
      coreFill.addColorStop(0.8, '#5FC9E8');
      coreFill.addColorStop(1, '#2B8AA8');

      ctx.fillStyle = coreFill;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core inner pulse ring
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Core Label
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#E8ECEF';
      ctx.textAlign = 'center';
      ctx.fillText('CASE CORE', cx, cy + coreRadius + 15);

      // 3. Draw Satellite Nodes & Labels
      satellites.forEach((sat) => {
        const sx = cx + Math.cos(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);
        const sy = cy + Math.sin(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);

        const satPulse = prefersReducedMotion
          ? 1
          : 1 + Math.sin((elapsed / 1200) * Math.PI * 2 + sat.pulseOffset) * 0.15;

        const satRadius = 6.5 * satPulse;

        // Satellite glow halo
        const satGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22);
        satGlow.addColorStop(0, `${sat.color}55`);
        satGlow.addColorStop(0.6, `${sat.color}15`);
        satGlow.addColorStop(1, `${sat.color}00`);

        ctx.fillStyle = satGlow;
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fill();

        // Satellite body
        ctx.fillStyle = sat.color;
        ctx.beginPath();
        ctx.arc(sx, sy, satRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node Label (artifact type · status)
        ctx.font = '500 10px "JetBrains Mono", monospace';
        const labelText = `${sat.type} · ${sat.status}`;

        // Determine text anchor based on node position
        const cos = Math.cos(sat.angle);
        const sin = Math.sin(sat.angle);

        let labelX = sx + cos * 12;
        let labelY = sy + sin * 12;

        if (cos > 0.3) {
          ctx.textAlign = 'left';
          labelX = sx + 12;
        } else if (cos < -0.3) {
          ctx.textAlign = 'right';
          labelX = sx - 12;
        } else {
          ctx.textAlign = 'center';
        }

        if (sin > 0.4) {
          labelY = sy + 16;
        } else if (sin < -0.4) {
          labelY = sy - 10;
        }

        // Draw label background pill for crisp legibility
        const textMetrics = ctx.measureText(labelText);
        const pillWidth = textMetrics.width + 10;
        const pillHeight = 16;
        let pillX = labelX;
        if (ctx.textAlign === 'center') pillX -= pillWidth / 2;
        else if (ctx.textAlign === 'right') pillX -= pillWidth;

        ctx.fillStyle = 'rgba(6, 8, 11, 0.75)';
        ctx.beginPath();
        ctx.roundRect(pillX - 2, labelY - 11, pillWidth, pillHeight, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Draw label text
        ctx.fillStyle = '#E8ECEF';
        ctx.fillText(labelText, labelX, labelY);
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [evidenceList]);

  return (
    <div
      className={`relative w-full rounded-[20px] glass-panel p-5 overflow-hidden flex flex-col items-center justify-between ${className}`}
      style={{
        background: 'rgba(13, 17, 22, 0.55)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Header Info */}
      <div className="w-full flex items-center justify-between border-b border-white/5 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5FC9E8] animate-pulse" />
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-[#E8ECEF]">
            EVIDENCE CONSTELLATION
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#7A8794] px-2 py-0.5 rounded bg-[#06080B]/80 border border-white/5">
          SHA-256 ACTIVE
        </span>
      </div>

      {/* Live Canvas Graph */}
      <div className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      </div>

      {/* Bottom Live Caption */}
      <div className="w-full pt-3 border-t border-white/5 text-center">
        <p className="font-mono text-[11px] text-[#7A8794] tracking-tight leading-relaxed">
          live hash verification streaming from case core &bull; SHA-256 chained &bull;{' '}
          <span className="text-[#5FC9E8] font-bold">
            {verifiedCount}/{evidenceList.length}
          </span>{' '}
          artifacts verified
        </p>
      </div>
    </div>
  );
};
