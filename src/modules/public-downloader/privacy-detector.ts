/**
 * Two-Layer Private Video Auto-Detection Engine
 * 
 * Layer 1: Instant Client-Side URL Pattern Detection (detects group/story/private URLs before/during probe).
 * Layer 2: Stderr and extractor error parsing for login-walls and private restrictions.
 */

export interface PrivateDetectionResult {
  isPrivate: boolean;
  reason?: string;
}

/**
 * Layer 1: Instant Client-Side URL inspection for known private or group-restricted patterns.
 */
export function isLikelyPrivateMediaUrl(url: string): PrivateDetectionResult {
  if (!url || typeof url !== 'string') return { isPrivate: false };
  const trimmed = url.trim().toLowerCase();

  // 1. Facebook Group video links or message/restricted paths
  if (
    trimmed.includes('facebook.com/groups/') ||
    trimmed.includes('fb.com/groups/') ||
    trimmed.includes('m.facebook.com/groups/') ||
    trimmed.includes('facebook.com/messages/') ||
    trimmed.includes('facebook.com/permalink.php')
  ) {
    return {
      isPrivate: true,
      reason: 'Facebook Group or restricted post detected. Direct server downloading is blocked by Facebook privacy settings.',
    };
  }

  // 2. Instagram Stories or direct message links
  if (
    trimmed.includes('instagram.com/stories/') ||
    trimmed.includes('instagram.com/direct/') ||
    trimmed.includes('instagram.com/archive/')
  ) {
    return {
      isPrivate: true,
      reason: 'Instagram Stories and direct messages require user session authentication.',
    };
  }

  return { isPrivate: false };
}

/**
 * Layer 2: Backend & Client error parser for privacy, group-permission, or login-wall indicators.
 */
export function isPrivacyOrLoginError(errorMessage?: string, platform?: string): boolean {
  if (!errorMessage || typeof errorMessage !== 'string') return false;
  const lower = errorMessage.toLowerCase();

  const exactPhrases = [
    'private video',
    'login required',
    'you need to log in to access this content',
    "sign in if you've been granted access",
    'sign in if you have been granted access',
    'this video is only available to registered users',
    "content isn't available right now",
    'content is not available right now',
    'this content is not available right now',
    'this video is private',
    'this post is private',
    'this account is private',
    'restricted video',
    'members only',
    'only members of this group',
    'join this group to see',
    'log in to see photos and videos',
  ];

  if (exactPhrases.some((phrase) => lower.includes(phrase))) {
    return true;
  }

  // Check login/authentication keywords on Facebook, Instagram, or LinkedIn extractors
  const plat = (platform || '').toLowerCase();
  const isSocialPlatform =
    plat.includes('facebook') ||
    plat.includes('instagram') ||
    plat.includes('linkedin') ||
    plat === 'generic' ||
    plat === '';

  if (isSocialPlatform) {
    if (
      lower.includes('login') ||
      lower.includes('log in') ||
      lower.includes('authentication') ||
      lower.includes('requires login') ||
      lower.includes('session cookie') ||
      lower.includes('cookie') ||
      lower.includes('permission') ||
      lower.includes('unauthorized') ||
      lower.includes('checkpoint')
    ) {
      return true;
    }
  }

  return false;
}
