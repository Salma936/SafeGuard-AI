import { ThreatAnalysisResult, AnalyticsSummary } from '../types';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error) {
        errorMessage = errData.error;
      } else if (errData.detail) {
        errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // Use status string
    }
    throw new Error(errorMessage);
  }
  return (await response.json()) as T;
}

export async function analyzeSuspiciousText(message: string): Promise<ThreatAnalysisResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Please enter a message to analyze.');
  }

  const response = await fetch('/api/analyze/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed, message: trimmed })
  });

  return handleResponse<ThreatAnalysisResult>(response);
}

export async function analyzeSuspiciousUrl(url: string): Promise<ThreatAnalysisResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('Please enter a URL to analyze.');
  }

  const response = await fetch('/api/analyze/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: trimmed })
  });

  return handleResponse<ThreatAnalysisResult>(response);
}

export async function analyzeSuspiciousImage(imageB64: string, mimeType: string = 'image/png'): Promise<ThreatAnalysisResult> {
  if (!imageB64) {
    throw new Error('Please select an image file to analyze.');
  }

  const response = await fetch('/api/analyze/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_b64: imageB64, mime_type: mimeType })
  });

  return handleResponse<ThreatAnalysisResult>(response);
}

export async function analyzeSuspiciousAudio(audioB64: string, mimeType: string = 'audio/mp3'): Promise<ThreatAnalysisResult> {
  if (!audioB64) {
    throw new Error('Please select an audio file to analyze.');
  }

  const response = await fetch('/api/analyze/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_b64: audioB64, mime_type: mimeType })
  });

  return handleResponse<ThreatAnalysisResult>(response);
}

export async function createIncident(incidentData: { title: string; category?: string; summary?: string; risk_level?: string; threat_type?: string }): Promise<any> {
  const response = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentData)
  });
  return handleResponse<any>(response);
}

export async function getIncidents(): Promise<any[]> {
  const response = await fetch('/api/incidents');
  return handleResponse<any[]>(response);
}

export async function getIncidentById(incidentId: string): Promise<any> {
  const response = await fetch(`/api/incidents/${incidentId}`);
  return handleResponse<any>(response);
}

export async function addIncidentEvidence(incidentId: string, evidenceData: { type: string; title?: string; content?: string; file_b64?: string; filename?: string }): Promise<any> {
  const response = await fetch(`/api/incidents/${incidentId}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evidenceData)
  });
  return handleResponse<any>(response);
}

export async function getIncidentTimeline(incidentId: string): Promise<any[]> {
  const response = await fetch(`/api/incidents/${incidentId}/timeline`);
  return handleResponse<any[]>(response);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await fetch('/api/analytics/summary');
  return handleResponse<AnalyticsSummary>(response);
}
