import React, { useState, useCallback } from "react";
import { Upload, AlertTriangle, ShieldCheck, Loader2, Image as ImageIcon } from "lucide-react";

/**
 * ScreenshotAnalyzer
 * ------------------
 * Uploads an image to POST /api/analyze-screenshot and renders the
 * manipulation score, findings, and ELA heatmap returned by the backend.
 *
 * Backend contract (see screenshot_router.py):
 * {
 *   manipulation_score: number (0-100),
 *   verdict: string,
 *   findings: [{ label, detail, severity }],
 *   ela_heatmap_base64: string | null,
 *   noise_heatmap_base64: string | null
 * }
 */

interface Finding {
  label: string;
  detail: string;
  severity: "high" | "medium" | "info";
}

interface AnalysisResult {
  manipulation_score: number;
  verdict: string;
  findings: Finding[];
  ela_heatmap_base64: string | null;
  noise_heatmap_base64: string | null;
}

const API_ENDPOINT = "/api/analyze-screenshot";

function severityColor(severity: Finding["severity"]) {
  switch (severity) {
    case "high":
      return "text-red-400 border-red-500/30 bg-red-500/10";
    case "medium":
      return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    default:
      return "text-slate-300 border-slate-500/30 bg-slate-500/10";
  }
}

function scoreColor(score: number) {
  if (score >= 70) return "text-red-400";
  if (score >= 35) return "text-amber-400";
  return "text-emerald-400";
}

export default function ScreenshotAnalyzer() {
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
      formData.append("file", file);

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong analyzing this image.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Screenshot Analyzer</h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload a screenshot or image to check for signs of editing or manipulation.
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-500 transition-colors cursor-pointer"
        onClick={() => document.getElementById("screenshot-file-input")?.click()}
      >
        <input
          id="screenshot-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected preview"
            className="max-h-48 mx-auto rounded-lg object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Upload className="w-8 h-8" />
            <span className="text-sm">Drag & drop an image, or click to browse</span>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4" /> Analyze Image
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.manipulation_score >= 35 ? (
                <AlertTriangle className={`w-5 h-5 ${scoreColor(result.manipulation_score)}`} />
              ) : (
                <ShieldCheck className={`w-5 h-5 ${scoreColor(result.manipulation_score)}`} />
              )}
              <span className="text-white font-medium">{result.verdict}</span>
            </div>
            <span className={`text-2xl font-bold ${scoreColor(result.manipulation_score)}`}>
              {result.manipulation_score}
              <span className="text-sm text-slate-500">/100</span>
            </span>
          </div>

          {result.findings?.length > 0 && (
            <div className="space-y-2">
              {result.findings.map((f, i) => (
                <div
                  key={i}
                  className={`text-sm border rounded-lg p-3 ${severityColor(f.severity)}`}
                >
                  <div className="font-medium">{f.label}</div>
                  <div className="opacity-80 mt-0.5">{f.detail}</div>
                </div>
              ))}
            </div>
          )}

          {result.ela_heatmap_base64 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">
                Error Level Analysis heatmap
              </div>
              <img
                src={`data:image/png;base64,${result.ela_heatmap_base64}`}
                alt="ELA heatmap"
                className="rounded-lg border border-slate-800 w-full"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Brighter regions compressed differently than the rest of the image —
                often (but not always) a sign of pasted or re-touched content.
              </p>
            </div>
          )}

          {result.noise_heatmap_base64 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">
                Noise Heatmap (possible morphing)
              </div>
              <img
                src={`data:image/png;base64,${result.noise_heatmap_base64}`}
                alt="Noise heatmap"
                className="rounded-lg border border-slate-800 w-full"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Areas with anomalous noise patterns may indicate image manipulation.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}