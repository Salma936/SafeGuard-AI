import { ThreatAnalysisResult, AnalyticsSummary, ForensicsAnalysisResult } from '../types';

export const DEFAULT_TIMEOUT_MS = 18000;

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Robust fetch wrapper with timeout (15-20s) and AbortController integration.
 * Prevents requests from hanging indefinitely.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...fetchOptions } = options;

  const controller = new AbortController();
  let isTimeout = false;

  const timerId = setTimeout(() => {
    isTimeout = true;
    controller.abort();
  }, timeoutMs);

  let onExternalAbort: (() => void) | undefined;
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timerId);
      controller.abort();
    } else {
      onExternalAbort = () => {
        clearTimeout(timerId);
        controller.abort();
      };
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const isDev = Boolean((import.meta as any)?.env?.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'));
  const endpointStr = typeof input === 'string' ? input : (input as Request).url || 'endpoint';
  const startTime = Date.now();

  if (isDev) {
    console.log(`[SafeGuard API] Request started: ${fetchOptions.method || 'GET'} ${endpointStr}`);
  }

  try {
    const response = await fetch(input, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (isDev) {
      console.log(
        `[SafeGuard API] Request completed: ${fetchOptions.method || 'GET'} ${endpointStr} - HTTP ${response.status} (${Date.now() - startTime}ms)`
      );
    }

    return response;
  } catch (err: any) {
    if (isTimeout) {
      if (isDev) {
        console.warn(`[SafeGuard API] Request timed out after ${timeoutMs}ms: ${endpointStr}`);
      }
      throw new Error('Analysis timed out. The analysis service did not respond in time. Please try again.');
    }

    if (err.name === 'AbortError' || controller.signal.aborted) {
      if (isDev) {
        console.log(`[SafeGuard API] Request aborted: ${endpointStr}`);
      }
      throw new Error('Analysis request was cancelled.');
    }

    if (isDev) {
      console.error(`[SafeGuard API] Network failure for ${endpointStr}:`, err?.message || err);
    }
    throw new Error(err?.message || 'Network error: Unable to connect to the SafeGuard analysis engine.');
  } finally {
    clearTimeout(timerId);
    if (externalSignal && onExternalAbort) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Validates and sanitizes the shape of ThreatAnalysisResult returned from the backend.
 * Ensures that no field is undefined or crashes the frontend UI.
 */
export function validateThreatAnalysisResult(raw: any): ThreatAnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Analysis returned an invalid or empty response. Please try again.');
  }

  const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const rawLevel = typeof raw.risk_level === 'string' ? raw.risk_level.toUpperCase() : 'MEDIUM';
  const risk_level = validRiskLevels.includes(rawLevel)
    ? (rawLevel as ThreatAnalysisResult['risk_level'])
    : 'MEDIUM';

  const risk_score =
    typeof raw.risk_score === 'number' && !isNaN(raw.risk_score)
      ? Math.max(0, Math.min(100, Math.round(raw.risk_score)))
      : 50;

  const confidence =
    typeof raw.confidence === 'number' && !isNaN(raw.confidence)
      ? Math.max(0, Math.min(100, Math.round(raw.confidence)))
      : 85;

  const threat_type =
    typeof raw.threat_type === 'string' && raw.threat_type.trim()
      ? raw.threat_type.trim()
      : 'Other Suspicious Activity';

  const summary =
    typeof raw.summary === 'string' && raw.summary.trim()
      ? raw.summary.trim()
      : 'Suspicious digital activity detected.';

  const explanation =
    typeof raw.explanation === 'string' && raw.explanation.trim()
      ? raw.explanation.trim()
      : summary;

  return {
    incident_id:
      typeof raw.incident_id === 'string' && raw.incident_id.trim()
        ? raw.incident_id.trim()
        : `inc-${Date.now().toString(16)}`,
    risk_level,
    risk_score,
    confidence,
    threat_type: threat_type as any,
    coercive_media_threat_detected: Boolean(raw.coercive_media_threat_detected),
    summary,
    explanation,
    explanation_simple: raw.explanation_simple || explanation,
    warning_signs: Array.isArray(raw.warning_signs) ? raw.warning_signs : [],
    indicators: Array.isArray(raw.indicators) ? raw.indicators : [],
    tactics_observed: Array.isArray(raw.tactics_observed) ? raw.tactics_observed : [],
    recommended_actions: Array.isArray(raw.recommended_actions) ? raw.recommended_actions : [],
    affected_accounts: Array.isArray(raw.affected_accounts) ? raw.affected_accounts : [],
    evidence_relationships: Array.isArray(raw.evidence_relationships) ? raw.evidence_relationships : [],
    timeline_events: Array.isArray(raw.timeline_events) ? raw.timeline_events : [],
    potential_impact: raw.potential_impact || '',
    origin_assessment: raw.origin_assessment || '',
    observed_evidence: Array.isArray(raw.observed_evidence) ? raw.observed_evidence : [],
    ai_inference: Array.isArray(raw.ai_inference) ? raw.ai_inference : [],
    uncertainty: Array.isArray(raw.uncertainty) ? raw.uncertainty : [],
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      let rawMsg = '';
      if (errData.detail) {
        rawMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      } else if (errData.error) {
        rawMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
      }

      if (rawMsg) {
        const lower = rawMsg.toLowerCase();
        if (rawMsg.includes('RESOURCE_EXHAUSTED') || lower.includes('quota exceeded') || rawMsg.includes('429')) {
          errorMessage = 'AI analysis rate limit or quota exceeded. Please wait a moment and try again.';
        } else if (lower.includes('rate limit')) {
          errorMessage = 'Rate limit reached. Please wait a moment before trying again.';
        } else if (lower.includes('api_key') || lower.includes('credentials')) {
          errorMessage = 'AI service authentication error. Please verify server configuration.';
        } else if (rawMsg.length > 200) {
          errorMessage = rawMsg.slice(0, 197) + '...';
        } else {
          errorMessage = rawMsg;
        }
      }
    } catch {
      if (response.status === 400) errorMessage = 'Invalid evidence submission. Please check your input.';
      else if (response.status === 401) errorMessage = 'Unauthorized request. Please log in again.';
      else if (response.status === 403) errorMessage = 'Access forbidden.';
      else if (response.status === 404) errorMessage = 'Analysis service endpoint not found.';
      else if (response.status === 429) errorMessage = 'Analysis rate limit reached. Please wait a moment before trying again.';
      else if (response.status >= 500) errorMessage = 'Analysis service error. Please try again in a few moments.';
    }
    throw new Error(errorMessage);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('Analysis service returned an unreadable response. Please try again.');
  }
}

export async function analyzeSuspiciousText(message: string, signal?: AbortSignal): Promise<ThreatAnalysisResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Please enter a message to analyze.');
  }

  const response = await fetchWithTimeout('/api/analyze/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed, message: trimmed }),
    signal
  });

  const parsed = await handleResponse<ThreatAnalysisResult>(response);
  return validateThreatAnalysisResult(parsed);
}

export async function analyzeSuspiciousUrl(url: string, signal?: AbortSignal): Promise<ThreatAnalysisResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('Please enter a URL to analyze.');
  }

  const response = await fetchWithTimeout('/api/analyze/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: trimmed }),
    signal
  });

  const parsed = await handleResponse<ThreatAnalysisResult>(response);
  return validateThreatAnalysisResult(parsed);
}

export async function analyzeSuspiciousImage(
  imageB64: string,
  mimeType: string = 'image/png',
  signal?: AbortSignal
): Promise<ThreatAnalysisResult> {
  if (!imageB64) {
    throw new Error('Please select an image file to analyze.');
  }

  const response = await fetchWithTimeout('/api/analyze/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_b64: imageB64, mime_type: mimeType }),
    signal
  });

  const parsed = await handleResponse<ThreatAnalysisResult>(response);
  return validateThreatAnalysisResult(parsed);
}

export async function analyzeSuspiciousAudio(
  audioB64: string,
  mimeType: string = 'audio/mp3',
  signal?: AbortSignal
): Promise<ThreatAnalysisResult> {
  if (!audioB64) {
    throw new Error('Please select an audio file to analyze.');
  }

  const response = await fetchWithTimeout('/api/analyze/audio/base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_b64: audioB64, mime_type: mimeType }),
    signal
  });

  const parsed = await handleResponse<ThreatAnalysisResult>(response);
  return validateThreatAnalysisResult(parsed);
}

export async function analyzeSuspiciousVideo(
  videoB64: string,
  mimeType: string = 'video/mp4',
  signal?: AbortSignal
): Promise<ThreatAnalysisResult> {
  if (!videoB64) {
    throw new Error('Please select a video file to analyze.');
  }

  const response = await fetchWithTimeout('/api/analyze/video/base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_b64: videoB64, mime_type: mimeType }),
    signal
  });

  const parsed = await handleResponse<ThreatAnalysisResult>(response);
  return validateThreatAnalysisResult(parsed);
}

export async function analyzeScreenshotForensics(file: File, signal?: AbortSignal): Promise<ForensicsAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithTimeout('/api/analyze-screenshot', {
    method: 'POST',
    body: formData,
    signal
  });

  return handleResponse<ForensicsAnalysisResult>(response);
}

export async function createIncident(incidentData: {
  title: string;
  category?: string;
  summary?: string;
  risk_level?: string;
  threat_type?: string;
}): Promise<any> {
  const response = await fetchWithTimeout('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentData)
  });
  return handleResponse<any>(response);
}

export async function getIncidents(): Promise<any[]> {
  const response = await fetchWithTimeout('/api/incidents');
  return handleResponse<any[]>(response);
}

export async function getIncidentById(incidentId: string): Promise<any> {
  const response = await fetchWithTimeout(`/api/incidents/${incidentId}`);
  return handleResponse<any>(response);
}

export async function addIncidentEvidence(
  incidentId: string,
  evidenceData: { type: string; title?: string; content?: string; file_b64?: string; filename?: string }
): Promise<any> {
  const response = await fetchWithTimeout(`/api/incidents/${incidentId}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evidenceData)
  });
  return handleResponse<any>(response);
}

export async function getIncidentTimeline(incidentId: string): Promise<any[]> {
  const response = await fetchWithTimeout(`/api/incidents/${incidentId}/timeline`);
  return handleResponse<any[]>(response);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await fetchWithTimeout('/api/analytics/summary');
  return handleResponse<AnalyticsSummary>(response);
}
