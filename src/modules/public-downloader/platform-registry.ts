import { SupportedPlatform, PlatformInfo, DownloadMode } from './types';

export const PLATFORM_REGISTRY: Record<SupportedPlatform, PlatformInfo> = {
  youtube: {
    platform: 'youtube',
    displayName: 'YouTube',
    iconName: 'Youtube',
    color: '#FF0000',
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    badgeBorder: 'border-red-500/40',
    placeholder: 'Paste YouTube Video, Shorts or Music link (e.g. youtu.be/... or youtube.com/watch?v=...)',
    defaultMode: 'video',
  },
  instagram: {
    platform: 'instagram',
    displayName: 'Instagram',
    iconName: 'Instagram',
    color: '#E1306C',
    badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    badgeBorder: 'border-pink-500/40',
    placeholder: 'Paste Instagram Reel or Post link (e.g. instagram.com/reel/... or instagram.com/p/...)',
    defaultMode: 'video',
  },
  facebook: {
    platform: 'facebook',
    displayName: 'Facebook',
    iconName: 'Facebook',
    color: '#1877F2',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    badgeBorder: 'border-blue-500/40',
    placeholder: 'Paste Facebook Video or Reel link (e.g. facebook.com/watch/... or fb.watch/...)',
    defaultMode: 'video',
  },
  linkedin: {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    iconName: 'Linkedin',
    color: '#0A66C2',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    badgeBorder: 'border-sky-500/40',
    placeholder: 'Paste LinkedIn Public Video link (e.g. linkedin.com/posts/...)',
    defaultMode: 'video',
  },
  tiktok: {
    platform: 'tiktok',
    displayName: 'TikTok (No Watermark)',
    iconName: 'Video',
    color: '#00F2FE',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    badgeBorder: 'border-cyan-500/40',
    placeholder: 'Paste TikTok Video link (e.g. tiktok.com/@user/video/... or vm.tiktok.com/...)',
    defaultMode: 'video',
  },
  douyin: {
    platform: 'douyin',
    displayName: 'Douyin',
    iconName: 'Video',
    color: '#FE2C55',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    badgeBorder: 'border-rose-500/40',
    placeholder: 'Paste Douyin video link (e.g. v.douyin.com/... or douyin.com/video/...)',
    defaultMode: 'video',
  },
  twitter: {
    platform: 'twitter',
    displayName: 'X (Twitter)',
    iconName: 'Twitter',
    color: '#1DA1F2',
    badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    badgeBorder: 'border-slate-500/40',
    placeholder: 'Paste X or Twitter link (e.g. x.com/user/status/... or twitter.com/...)',
    defaultMode: 'video',
  },
  threads: {
    platform: 'threads',
    displayName: 'Threads',
    iconName: 'AtSign',
    color: '#FFFFFF',
    badgeBg: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/30',
    badgeBorder: 'border-neutral-500/40',
    placeholder: 'Paste Threads post link (e.g. threads.net/@user/post/...)',
    defaultMode: 'video',
  },
  reddit: {
    platform: 'reddit',
    displayName: 'Reddit (DASH Merged)',
    iconName: 'MessageSquare',
    color: '#FF4500',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    badgeBorder: 'border-orange-500/40',
    placeholder: 'Paste Reddit Video link (e.g. reddit.com/r/.../comments/... or redd.it/...)',
    defaultMode: 'video',
  },
  pinterest: {
    platform: 'pinterest',
    displayName: 'Pinterest',
    iconName: 'Image',
    color: '#BD081C',
    badgeBg: 'bg-red-600/10 text-red-400 border-red-600/30',
    badgeBorder: 'border-red-600/40',
    placeholder: 'Paste Pinterest video or pin link (e.g. pinterest.com/pin/... or pin.it/...)',
    defaultMode: 'video',
  },
  bilibili: {
    platform: 'bilibili',
    displayName: 'Bilibili',
    iconName: 'Tv',
    color: '#00A1D6',
    badgeBg: 'bg-sky-400/10 text-sky-400 border-sky-400/30',
    badgeBorder: 'border-sky-400/40',
    placeholder: 'Paste Bilibili link (e.g. bilibili.com/video/BV... or b23.tv/...)',
    defaultMode: 'video',
  },
  dailymotion: {
    platform: 'dailymotion',
    displayName: 'Dailymotion',
    iconName: 'PlayCircle',
    color: '#0066DC',
    badgeBg: 'bg-blue-600/10 text-blue-400 border-blue-600/30',
    badgeBorder: 'border-blue-600/40',
    placeholder: 'Paste Dailymotion link (e.g. dailymotion.com/video/... or dai.ly/...)',
    defaultMode: 'video',
  },
  twitch: {
    platform: 'twitch',
    displayName: 'Twitch Clips',
    iconName: 'Tv',
    color: '#9146FF',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    badgeBorder: 'border-purple-500/40',
    placeholder: 'Paste Twitch Clip link (e.g. clips.twitch.tv/... or twitch.tv/videos/...)',
    defaultMode: 'video',
  },
  kick: {
    platform: 'kick',
    displayName: 'Kick',
    iconName: 'Play',
    color: '#53FC18',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    badgeBorder: 'border-emerald-500/40',
    placeholder: 'Paste Kick clip link (e.g. kick.com/video/... or kick.com/.../clips/...)',
    defaultMode: 'video',
  },
  vimeo: {
    platform: 'vimeo',
    displayName: 'Vimeo',
    iconName: 'Video',
    color: '#1AB7EA',
    badgeBg: 'bg-cyan-600/10 text-cyan-400 border-cyan-600/30',
    badgeBorder: 'border-cyan-600/40',
    placeholder: 'Paste Vimeo video link (e.g. vimeo.com/76979871 or player.vimeo.com/...)',
    defaultMode: 'video',
  },
  soundcloud: {
    platform: 'soundcloud',
    displayName: 'SoundCloud (Audio)',
    iconName: 'Music',
    color: '#FF5500',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    badgeBorder: 'border-amber-500/40',
    placeholder: 'Paste SoundCloud track link (e.g. soundcloud.com/... or on.soundcloud.com/...)',
    defaultMode: 'audio',
    isAudioFirst: true,
  },
  bandcamp: {
    platform: 'bandcamp',
    displayName: 'Bandcamp (Audio)',
    iconName: 'Music',
    color: '#1DA0C3',
    badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    badgeBorder: 'border-teal-500/40',
    placeholder: 'Paste Bandcamp track link (e.g. artist.bandcamp.com/track/...)',
    defaultMode: 'audio',
    isAudioFirst: true,
  },
  terabox: {
    platform: 'terabox',
    displayName: 'TeraBox Cloud Share',
    iconName: 'HardDrive',
    color: '#082FEE',
    badgeBg: 'bg-indigo-600/10 text-indigo-400 border-indigo-600/30',
    badgeBorder: 'border-indigo-600/40',
    placeholder: 'Paste TeraBox public share link (e.g. terabox.com/s/... or 1024tera.com/s/...)',
    defaultMode: 'video',
    isCloudShare: true,
  },
  generic: {
    platform: 'generic',
    displayName: 'Direct Stream',
    iconName: 'Globe',
    color: '#10B981',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    badgeBorder: 'border-emerald-500/40',
    placeholder: 'Paste any supported public media URL...',
    defaultMode: 'video',
  },
  unknown: {
    platform: 'unknown',
    displayName: 'Auto Detect',
    iconName: 'Sparkles',
    color: '#9CA3AF',
    badgeBg: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    badgeBorder: 'border-neutral-800',
    placeholder: 'Paste YouTube, TikTok, Reddit, X, Bilibili, SoundCloud, TeraBox URL...',
    defaultMode: 'video',
  },
};

/**
 * Deterministic O(1) platform detection matching full URLs, mobile subdomains, and short links.
 */
export function detectPlatform(url: string): PlatformInfo {
  if (!url || typeof url !== 'string') {
    return PLATFORM_REGISTRY.unknown;
  }

  const trimmed = url.trim();

  // 1. YouTube (youtube.com, youtu.be, shorts)
  if (/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.youtube;
  }

  // 2. TikTok (tiktok.com, vm.tiktok.com, vt.tiktok.com)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?tiktok\.com\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.tiktok;
  }

  // 3. Douyin (douyin.com, v.douyin.com, iesdouyin.com)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?(douyin\.com|iesdouyin\.com)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.douyin;
  }

  // 4. Instagram (instagram.com)
  if (/^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv|share)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.instagram;
  }

  // 5. Facebook (facebook.com, fb.watch, fb.me)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?(facebook\.com|fb\.watch|fb\.me)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.facebook;
  }

  // 6. X (Twitter) & t.co short links
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?(twitter\.com|x\.com|t\.co)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.twitter;
  }

  // 7. Threads (threads.net)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?threads\.net\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.threads;
  }

  // 8. Reddit (reddit.com, redd.it, v.redd.it)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?(reddit\.com|redd\.it|v\.redd\.it)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.reddit;
  }

  // 9. Pinterest (pinterest.com, pin.it)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?(pinterest\.[a-z.]+|pin\.it)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.pinterest;
  }

  // 10. Bilibili (bilibili.com, b23.tv)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?(bilibili\.com|b23\.tv)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.bilibili;
  }

  // 11. Dailymotion (dailymotion.com, dai.ly)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?(dailymotion\.com|dai\.ly)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.dailymotion;
  }

  // 12. Twitch (twitch.tv, clips.twitch.tv)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?twitch\.tv\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.twitch;
  }

  // 13. Kick (kick.com)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?kick\.com\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.kick;
  }

  // 14. Vimeo (vimeo.com, player.vimeo.com)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?vimeo\.com\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.vimeo;
  }

  // 15. SoundCloud (soundcloud.com, on.soundcloud.com)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?soundcloud\.com\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.soundcloud;
  }

  // 16. Bandcamp (*.bandcamp.com)
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?bandcamp\.com\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.bandcamp;
  }

  // 17. TeraBox & Mirrors (terabox.com, 1024tera.com, teraboxapp.com, etc.)
  if (
    /^(https?:\/\/)?([a-z0-9-]+\.)?(terabox\.com|1024tera\.com|teraboxapp\.com|terabox\.app|terasharelink\.com|mirrobox\.com|nephobox\.com|freeterabox\.com|4funbox\.com)\/.+/i.test(
      trimmed
    )
  ) {
    return PLATFORM_REGISTRY.terabox;
  }

  // 18. LinkedIn
  if (/^(https?:\/\/)?([a-z0-9-]+\.)?linkedin\.com\/(posts|feed\/update|embed)\/.+/i.test(trimmed)) {
    return PLATFORM_REGISTRY.linkedin;
  }

  // 19. Generic fallback for any valid HTTP/HTTPS URL
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return PLATFORM_REGISTRY.generic;
  }

  return PLATFORM_REGISTRY.unknown;
}

export function isValidMediaUrl(url: string): boolean {
  const info = detectPlatform(url);
  return info.platform !== 'unknown';
}

/**
 * Returns platform-specific arguments to pass to yt-dlp to avoid cross-platform interference:
 * - TikTok / Douyin: prioritizes watermark-free H.264 MP4.
 * - Bilibili: injects mandatory Referer and desktop User-Agent to avoid 403 Forbidden.
 * - Vimeo: injects Referer.
 * - SoundCloud / Bandcamp: forces audio extraction.
 * - YouTube: uses player client arguments.
 */
export function getPlatformExtractorArgs(platform: SupportedPlatform, mode: DownloadMode): string[] {
  const args: string[] = [];

  switch (platform) {
    case 'bilibili':
      args.push(
        '--add-header',
        'Referer:https://www.bilibili.com/',
        '--add-header',
        'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      break;

    case 'vimeo':
      args.push('--add-header', 'Referer:https://vimeo.com/');
      break;

    case 'tiktok':
    case 'douyin':
      if (mode === 'video') {
        // Prioritize unwatermarked H.264 stream
        args.push('-f', 'bv*[vcodec^=avc1]+ba/b[vcodec^=avc1]/bv*+ba/b');
      }
      break;

    case 'youtube':
      args.push('--extractor-args', 'youtube:player_client=android,web');
      break;

    case 'soundcloud':
    case 'bandcamp':
      if (mode === 'audio') {
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      }
      break;

    case 'reddit':
    case 'twitter':
    case 'threads':
    case 'pinterest':
    case 'dailymotion':
    case 'twitch':
    case 'kick':
      if (mode === 'video') {
        args.push('--merge-output-format', 'mp4');
      }
      break;

    default:
      break;
  }

  return args;
}
