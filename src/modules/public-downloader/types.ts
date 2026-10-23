export type SupportedPlatform =
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'douyin'
  | 'twitter'
  | 'threads'
  | 'reddit'
  | 'pinterest'
  | 'bilibili'
  | 'dailymotion'
  | 'twitch'
  | 'kick'
  | 'vimeo'
  | 'soundcloud'
  | 'bandcamp'
  | 'terabox'
  | 'generic'
  | 'unknown';

export type DownloadMode = 'video' | 'audio';

export interface PlatformInfo {
  platform: SupportedPlatform;
  displayName: string;
  iconName: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  placeholder: string;
  defaultMode?: DownloadMode;
  isAudioFirst?: boolean;
  isCloudShare?: boolean;
}

export interface TeraBoxFallbackData {
  embedUrl: string;
  wapUrl: string;
  directShareUrl: string;
  surl: string;
  guidance: string;
}

export interface MediaProbeResult {
  success: boolean;
  status?: string;
  isPrivateRestricted?: boolean;
  message?: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  durationFormatted?: string;
  uploader?: string;
  platform?: SupportedPlatform | string;
  bestVideoFormat?: {
    formatId: string;
    ext: string;
    resolution: string;
    filesizeApprox?: number;
  };
  bestAudioFormat?: {
    formatId: string;
    ext: string;
    abr?: number;
  };
  error?: string;
  teraBoxFallback?: TeraBoxFallbackData;
}

export interface MediaInfoResult {
  success: boolean;
  status?: string;
  isPrivateRestricted?: boolean;
  message?: string;
  title: string;
  duration?: number;
  durationFormatted?: string;
  thumbnail?: string;
  platform: string;
  error?: string;
  teraBoxFallback?: TeraBoxFallbackData;
}

export interface TrimTimeRange {
  startSeconds: number;
  endSeconds: number;
}
