import React, { useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { EvidenceItem } from '../types';

export interface ConstellationHandle {
  /**
   * Re-measure the canvas backing buffer and restart the draw loop.
   * Call this after the parent accordion animation has fully settled so that
   * getBoundingClientRect() returns real pixel dimensions (not 0×0).
   */
  remeasure: () => void;
}

interface EvidenceConstellationProps {
  evidence?: EvidenceItem[];
  caseTitle?: string;
  className?: string;
  variant?: 'full' | 'preview';
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

// Fallback for Safari < 16.4 where CanvasRenderingContext2D.prototype.roundRect is not supported
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}

export const EvidenceConstellation = forwardRef<ConstellationHandle, EvidenceConstellationProps>(
function EvidenceConstellation({
  evidence = [],
  caseTitle = 'Case Core',
  className = '',
  variant = 'full',
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stable ref to the remeasure function — set inside useEffect so it closes
  // over the correct canvas/ctx/draw references from that effect run.
  const remeasureRef = useRef<() => void>(() => {});

  // Fallback demo data when no real evidence is passed
  const evidenceList = useMemo(() => {
    if (evidence && evidence.length > 0) {
      return evidence.slice(0, 8);
    }
    return [
      { id: 'ev-1', type: 'message', title: 'SMS Coercion', riskLevel: 'Critical', riskScore: 92 },
      { id: 'ev-2', type: 'url', title: 'Reverse Proxy Link', riskLevel: 'High', riskScore: 88 },
      { id: 'ev-3', type: 'screenshot', title: '2FA Prompt Spam', riskLevel: 'Medium', riskScore: 68 },
      { id: 'ev-4', type: 'audio', title: 'Voicemail Spoof', riskLevel: 'Low', riskScore: 35 },
      { id: 'ev-5', type: 'video', title: 'Deepfake Cam Feed', riskLevel: 'Critical', riskScore: 84 },
    ] as EvidenceItem[];
  }, [evidence]);

  const verifiedCount = useMemo(() => evidenceList.length, [evidenceList]);

  // Expose remeasure() imperatively so InvestigationWorkspace can call it
  // from onAnimationComplete after the accordion finishes expanding.
  useImperativeHandle(ref, () => ({
    remeasure: () => remeasureRef.current(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    let animationFrameId: number;

    // -------------------------------------------------------------------------
    // Size the canvas backing buffer from container / getBoundingClientRect.
    // Returns true if we got real (non-zero) dimensions, false if still collapsed.
    // ctx.setTransform resets the scale so re-applying dpr scale is always clean.
    // -------------------------------------------------------------------------
    const setCanvasDimensions = (): boolean => {
      const container = canvas.parentElement;
      const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Log so we can verify in the browser console the dimensions are non-zero
      console.log('[EvidenceConstellation] setCanvasDimensions →', { w, h });

      if (w === 0 || h === 0) return false; // still inside a height:0 container

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Reset transform before re-scaling (required after canvas.width/height change)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      return true;
    };

    // -------------------------------------------------------------------------
    // Build satellite node configs from evidence data
    // -------------------------------------------------------------------------
    const count = Math.max(1, evidenceList.length);
    const satellites: SatelliteNode[] = evidenceList.map((item, idx) => {
      let color = '#5FC9E8';
      let status = 'verified';

      const riskScore = item.riskScore ?? 50;
      const riskLevel = item.riskLevel?.toLowerCase() ?? '';

      if (riskLevel === 'critical' || riskScore >= 80) {
        color = '#D9705A'; status = 'high risk';
      } else if (riskLevel === 'high' || riskScore >= 65) {
        color = '#D9705A'; status = 'flagged';
      } else if (riskLevel === 'medium' || riskScore >= 45) {
        color = '#E0A458'; status = 'suspicious';
      } else {
        color = '#5FC9E8'; status = 'verified';
      }

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

    const startTime = performance.now();

    // -------------------------------------------------------------------------
    // DRAW — reads canvas.width/height (backing buffer px) NOT getBoundingClientRect.
    // This way it always has valid, real dimensions even if the CSS layout reports
    // a clipped/zero rect due to overflow:hidden on an ancestor.
    // -------------------------------------------------------------------------
    let firstFrame = true; // used to emit a one-time diagnostic log per effect run
    const draw = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const dpr = window.devicePixelRatio || 1;

      // Use the actual backing buffer dimensions (set by setCanvasDimensions)
      // divided by dpr to get logical (CSS) pixel dimensions for drawing.
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (width === 0 || height === 0) {
        // Canvas not sized yet — keep the loop alive; ResizeObserver/remeasure will fire
        if (!prefersReducedMotion) animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // One-time log: confirms backing-buffer dimensions at the moment drawing
      // actually begins. Useful to verify Safari received a real size from remeasure().
      if (firstFrame) {
        console.log('[EvidenceConstellation] draw() first frame →', {
          width,
          height,
          dpr,
          canvasW: canvas.width,
          canvasH: canvas.height,
          ua: navigator.userAgent.match(/(Chrome|Safari|Firefox|Edge)\/[\d.]+/)?.[0] ?? 'unknown',
        });
        firstFrame = false;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 6;

      const orbitRadius = Math.min(width, height) * (variant === 'preview' ? 0.33 : 0.37);

      // 1. Connecting Lines & Hash Verification Packets
      satellites.forEach((sat) => {
        const sx = cx + Math.cos(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);
        const sy = cy + Math.sin(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = 'rgba(95, 201, 232, 0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (!prefersReducedMotion) {
          sat.packetProgress = (sat.packetProgress + sat.packetSpeed) % 1;
        }

        const t = sat.packetProgress;
        const px = cx + (sx - cx) * t;
        const py = cy + (sy - cy) * t;

        const packetGlow = ctx.createRadialGradient(px, py, 0, px, py, 7);
        packetGlow.addColorStop(0, '#5FC9E8');
        packetGlow.addColorStop(0.4, 'rgba(95, 201, 232, 0.6)');
        packetGlow.addColorStop(1, 'rgba(95, 201, 232, 0)');
        ctx.fillStyle = packetGlow;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });

      // 2. Central "Core" Node
      const coreBreath = prefersReducedMotion
        ? 1
        : 1 + Math.sin((elapsed / 1600) * Math.PI * 2) * 0.12;
      const coreBaseRadius = variant === 'preview' ? 11 : 15;
      const coreRadius = coreBaseRadius * coreBreath;

      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, (variant === 'preview' ? 28 : 38) * coreBreath);
      coreGlow.addColorStop(0, 'rgba(95, 201, 232, 0.35)');
      coreGlow.addColorStop(0.5, 'rgba(95, 201, 232, 0.1)');
      coreGlow.addColorStop(1, 'rgba(95, 201, 232, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, (variant === 'preview' ? 28 : 38) * coreBreath, 0, Math.PI * 2);
      ctx.fill();

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

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.font = variant === 'preview' ? '600 8.5px "JetBrains Mono", monospace' : '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#E8ECEF';
      ctx.textAlign = 'center';
      ctx.fillText('CASE CORE', cx, cy + coreRadius + (variant === 'preview' ? 11 : 15));

      // 3. Satellite Nodes & Labels
      satellites.forEach((sat) => {
        const sx = cx + Math.cos(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);
        const sy = cy + Math.sin(sat.angle) * orbitRadius * (sat.distanceRatio / 0.38);

        const satPulse = prefersReducedMotion
          ? 1
          : 1 + Math.sin((elapsed / 1200) * Math.PI * 2 + sat.pulseOffset) * 0.15;
        const satRadius = (variant === 'preview' ? 4.5 : 6.5) * satPulse;

        const satGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, variant === 'preview' ? 16 : 22);
        satGlow.addColorStop(0, `${sat.color}55`);
        satGlow.addColorStop(0.6, `${sat.color}15`);
        satGlow.addColorStop(1, `${sat.color}00`);
        ctx.fillStyle = satGlow;
        ctx.beginPath();
        ctx.arc(sx, sy, variant === 'preview' ? 16 : 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = sat.color;
        ctx.beginPath();
        ctx.arc(sx, sy, satRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = variant === 'preview' ? '500 8.5px "JetBrains Mono", monospace' : '500 10px "JetBrains Mono", monospace';
        const labelText = variant === 'preview' ? sat.type : `${sat.type} · ${sat.status}`;

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

        if (sin > 0.4) labelY = sy + 16;
        else if (sin < -0.4) labelY = sy - 10;

        const textMetrics = ctx.measureText(labelText);
        const pillWidth = textMetrics.width + (variant === 'preview' ? 6 : 10);
        const pillHeight = variant === 'preview' ? 13 : 16;
        let pillX = labelX;
        if (ctx.textAlign === 'center') pillX -= pillWidth / 2;
        else if (ctx.textAlign === 'right') pillX -= pillWidth;

        ctx.fillStyle = 'rgba(6, 8, 11, 0.75)';
        ctx.beginPath();
        drawRoundRect(ctx, pillX - 2, labelY - 11, pillWidth, pillHeight, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = '#E8ECEF';
        ctx.fillText(labelText, labelX, labelY);
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    // -------------------------------------------------------------------------
    // Assign remeasureRef BEFORE starting the animation loop so it is always
    // callable. onAnimationComplete in InvestigationWorkspace calls this after
    // the accordion expand fully settles — at that point getBoundingClientRect()
    // returns real dimensions, setCanvasDimensions succeeds, and draw() starts
    // with a properly-sized backing buffer.
    // -------------------------------------------------------------------------
    remeasureRef.current = () => {
      const ok = setCanvasDimensions();
      if (ok) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    // Attempt initial measure — may return false if still inside height:0
    setCanvasDimensions();

    // ResizeObserver on the parent container (the element whose height changes
    // during the AnimatePresence transition — the canvas has CSS 100%/100%).
    const container = canvas.parentElement;
    const resizeObserver = new ResizeObserver(() => {
      const ok = setCanvasDimensions();
      if (ok && !animationFrameId) {
        animationFrameId = requestAnimationFrame(draw);
      }
    });
    if (container) resizeObserver.observe(container);

    // Start the animation loop — draw() guards against 0×0 and loops until sized
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [evidenceList]);

  return (
    <div
      className={`relative w-full rounded-[20px] glass-panel overflow-hidden flex flex-col items-center justify-between ${
        variant === 'preview' ? 'p-3.5' : 'p-5'
      } ${className}`}
      style={{
        background: 'rgba(13, 17, 22, 0.55)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Header Info */}
      <div className={`w-full flex items-center justify-between border-b border-white/5 ${
        variant === 'preview' ? 'pb-2 mb-1.5' : 'pb-3 mb-2'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5FC9E8] animate-pulse" />
          <span className={`font-mono font-semibold tracking-wider uppercase text-[#E8ECEF] ${
            variant === 'preview' ? 'text-[10.5px]' : 'text-xs'
          }`}>
            EVIDENCE CONSTELLATION
          </span>
        </div>
        <span className={`font-mono text-[#7A8794] rounded bg-[#06080B]/80 border border-white/5 ${
          variant === 'preview' ? 'text-[9.5px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
        }`}>
          {variant === 'preview' ? 'SHA-256' : 'SHA-256 ACTIVE'}
        </span>
      </div>

      {/* Live Canvas Graph */}
      <div className={`relative w-full flex items-center justify-center ${
        variant === 'preview' ? 'h-[175px] sm:h-[190px]' : 'h-[280px] sm:h-[320px]'
      }`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Bottom Live Caption */}
      <div className={`w-full border-t border-white/5 text-center ${
        variant === 'preview' ? 'pt-2' : 'pt-3'
      }`}>
        <p className={`font-mono text-[#7A8794] tracking-tight leading-relaxed ${
          variant === 'preview' ? 'text-[10px]' : 'text-[11px]'
        }`}>
          {variant === 'preview' ? (
            <>
              <span className="text-[#5FC9E8] font-bold">
                {verifiedCount}/{evidenceList.length}
              </span>{' '}
              artifacts verified &bull; SHA-256 chained
            </>
          ) : (
            <>
              live hash verification streaming from case core &bull; SHA-256 chained &bull;{' '}
              <span className="text-[#5FC9E8] font-bold">
                {verifiedCount}/{evidenceList.length}
              </span>{' '}
              artifacts verified
            </>
          )}
        </p>
      </div>
    </div>
  );
});
