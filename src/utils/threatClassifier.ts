/**
 * SafeGuard AI - Threat Classification Utilities
 * Lightweight detection layer for coercive private-media threats (sextortion / NCII).
 */

/**
 * Evaluates whether a piece of communication contains BOTH:
 * 1. A coercion / extortion signal (e.g. demands for payment, compliance, or threats to leak/distribute/expose)
 * AND
 * 2. A threat involving private, intimate, or sensitive personal media (photos, videos, recordings, etc.)
 *
 * Designed with false-positive protection to ignore ordinary phishing, generic bills,
 * and benign messages mentioning photos/videos.
 */
export function detectCoerciveMediaThreat(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase();

  // 1. Private / Intimate Media Concepts
  const mediaPatterns = [
    /\b(?:private|intimate|nude|nudes|explicit|sexual|compromising|sensitive|personal|secret|illicit)\s+(?:photos?|pics?|pictures?|videos?|recordings?|footage|images?|media|content|clips?)\b/,
    /\b(?:photos?|pics?|pictures?|videos?|recordings?|footage|images?|media|clips?)\s+of\s+you\s+(?:naked|undressed|in\s+private)\b/,
    /\b(?:webcam|front\s*camera|camera)\s+(?:footage|recording|video|recordings)\b/,
    /\b(?:split-screen\s+video|masturbat\w*|explicit\s+material)\b/,
    /\b(?:nudes|intimate\s+footage|private\s+data\s+and\s+photos?)\b/
  ];

  let hasMedia = mediaPatterns.some((pattern) => pattern.test(t));
  if (
    !hasMedia &&
    /\b(?:recorded\s+you|compromised\s+your\s+(?:device|camera|webcam))\b/.test(t) &&
    /\b(?:video|footage|recording|photos?|pics?)\b/.test(t)
  ) {
    hasMedia = true;
  }

  if (!hasMedia) return false;

  // 2. Coercion / Extortion Concepts
  const coercionPatterns = [
    /\b(?:pay|send|transfer|give)\s+(?:me\s+)?(?:[\$€£₹]|\d+|money|cash|bitcoin|btc|crypto|funds|ransom)\b/,
    /\b(?:pay\s+me|give\s+me\s+money|send\s+money|pay\s+or|unless\s+you\s+pay|if\s+you\s+don['’]?t\s+pay)\b/,
    /\b(?:post|leak|upload|release|distribute|publish|spread|broadcast|share)\s+(?:it|them|this|everything|everywhere|those|your)\b/,
    /\b(?:send\s+(?:this|it|them|the\s+\w+)\s+to\s+(?:your|all|everyone|contacts|family|friends|colleagues|social|followers|relatives))\b/,
    /\b(?:expose\s+you|ruin\s+your\s+reputation|destroy\s+your\s+life|show\s+(?:everyone|your\s+family))\b/,
    /\b(?:everyone\s+will\s+see|all\s+your\s+(?:friends|contacts|family)\s+will\s+see)\b/,
    /\b(?:or\s+I['’]?ll\s+(?:post|leak|send|upload|release|expose|share|show))\b/,
    /\b(?:comply\s+with|meet\s+my\s+demands?|extortion|blackmail)\b/
  ];

  const hasCoercion = coercionPatterns.some((pattern) => pattern.test(t));

  return hasMedia && hasCoercion;
}
