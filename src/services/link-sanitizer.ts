export interface LinkCheckResult {
  allowed: boolean;
  isInternal: boolean;
  scheme: string;
  url: string;
  reason?: 'blocked_scheme' | 'external_confirmation' | 'direct_internal';
}

const BLOCKED_SCHEMES = new Set([
  'javascript:',
  'vbscript:',
  'file:',
  'data:',
]);

const ALLOWED_EXTERNAL_SCHEMES = new Set([
  'http:',
  'https:',
  'mailto:',
]);

export class LinkSanitizer {
  checkLink(rawUrl: string): LinkCheckResult {
    const trimmed = (rawUrl || '').trim();

    // Internal workbook link (e.g. #Sheet1!A1 or #A1)
    if (trimmed.startsWith('#')) {
      return {
        allowed: true,
        isInternal: true,
        scheme: 'internal',
        url: trimmed,
        reason: 'direct_internal',
      };
    }

    // Check scheme
    let scheme = '';
    try {
      const parsed = new URL(trimmed, 'https://localhost');
      scheme = parsed.protocol.toLowerCase();
    } catch {
      // If unable to parse, check for colon prefix
      const match = trimmed.match(/^([a-zA-Z0-9+.-]+):/);
      scheme = match ? match[1]!.toLowerCase() + ':' : '';
    }

    if (BLOCKED_SCHEMES.has(scheme)) {
      return {
        allowed: false,
        isInternal: false,
        scheme,
        url: trimmed,
        reason: 'blocked_scheme',
      };
    }

    if (ALLOWED_EXTERNAL_SCHEMES.has(scheme)) {
      return {
        allowed: true,
        isInternal: false,
        scheme,
        url: trimmed,
        reason: 'external_confirmation',
      };
    }

    // Default: block unknown protocols for safety
    return {
      allowed: false,
      isInternal: false,
      scheme: scheme || 'unknown',
      url: trimmed,
      reason: 'blocked_scheme',
    };
  }
}

export const linkSanitizer = new LinkSanitizer();
