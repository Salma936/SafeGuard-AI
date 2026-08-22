import 'dotenv/config';
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import {
  analyzeSuspiciousMessage,
  analyzeSuspiciousUrl,
  analyzeSuspiciousImage,
  analyzeSuspiciousAudio
} from './server/analyzeService';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-memory store for Node local development persistence fallback
const incidentsStore = new Map<string, any>();
const evidenceStore = new Map<string, any[]>();
const analyticsLog: any[] = [];

// Seed an initial incident case
const seedIncId = 'inc-demo-1';
incidentsStore.set(seedIncId, {
  incident_id: seedIncId,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status: 'INVESTIGATING',
  risk_level: 'HIGH',
  threat_type: 'Phishing',
  summary: 'Suspicious credential harvesting email targeting corporate account.',
  evidence_ids: ['ev-1'],
  timeline: [
    {
      id: 't-1',
      timestamp: '10:32',
      phase: 'Contact',
      title: 'Suspicious phishing message received',
      description: 'Deceptive email claiming urgent account suspension.',
      relatedEvidenceIds: ['ev-1'],
      severity: 'high'
    }
  ],
  recommendations: [
    {
      id: 'act-1',
      category: 'Immediate Containment',
      title: 'Do not click links or provide credentials',
      description: 'Cease any further interaction with sender immediately.',
      priority: 'urgent',
      isCompleted: false,
      actionType: 'guide'
    }
  ]
});
evidenceStore.set(seedIncId, [
  {
    evidence_id: 'ev-1',
    incident_id: seedIncId,
    type: 'text',
    filename: 'phishing_message.txt',
    content_location: 'memory://ev-1',
    created_at: new Date().toISOString(),
    sha256_hash: crypto.createHash('sha256').update('seed message content').digest('hex'),
    analysis_status: 'COMPLETED'
  }
]);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'SafeGuard AI Engine', version: '2.4.0', model: 'gemini-3.6-flash' });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'SafeGuard AI Engine', version: '2.4.0', model: 'gemini-3.6-flash' });
});

// Text Analysis Endpoint
const handleTextAnalysis = async (req: Request, res: Response) => {
  try {
    const text = req.body.text || req.body.message;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Missing or empty "text" or "message" field in request body.' });
      return;
    }
    const result = await analyzeSuspiciousMessage(text);
    analyticsLog.push({ timestamp: new Date().toISOString(), event: 'analysis_completed', type: 'text', risk: result.risk_level });
    res.json(result);
  } catch (error: any) {
    console.error('Error in text analysis:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while analyzing the text.' });
  }
};

app.post('/api/analyze/text', handleTextAnalysis);
app.post('/api/analyze', handleTextAnalysis);

// URL Analysis Endpoint
app.post('/api/analyze/url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      res.status(400).json({ error: 'Missing or empty "url" field in request body.' });
      return;
    }
    const result = await analyzeSuspiciousUrl(url);
    analyticsLog.push({ timestamp: new Date().toISOString(), event: 'analysis_completed', type: 'url', risk: result.risk_level });
    res.json(result);
  } catch (error: any) {
    console.error('Error in URL analysis:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while analyzing the URL.' });
  }
});

// Image Analysis Endpoint
app.post('/api/analyze/image', async (req: Request, res: Response) => {
  try {
    const { image_b64, mime_type } = req.body;
    if (!image_b64) {
      res.status(400).json({ error: 'Missing "image_b64" field in request body.' });
      return;
    }
    const result = await analyzeSuspiciousImage(image_b64, mime_type || 'image/png');
    analyticsLog.push({ timestamp: new Date().toISOString(), event: 'analysis_completed', type: 'image', risk: result.risk_level });
    res.json(result);
  } catch (error: any) {
    console.error('Error in image analysis:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while analyzing the image.' });
  }
});

// Audio Analysis Endpoint
app.post('/api/analyze/audio', async (req: Request, res: Response) => {
  try {
    const { audio_b64, mime_type } = req.body;
    if (!audio_b64) {
      res.status(400).json({ error: 'Missing "audio_b64" field in request body.' });
      return;
    }
    const result = await analyzeSuspiciousAudio(audio_b64, mime_type || 'audio/mp3');
    analyticsLog.push({ timestamp: new Date().toISOString(), event: 'analysis_completed', type: 'audio', risk: result.risk_level });
    res.json(result);
  } catch (error: any) {
    console.error('Error in audio analysis:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while analyzing the audio.' });
  }
});

// Incident Management Endpoints
app.post('/api/incidents', (req: Request, res: Response) => {
  const { title, category, summary, status, risk_level, threat_type } = req.body;
  const inc_id = `inc-${Date.now()}`;
  const now = new Date().toISOString();

  const newIncident = {
    incident_id: inc_id,
    created_at: now,
    updated_at: now,
    status: status || 'NEW',
    risk_level: risk_level || 'MEDIUM',
    threat_type: threat_type || 'Other Suspicious Activity',
    summary: summary || title || 'New digital safety incident.',
    evidence_ids: [],
    timeline: [
      {
        id: `t-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phase: 'Inception',
        title: 'Investigation Initiated',
        description: summary || title || 'Incident case opened.',
        severity: (risk_level || 'medium').toLowerCase()
      }
    ],
    recommendations: []
  };

  incidentsStore.set(inc_id, newIncident);
  evidenceStore.set(inc_id, []);
  analyticsLog.push({ timestamp: now, event: 'incident_created', incident_id: inc_id });

  res.status(201).json(newIncident);
});

app.get('/api/incidents', (_req: Request, res: Response) => {
  res.json(Array.from(incidentsStore.values()));
});

app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidentsStore.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: `Incident '${req.params.id}' not found.` });
    return;
  }
  res.json(incident);
});

app.put('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = incidentsStore.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: `Incident '${req.params.id}' not found.` });
    return;
  }
  const updated = {
    ...incident,
    ...req.body,
    updated_at: new Date().toISOString()
  };
  incidentsStore.set(req.params.id, updated);
  res.json(updated);
});

app.delete('/api/incidents/:id', (req: Request, res: Response) => {
  if (!incidentsStore.has(req.params.id)) {
    res.status(404).json({ error: `Incident '${req.params.id}' not found.` });
    return;
  }
  incidentsStore.delete(req.params.id);
  evidenceStore.delete(req.params.id);
  res.json({ message: `Incident '${req.params.id}' deleted.` });
});

// Timeline Endpoint
app.get('/api/incidents/:id/timeline', (req: Request, res: Response) => {
  const incident = incidentsStore.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: `Incident '${req.params.id}' not found.` });
    return;
  }
  res.json(incident.timeline || []);
});

// Evidence Endpoints
app.post('/api/incidents/:id/evidence', async (req: Request, res: Response) => {
  const incident = incidentsStore.get(req.params.id);
  if (!incident) {
    res.status(404).json({ error: `Incident '${req.params.id}' not found.` });
    return;
  }

  const { type, title, content, file_b64, filename } = req.body;
  const ev_id = `ev-${Date.now()}`;
  const evContent = content || title || 'Evidence content';
  const sha256_hash = crypto.createHash('sha256').update(evContent).digest('hex');

  let analysis_result = null;
  try {
    if (type === 'url') {
      analysis_result = await analyzeSuspiciousUrl(evContent);
    } else if ((type === 'image' || type === 'screenshot') && file_b64) {
      analysis_result = await analyzeSuspiciousImage(file_b64);
    } else if (type === 'audio' && file_b64) {
      analysis_result = await analyzeSuspiciousAudio(file_b64);
    } else {
      analysis_result = await analyzeSuspiciousMessage(evContent);
    }
  } catch (err: any) {
    console.error('Evidence analysis error:', err);
  }

  const evRecord = {
    evidence_id: ev_id,
    incident_id: req.params.id,
    type: type || 'text',
    filename: filename || `${ev_id}.txt`,
    content_location: `memory://${ev_id}`,
    created_at: new Date().toISOString(),
    sha256_hash,
    analysis_status: analysis_result ? 'COMPLETED' : 'FAILED',
    analysis_result
  };

  const list = evidenceStore.get(req.params.id) || [];
  list.push(evRecord);
  evidenceStore.set(req.params.id, list);

  incident.evidence_ids.push(ev_id);
  if (analysis_result) {
    incident.risk_level = analysis_result.risk_level;
    incident.threat_type = analysis_result.threat_type;
  }
  incidentsStore.set(req.params.id, incident);

  analyticsLog.push({ timestamp: new Date().toISOString(), event: 'evidence_uploaded', incident_id: req.params.id, evidence_type: type });

  res.status(201).json(evRecord);
});

app.get('/api/incidents/:id/evidence', (req: Request, res: Response) => {
  const list = evidenceStore.get(req.params.id) || [];
  res.json(list);
});

// Analytics Summary Endpoint
app.get('/api/analytics/summary', (_req: Request, res: Response) => {
  let highRisk = 0;
  let criticalRisk = 0;
  const threatCounts: Record<string, number> = {};

  incidentsStore.forEach((inc) => {
    if (inc.risk_level === 'HIGH') highRisk++;
    if (inc.risk_level === 'CRITICAL') criticalRisk++;
    threatCounts[inc.threat_type || 'Other'] = (threatCounts[inc.threat_type || 'Other'] || 0) + 1;
  });

  res.json({
    total_incidents: incidentsStore.size,
    high_risk_incidents: highRisk,
    critical_risk_incidents: criticalRisk,
    threats_by_type: threatCounts,
    evidence_processed: Array.from(evidenceStore.values()).reduce((acc, curr) => acc + curr.length, 0),
    total_analytics_events: analyticsLog.length
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile('index.html', { root: 'dist' });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => {
    console.log(`SafeGuard AI Server running at http://localhost:${port}`);
  });
}

export default app;
