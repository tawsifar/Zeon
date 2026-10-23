import { TransformationResult, PrivatePlatformType } from './types';

export function transformPrivateVideoUrl(inputUrl: string): TransformationResult {
  const trimmed = inputUrl ? inputUrl.trim() : '';

  if (!trimmed) {
    return {
      originalUrl: '',
      modifiedUrl: '',
      platform: 'generic',
      platformName: 'Unknown',
      explanation: 'Please enter a video URL to transform.',
      isValid: false,
      error: 'Empty URL provided',
    };
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Facebook Transformation -> mbasic.facebook.com
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch') || hostname.includes('fb.me')) {
      let pathname = parsed.pathname;
      const searchParams = new URLSearchParams(parsed.search);

      // Preserve reel or video path, but strip tracking query parameters
      searchParams.delete('sfnsn');
      searchParams.delete('mibextid');
      searchParams.delete('rdid');

      // Convert reel/watch to mbasic format
      if (pathname.includes('/reel/')) {
        const reelId = pathname.split('/reel/')[1]?.split('/')[0]?.split('?')[0];
        if (reelId) {
          pathname = `/reel/${reelId}/`;
        }
      } else if (pathname.includes('/watch/')) {
        const v = searchParams.get('v') || pathname.split('/watch/')[1]?.split('/')[0];
        if (v) {
          pathname = `/watch/?v=${v}`;
        }
      }

      const queryString = searchParams.toString();
      const modifiedUrl = `https://mbasic.facebook.com${pathname}${queryString && !pathname.includes('?') ? `?${queryString}` : ''}`;

      return {
        originalUrl: trimmed,
        modifiedUrl,
        platform: 'facebook',
        platformName: 'Facebook (mbasic shell)',
        explanation: 'Rewritten to the light mobile-basic Facebook interface. This bypasses React script overlays and exposes the standard HTML5 video tag with native browser 3-dots download.',
        isValid: true,
      };
    }

    // 2. Instagram Transformation -> /embed/captioned/
    if (hostname.includes('instagram.com')) {
      let pathname = parsed.pathname;
      // Extract post or reel shortcode: /p/:code/ or /reel/:code/
      const match = pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
      if (match) {
        const type = match[1];
        const code = match[2];
        const modifiedUrl = `https://www.instagram.com/${type}/${code}/embed/captioned/`;
        return {
          originalUrl: trimmed,
          modifiedUrl,
          platform: 'instagram',
          platformName: 'Instagram (Direct Embed)',
          explanation: 'Converted to Instagram isolated embed viewport. Renders the video without feed listener interceptions, enabling native video context menu and download.',
          isValid: true,
        };
      }

      const modifiedUrl = `https://www.instagram.com${pathname.endsWith('/') ? pathname : `${pathname}/`}embed/captioned/`;
      return {
        originalUrl: trimmed,
        modifiedUrl,
        platform: 'instagram',
        platformName: 'Instagram',
        explanation: 'Formatted for Instagram clean embed player.',
        isValid: true,
      };
    }

    // 3. LinkedIn Transformation -> embed feed update view
    if (hostname.includes('linkedin.com')) {
      const pathname = parsed.pathname;
      const urnMatch = pathname.match(/urn:li:(activity|ugcPost):([0-9]+)/);
      if (urnMatch) {
        const urn = `urn:li:${urnMatch[1]}:${urnMatch[2]}`;
        const modifiedUrl = `https://www.linkedin.com/embed/feed/update/${urn}`;
        return {
          originalUrl: trimmed,
          modifiedUrl,
          platform: 'linkedin',
          platformName: 'LinkedIn (Embed Player)',
          explanation: 'Targeted to LinkedIn direct update embed frame. Renders an isolated player without professional feed script wrappers.',
          isValid: true,
        };
      }

      return {
        originalUrl: trimmed,
        modifiedUrl: trimmed,
        platform: 'linkedin',
        platformName: 'LinkedIn',
        explanation: 'Standard LinkedIn link. Open in new tab and inspect native video controls.',
        isValid: true,
      };
    }

    // Generic Fallback
    return {
      originalUrl: trimmed,
      modifiedUrl: trimmed,
      platform: 'generic',
      platformName: 'Standard Web Media',
      explanation: 'Open this link in a new browser tab to access native browser HTML5 playback and download controls.',
      isValid: true,
    };
  } catch (err: unknown) {
    return {
      originalUrl: trimmed,
      modifiedUrl: '',
      platform: 'generic',
      platformName: 'Invalid',
      explanation: 'Could not parse the URL. Please verify the link format.',
      isValid: false,
      error: err instanceof Error ? err.message : 'Invalid URL syntax',
    };
  }
}
