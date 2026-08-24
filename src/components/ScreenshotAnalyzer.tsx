import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, AlertTriangle, ShieldCheck, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { ViewMode } from '../types';
import { ForensicReportSkeleton } from './SkeletonLoader';
import { LiveStatusIndicator } from './LiveStatusIndicator';

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
}

interface ScreenshotAnalyzerProps {
  onNavigate?: (view: ViewMode) => void;
}

const API_ENDPOINT = '/api/analyze-screenshot';

function severityColor(severity: Finding['severity']) {
  switch (severity) {
    case 'high':
      return 'text-red-400 border-red-500/30 bg-red-500/10';
    case 'medium':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    default:
      return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
  }
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-red-400';
  if (score >= 35) return 'text-amber-400';
  return 'text-emerald-400';
}

export default function ScreenshotAnalyzer({ onNavigate }: ScreenshotAnalyzerProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selected: File | undefined | null) => {
    if (!selected) return;
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

  const analyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
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
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </motion.button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Screenshot Forensics</h2>
            <p className="text-xs text-slate-400 hidden sm:block">ELA &amp; manipulation detection</p>
          </div>
        </div>

        {/* Top Action Buttons: Add Evidence and Analyse */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(16,185,129,0.25)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => document.getElementById('screenshot-file-input')?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{file ? 'Change Image' : 'Add Evidence'}</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(16,185,129,0.35)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (file) {
                analyze();
              } else {
                document.getElementById('screenshot-file-input')?.click();
              }
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{loading ? 'Analyzing...' : 'Analyse'}</span>
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Upload Screenshot / Image</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Check for signs of editing, morphing, splicing, or compression manipulation.
          </p>
        </div>
        <LiveStatusIndicator size="sm" status="active" label="FORENSICS & ELA ENGINE" />
      </div>

      <motion.div
        whileHover={{ borderColor: 'rgba(16,185,129,0.5)', backgroundColor: 'rgba(15,23,42,0.7)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-800 bg-slate-900/50 rounded-3xl p-8 text-center transition-colors cursor-pointer"
        onClick={() => document.getElementById('screenshot-file-input')?.click()}
      >
        <input
          id="screenshot-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        {previewUrl ? (
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            src={previewUrl}
            alt="Selected preview"
            className="max-h-64 mx-auto rounded-2xl object-contain border border-slate-800 shadow-xl"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400 py-4">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            >
              <Upload className="w-6 h-6" />
            </motion.div>
            <div>
              <span className="text-sm font-semibold text-slate-200">Drag &amp; drop an image, or click to browse</span>
              <p className="text-xs text-slate-500 mt-1">Supports PNG, JPEG, WEBP (Max 15MB)</p>
            </div>
          </div>
        )}
      </motion.div>

      {file && (
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(16,185,129,0.35)' }}
          whileTap={{ scale: 0.98 }}
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-2xl transition-all shadow-md cursor-pointer"
        >
          <ImageIcon className="w-4 h-4" />
          <span>{loading ? 'Running ELA & Noise Forensics...' : 'Analyse Screenshot Forensics'}</span>
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
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <LiveStatusIndicator size="sm" status="warning" label="Analyzing Error Level Compression & Noise Gradients..." />
          </div>
          <ForensicReportSkeleton />
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-2xl p-4"
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
            className="space-y-5 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {result.manipulation_score >= 35 ? (
                  <AlertTriangle className={`w-6 h-6 ${scoreColor(result.manipulation_score)}`} />
                ) : (
                  <ShieldCheck className={`w-6 h-6 ${scoreColor(result.manipulation_score)}`} />
                )}
                <div>
                  <span className="text-white font-bold text-base block">{result.verdict}</span>
                  <span className="text-xs text-slate-400 font-mono">Forensic verdict</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold font-mono ${scoreColor(result.manipulation_score)}`}>
                  {result.manipulation_score}
                  <span className="text-xs text-slate-500">/100</span>
                </span>
                <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Manipulation Index</div>
              </div>
            </div>

            {result.findings?.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
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
                <div className="text-xs uppercase font-mono tracking-wide text-slate-400 font-semibold mb-2">
                  Error Level Analysis (ELA) Heatmap
                </div>
                <img
                  src={`data:image/png;base64,${result.ela_heatmap_base64}`}
                  alt="ELA heatmap"
                  className="rounded-2xl border border-slate-800 w-full shadow-lg"
                />
                <p className="text-xs text-slate-400 mt-2 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-emerald-400 font-semibold">ELA Insight:</span> Brighter regions compressed differently than the rest of the image — often a sign of pasted, spliced, or re-touched content.
                </p>
              </div>
            )}

            {result.noise_heatmap_base64 && (
              <div className="pt-2">
                <div className="text-xs uppercase font-mono tracking-wide text-slate-400 font-semibold mb-2">
                  Noise Consistency Heatmap
                </div>
                <img
                  src={`data:image/png;base64,${result.noise_heatmap_base64}`}
                  alt="Noise heatmap"
                  className="rounded-2xl border border-slate-800 w-full shadow-lg"
                />
                <p className="text-xs text-slate-400 mt-2 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-emerald-400 font-semibold">Noise Insight:</span> Areas with anomalous noise patterns or gradient variance indicate potential digital manipulation.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}