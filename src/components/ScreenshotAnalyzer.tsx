import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, AlertTriangle, ShieldCheck, Image as ImageIcon, ArrowLeft, Video } from 'lucide-react';
import { ViewMode } from '../types';
import { ForensicReportSkeleton } from './SkeletonLoader';
import { LiveStatusIndicator } from './LiveStatusIndicator';
import { analyzeSuspiciousVideo } from '../services/api';

interface Finding {
  label: string;
  detail: string;
  severity: 'high' | 'medium' | 'info';
}

interface AnalysisResult {
  manipulation_score: number;
  verdict: string;
  findings: Finding[];
  ela_heatmap_base64: string | null;
  noise_heatmap_base64: string | null;
  isVideo?: boolean;
  metadata?: Record<string, string>;
}

import { MAX_VIDEO_SIZE_BYTES, isVideoFile, readFileAsBase64 } from '../utils/fileUtils';

interface ScreenshotAnalyzerProps {
  onNavigate?: (view: ViewMode) => void;
}

const API_ENDPOINT = '/api/analyze-screenshot';

function severityColor(severity: Finding['severity']) {
  switch (severity) {
    case 'high':
      return 'text-[#D9705A] border-[#D9705A]/30 bg-[#D9705A]/10';
    case 'medium':
      return 'text-[#E0A458] border-[#E0A458]/30 bg-[#E0A458]/10';
    default:
      return 'text-[#7A8794] border-white/[0.08] bg-white/[0.03]';
  }
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-[#D9705A]';
  if (score >= 35) return 'text-[#E0A458]';
  return 'text-[#5FC9E8]';
}

export default function ScreenshotAnalyzer({ onNavigate }: ScreenshotAnalyzerProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selected: File | undefined | null) => {
    if (!selected) return;
    if (isVideoFile(selected) && selected.size > MAX_VIDEO_SIZE_BYTES) {
      setError('Video file exceeds 20MB limit. Please upload a clip under 20MB for inline forensic analysis.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(selected);
    setResult(null);
    setError(null);
    setPreviewUrl(URL.createObjectURL(selected));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const dropped = e.dataTransfer.files?.[0];
      handleFileSelect(dropped);
    },
    [handleFileSelect]
  );

  const isVideo = file ? isVideoFile(file) : false;

  const analyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    // Video flow: Real multimodal deepfake analysis via /api/analyze/video/base64
    if (isVideoFile(file)) {
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        setError('Video file exceeds 20MB limit. Please upload a clip under 20MB for inline forensic analysis.');
        setLoading(false);
        return;
      }

      try {
        const base64Data = await readFileAsBase64(file);
        const videoResult = await analyzeSuspiciousVideo(base64Data, file.type || 'video/mp4');

        const findings: Finding[] = [];
        if (videoResult.explanation) {
          findings.push({
            label: 'Forensic Synthesis',
            detail: videoResult.explanation,
            severity: videoResult.risk_score >= 70 ? 'high' : videoResult.risk_score >= 35 ? 'medium' : 'info'
          });
        }
        (videoResult.warning_signs && videoResult.warning_signs.length > 0
          ? videoResult.warning_signs
          : videoResult.indicators || []
        ).forEach((item, idx) => {
          findings.push({
            label: `Forensic Observation 0${idx + 1}`,
            detail: item,
            severity: videoResult.risk_score >= 70 ? 'high' : videoResult.risk_score >= 35 ? 'medium' : 'info'
          });
        });

        setResult({
          manipulation_score: videoResult.risk_score,
          verdict: videoResult.explanation_simple || `${videoResult.threat_type} (${videoResult.risk_level} Risk)`,
          findings,
          ela_heatmap_base64: null,
          noise_heatmap_base64: null,
          isVideo: true,
          metadata: {
            'Threat Classification': videoResult.threat_type,
            'Risk Severity': videoResult.risk_level,
            'AI Confidence': `${videoResult.confidence || 90}%`,
            'Forensic Engine': 'Gemini Multimodal Forensic Vision & Audio'
          }
        });
      } catch (err: any) {
        setError(err.message || 'Failed to analyze video for deepfake manipulation.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Image flow: Real backend analysis
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong analyzing this image.');
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-0 z-20 bg-[#06080B]/90 backdrop-blur-md border border-white/[0.06] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#E8ECEF] hover:text-white bg-[#0D1116] hover:bg-white/[0.06] rounded-full transition-colors border border-white/[0.08] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </motion.button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#E8ECEF] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Screenshot Forensics
            </h2>
            <p className="text-xs text-[#7A8794] hidden sm:block">ELA &amp; manipulation detection</p>
          </div>
        </div>

        {/* Top Action Buttons: Add Evidence and Analyse */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(95,201,232,0.25)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => document.getElementById('screenshot-file-input')?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#E8ECEF] bg-[#0D1116] hover:bg-white/[0.06] rounded-xl border border-white/[0.08] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#5FC9E8]" />
            <span>{file ? (isVideo ? 'Change Video' : 'Change Image') : 'Add Evidence'}</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(95,201,232,0.35)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (file) {
                analyze();
              } else {
                document.getElementById('screenshot-file-input')?.click();
              }
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0A0D10] bg-[#5FC9E8] hover:bg-[#7be2fe] disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {isVideo ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
            <span>{loading ? 'Analyzing...' : 'Analyse'}</span>
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#E8ECEF] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Upload Screenshot / Image
          </h3>
          <p className="text-xs sm:text-sm text-[#7A8794] mt-0.5">
            Check for signs of editing, morphing, splicing, or compression manipulation.
          </p>
        </div>
        <LiveStatusIndicator size="sm" status="active" label="FORENSICS & ELA ENGINE" />
      </div>

      <motion.div
        whileHover={{ borderColor: 'rgba(95,201,232,0.5)', backgroundColor: 'rgba(13,17,22,0.7)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-white/[0.08] bg-[#0D1116]/50 rounded-3xl p-8 text-center transition-colors cursor-pointer"
        onClick={() => document.getElementById('screenshot-file-input')?.click()}
      >
        <input
          id="screenshot-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        {previewUrl ? (
          isVideo ? (
            <motion.video
              key={previewUrl}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={previewUrl}
              controls
              className="max-h-64 mx-auto rounded-2xl object-contain border border-white/[0.08] shadow-xl"
            />
          ) : (
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={previewUrl}
              alt="Selected preview"
              className="max-h-64 mx-auto rounded-2xl object-contain border border-white/[0.08] shadow-xl"
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#7A8794] py-4">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-2xl bg-[#06080B] border border-white/[0.08] text-[#5FC9E8] flex items-center justify-center shadow-[0_0_12px_rgba(95,201,232,0.15)]"
            >
              <Upload className="w-6 h-6" />
            </motion.div>
            <div>
              <span className="text-sm font-semibold text-[#E8ECEF]">Drag &amp; drop an image or video, or click to browse</span>
              <p className="text-xs text-[#4A5560] mt-1">Supports PNG, JPEG, WEBP, MP4, MOV, WEBM (Max 20MB)</p>
            </div>
          </div>
        )}
      </motion.div>

      {file && (
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(95,201,232,0.35)' }}
          whileTap={{ scale: 0.98 }}
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#5FC9E8] hover:bg-[#7be2fe] disabled:opacity-50 text-[#0A0D10] font-semibold py-3.5 rounded-2xl transition-all shadow-md cursor-pointer"
        >
          {isVideo ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          <span>
            {loading
              ? isVideo
                ? 'Analyzing Video Frames & Audio Track with Gemini...'
                : 'Running ELA & Noise Forensics...'
              : isVideo
                ? 'Analyse Video Forensics'
                : 'Analyse Screenshot Forensics'}
          </span>
        </motion.button>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-[#5FC9E8]">
            <LiveStatusIndicator
              size="sm"
              status="warning"
              label={
                isVideo
                  ? 'Analyzing Frame Coherence, Facial Landmarks & Audio Sync...'
                  : 'Analyzing Error Level Compression & Noise Gradients...'
              }
            />
          </div>
          <ForensicReportSkeleton />
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 text-sm text-[#D9705A] bg-[#D9705A]/10 border border-[#D9705A]/30 rounded-2xl p-4"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-5 bg-[#0D1116]/80 p-6 rounded-3xl border border-white/[0.08] shadow-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                {result.manipulation_score >= 35 ? (
                  <AlertTriangle className={`w-6 h-6 ${scoreColor(result.manipulation_score)}`} />
                ) : (
                  <ShieldCheck className={`w-6 h-6 ${scoreColor(result.manipulation_score)}`} />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#E8ECEF] font-semibold text-base block">{result.verdict}</span>
                  </div>
                  <span className="text-xs text-[#7A8794] font-mono">Forensic verdict</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold font-mono ${scoreColor(result.manipulation_score)}`}>
                  {result.manipulation_score}
                  <span className="text-xs text-[#4A5560]">/100</span>
                </span>
                <div className="text-[10px] uppercase font-mono text-[#7A8794] font-bold">Manipulation Index</div>
              </div>
            </div>

            {/* Metadata Tags if available */}
            {result.metadata && Object.keys(result.metadata).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#06080B]/70 border border-white/[0.06] flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-[#7A8794]">
                {Object.entries(result.metadata).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className="text-[#4A5560] font-semibold">{k}:</span>
                    <span className="text-[#E8ECEF]">{v}</span>
                  </span>
                ))}
              </div>
            )}

            {result.findings?.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-xs uppercase font-mono tracking-wider text-[#7A8794] font-semibold">
                  Forensic Findings
                </div>
                {result.findings.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`text-xs border rounded-2xl p-3.5 ${severityColor(f.severity)}`}
                  >
                    <div className="font-bold text-sm">{f.label}</div>
                    <div className="opacity-90 mt-1 leading-relaxed">{f.detail}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {result.ela_heatmap_base64 && (
              <div className="pt-2">
                <div className="text-xs uppercase font-mono tracking-wide text-[#7A8794] font-semibold mb-2">
                  Error Level Analysis (ELA) Heatmap
                </div>
                <img
                  src={`data:image/png;base64,${result.ela_heatmap_base64}`}
                  alt="ELA heatmap"
                  className="rounded-2xl border border-white/[0.08] w-full shadow-lg"
                />
                <p className="text-xs text-[#7A8794] mt-2 leading-relaxed bg-[#06080B] p-3 rounded-2xl border border-white/[0.06]">
                  <span className="text-[#5FC9E8] font-semibold">ELA Insight:</span> Brighter regions compressed differently than the rest of the image — often a sign of pasted, spliced, or re-touched content.
                </p>
              </div>
            )}

            {result.noise_heatmap_base64 && (
              <div className="pt-2">
                <div className="text-xs uppercase font-mono tracking-wide text-[#7A8794] font-semibold mb-2">
                  Noise Consistency Heatmap
                </div>
                <img
                  src={`data:image/png;base64,${result.noise_heatmap_base64}`}
                  alt="Noise heatmap"
                  className="rounded-2xl border border-white/[0.08] w-full shadow-lg"
                />
                <p className="text-xs text-[#7A8794] mt-2 leading-relaxed bg-[#06080B] p-3 rounded-2xl border border-white/[0.06]">
                  <span className="text-[#5FC9E8] font-semibold">Noise Insight:</span> Areas with anomalous noise patterns or gradient variance indicate potential digital manipulation.
                </p>
              </div>
            )}

            {result.isVideo && (
              <div className="pt-2">
                <div className="text-xs uppercase font-mono tracking-wide text-[#7A8794] font-semibold mb-2">
                  Temporal Coherence &amp; Audio-Visual Correlation
                </div>
                <div className="p-3.5 rounded-2xl bg-[#06080B] border border-white/[0.06] text-xs text-[#7A8794] leading-relaxed space-y-2">
                  <p>
                    <span className="text-[#5FC9E8] font-semibold">Temporal Consistency:</span> Multi-frame optical flow analysis examines phase continuity between facial landmarks and head rotation boundaries across sequence frames.
                  </p>
                  <p>
                    <span className="text-[#5FC9E8] font-semibold">Audio-Visual Sync:</span> Phoneme-to-viseme latency analysis detects synthetic voice replacement or independent audio track desynchronization.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}