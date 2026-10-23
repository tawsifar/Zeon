import { TeraBoxFallbackData, MediaInfoResult } from './types';

/**
 * Isolated TeraBox Cloud Share Adapter
 * 
 * TeraBox links frequently enforce server-side IP bot detection, session cookies,
 * or Cloudflare challenges. This adapter isolates TeraBox handling so it never interferes
 * with standard media extractors, while offering clean client-side embed/mobile player
 * fallback generation.
 */

const TERABOX_DOMAINS = [
  'terabox.com',
  '1024tera.com',
  'teraboxapp.com',
  'terabox.app',
  'terasharelink.com',
  'mirrobox.com',
  'nephobox.com',
  'freeterabox.com',
  '4funbox.com',
];

export function isTeraBoxUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return TERABOX_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Extracts the share key (`surl` or path key) from any TeraBox link format.
 */
export function extractTeraBoxKey(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern 1: ?surl=XYZ or &surl=XYZ
  const surlMatch = trimmed.match(/[?&]surl=([a-zA-Z0-9_-]+)/i);
  if (surlMatch && surlMatch[1]) {
    return surlMatch[1];
  }

  // Pattern 2: /s/1XYZ or /s/XYZ
  const sPathMatch = trimmed.match(/\/s\/([a-zA-Z0-9_-]+)/i);
  if (sPathMatch && sPathMatch[1]) {
    return sPathMatch[1];
  }

  // Pattern 3: /sharing/link?surl=... or /wap/share/...
  const wapMatch = trimmed.match(/share\/(?:filelist|link)\?.*surl=([a-zA-Z0-9_-]+)/i);
  if (wapMatch && wapMatch[1]) {
    return wapMatch[1];
  }

  return null;
}

/**
 * Generates browser-safe direct access links that bypass server-side cloud bot blocks.
 */
export function getTeraBoxFallback(url: string): TeraBoxFallbackData {
  const rawKey = extractTeraBoxKey(url) || 'shared';
  // Normalize key: if key starts with '1', some endpoints expect it with 1, some without.
  const normalizedSurl = rawKey.startsWith('1') ? rawKey : `1${rawKey}`;

  return {
    embedUrl: `https://www.terabox.app/sharing/embed?surl=${rawKey}`,
    wapUrl: `https://www.terabox.com/wap/share/filelist?surl=${rawKey}`,
    directShareUrl: `https://terabox.app/sharing/link?surl=${normalizedSurl}`,
    surl: rawKey,
    guidance:
      'TeraBox enforces anti-bot CAPTCHA on server-side requests. Use our Direct Web Player to stream or download directly in your browser without logging in.',
  };
}

/**
 * Resolves TeraBox share links. If server-side download is blocked, returns clean fallback metadata.
 */
export async function resolveTeraBox(url: string): Promise<MediaInfoResult> {
  const fallback = getTeraBoxFallback(url);

  return {
    success: true,
    title: `TeraBox Cloud Share (${fallback.surl})`,
    platform: 'terabox',
    duration: 0,
    durationFormatted: 'Cloud File',
    teraBoxFallback: fallback,
  };
}
