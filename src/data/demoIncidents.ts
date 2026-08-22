import { IncidentCase } from '../types';

export const DEMO_INCIDENTS: IncidentCase[] = [
  {
    id: 'inc-01',
    title: 'Targeted Credential Harvesting & Account Takeover Attempt',
    category: 'Phishing & Impersonation',
    summary: 'A multi-channel coercion campaign masquerading as IT Security urging an immediate password change via a lookalike domain, followed by suspicious session authorization requests.',
    dateReported: 'August 18, 2026',
    status: 'Investigating',
    overallRisk: 'High',
    riskScore: 84,
    evidence: [
      {
        id: 'ev-1',
        type: 'message',
        title: 'Urgent SMS Notification',
        content: '[ALERT-IT] Urgent: Your corporate workspace session will be suspended in 15 mins due to unauthorized login from Moscow, RU. Verify identity immediately: https://auth-verify-security.cloud/session?id=9928',
        timestamp: '10:14 AM',
        source: '+1 (800) 555-0192',
        riskScore: 92,
        riskLevel: 'Critical',
        indicators: [
          'High urgency coercive language',
          'Lookalike squatting domain (auth-verify-security.cloud)',
          'Unknown sender masking as IT team',
          'Shortened deadline pressure'
        ]
      },
      {
        id: 'ev-2',
        type: 'url',
        title: 'Lookalike Authentication Endpoint',
        content: 'https://auth-verify-security.cloud/session?id=9928',
        timestamp: '10:16 AM',
        riskScore: 88,
        riskLevel: 'High',
        indicators: [
          'Domain registered 48 hours ago',
          'Reverse proxy capturing 2FA tokens',
          'No valid organization SSL certificate matching brand'
        ],
        metadata: {
          'Registrar': 'NameCheap Inc (Privacy Shield)',
          'Hosting IP': '185.220.101.44 (Frankfurt)',
          'SSL Authority': 'Let\'s Encrypt (Issued yesterday)'
        }
      },
      {
        id: 'ev-3',
        type: 'screenshot',
        title: '2FA Push Notification Spammed',
        content: 'Multiple MFA prompt fatigue attempts received simultaneously within 2 minutes of accessing link.',
        timestamp: '10:20 AM',
        riskScore: 76,
        riskLevel: 'High',
        indicators: [
          'MFA Prompt Fatigue Attack pattern',
          'Sign-in initiated from unfamiliar GeoIP'
        ]
      }
    ],
    timeline: [
      {
        id: 't-1',
        timestamp: '10:14 AM',
        phase: 'Inception',
        title: 'Phishing SMS Dispatched to Victim Phone',
        description: 'Attacker leverages leaked phone number to deliver urgent lookalike domain lure.',
        relatedEvidenceIds: ['ev-1'],
        severity: 'high'
      },
      {
        id: 't-2',
        timestamp: '10:16 AM',
        phase: 'Contact',
        title: 'Victim visits suspicious link without submitting password',
        description: 'Endpoint loaded with reverse proxy proxying legitimate identity screen.',
        relatedEvidenceIds: ['ev-2'],
        severity: 'medium'
      },
      {
        id: 't-3',
        timestamp: '10:20 AM',
        phase: 'Escalation',
        title: 'Automated 2FA Prompt Spam Triggered',
        description: 'Attacker automated engine attempts to force approval on mobile authenticator.',
        relatedEvidenceIds: ['ev-3'],
        severity: 'critical'
      },
      {
        id: 't-4',
        timestamp: '10:24 AM',
        phase: 'Containment',
        title: 'SafeGuard AI Triage & Action Plan Generated',
        description: 'Incident preserved, sessions revoked, domain reported to Google Safe Browsing and registrar.',
        relatedEvidenceIds: ['ev-1', 'ev-2', 'ev-3'],
        severity: 'low'
      }
    ],
    actionPlan: [
      {
        id: 'act-1',
        category: 'Immediate Containment',
        title: 'Deny all pending MFA prompts & revoke active web sessions',
        description: 'Navigate to account security portal, hit "Sign out of all devices" to terminate attacker sessions.',
        priority: 'urgent',
        isCompleted: false,
        actionType: 'guide'
      },
      {
        id: 'act-2',
        category: 'Account Security',
        title: 'Rotate Primary Password & Transition to Passkey / Hardware Key',
        description: 'FIDO2 / WebAuthn passkeys are immune to adversary-in-the-middle reverse proxy phishing.',
        priority: 'urgent',
        isCompleted: false,
        actionType: 'checklist'
      },
      {
        id: 'act-3',
        category: 'Evidence Preservation',
        title: 'Preserve full SMS headers & link metadata for IC3 / CERT filing',
        description: 'Export structured SafeGuard incident report with timestamps and cryptographic hash.',
        priority: 'high',
        isCompleted: false,
        actionType: 'copy_text'
      },
      {
        id: 'act-4',
        category: 'Recovery & Reporting',
        title: 'Submit takedown notice to Cloudflare & Registrar',
        description: 'Report the active credential harvester to abuse@namecheap.com and Google Web Risk.',
        priority: 'recommended',
        isCompleted: false,
        actionType: 'external_link',
        actionTarget: 'https://safebrowsing.google.com/safebrowsing/report_phish/'
      }
    ],
    synthesis: {
      tacticsObserved: [
        'Adversary-in-the-Middle (AiTM) Proxy Phishing',
        'MFA Prompt Fatigue / Fatigue Bombing',
        'Smishing via spoofed shortcode'
      ],
      potentialImpact: 'High risk of unauthorized email / workspace access if session cookie or MFA push was accepted.',
      originAssessment: 'Automated phishing infrastructure hosted on bulletproof European range with Namecheap proxy.',
      recommendedLegalSteps: 'Preserve evidence hash and submit report to FTC.gov / IC3.gov if financial accounts were linked.'
    }
  },
  {
    id: 'inc-02',
    title: 'Extortion & Deepfake Video Harassment Coercion',
    category: 'Extortion & Harassment',
    summary: 'Anonymous adversary sent fabricated media claiming illicit camera recordings, demanding cryptocurrency payment within 48 hours.',
    dateReported: 'August 16, 2026',
    status: 'Contained',
    overallRisk: 'Medium',
    riskScore: 68,
    evidence: [
      {
        id: 'ev-4',
        type: 'email',
        title: 'Extortion Demand Email with Password Leak',
        content: 'From: anon-ops@proton-shield.me\nSubject: Final Notice regarding your private data\n\nI have compromised your device using Pegasus spyware. I recorded split-screen video from your front camera. Pay 0.25 BTC to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh or video will be distributed to your social contacts.\nYour old password was: Summer2023!',
        timestamp: '03:42 AM',
        riskScore: 72,
        riskLevel: 'High',
        indicators: [
          'Classic sextortion / extortion template',
          'Recycled breach credential used as bluff (Credential Stuffing)',
          'Untargeted generic claims without verifiable camera logs',
          'Bitcoin wallet extortion address'
        ]
      }
    ],
    timeline: [
      {
        id: 't-5',
        timestamp: '03:42 AM',
        phase: 'Contact',
        title: 'Mass extortion email delivered to inbox',
        description: 'Adversary leverages old public breach dump containing victim password from 2023.',
        relatedEvidenceIds: ['ev-4'],
        severity: 'medium'
      },
      {
        id: 't-6',
        timestamp: '04:10 AM',
        phase: 'Containment',
        title: 'SafeGuard AI Identifies Known Extortion Bluff Pattern',
        description: 'Analysis confirms zero malware presence on device; password matched 2023 public breach.',
        relatedEvidenceIds: ['ev-4'],
        severity: 'low'
      }
    ],
    actionPlan: [
      {
        id: 'act-5',
        category: 'Immediate Containment',
        title: 'Do NOT reply or send funds to extortionist',
        description: 'Payment confirms active email address and invites repeated, escalated extortion attempts.',
        priority: 'urgent',
        isCompleted: true,
        actionType: 'guide'
      },
      {
        id: 'act-6',
        category: 'Account Security',
        title: 'Verify password reuse across secondary services',
        description: 'Ensure "Summer2023!" is completely retired from banking, personal email, and cloud accounts.',
        priority: 'high',
        isCompleted: false,
        actionType: 'checklist'
      }
    ],
    synthesis: {
      tacticsObserved: [
        'Data breach credential regurgitation',
        'Psychological extortion bluff',
        'Cryptocurrency extortion'
      ],
      potentialImpact: 'Low technical risk (no device malware detected); psychological distress and spam risk.',
      originAssessment: 'Automated mass extortion botnet running against compromised breach databases.',
      recommendedLegalSteps: 'Report message to FBI IC3 and flag address to Chainalysis extortion tracking.'
    }
  }
];
