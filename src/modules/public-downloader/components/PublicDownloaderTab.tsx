'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Clipboard,
  Video,
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Sparkles,
  Scissors,
  Headphones,
  HardDrive,
  ExternalLink,
  Share2,
  Lock,
} from 'lucide-react';
import { detectPlatform } from '../detector';
import { DownloadMode, MediaProbeResult, PlatformInfo } from '../types';
import { TrimControl } from './TrimControl';
import {
  formatSecondsToTimestamp,
  formatSecondsForFilename,
  parseTimestampToSeconds,
  validateTrimInputs,
} from '../time';
import { isLikelyPrivateMediaUrl } from '../privacy-detector';
import { transformPrivateVideoUrl } from '@/modules/private-link-helper/transformer';

const POPULAR_PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', color: '#00F2FE' },
  { id: 'instagram', name: 'Instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'twitter', name: 'X / Twitter', color: '#1DA1F2' },
  { id: 'reddit', name: 'Reddit', color: '#FF4500' },
  { id: 'bilibili', name: 'Bilibili', color: '#00A1D6' },
  { id: 'pinterest', name: 'Pinterest', color: '#BD081C' },
  { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500' },
  { id: 'terabox', name: 'TeraBox', color: '#082FEE' },
  { id: 'twitch', name: 'Twitch', color: '#9146FF' },
  { id: 'vimeo', name: 'Vimeo', color: '#1AB7EA' },
  { id: 'threads', name: 'Threads', color: '#E4E4E7' },
  { id: 'bandcamp', name: 'Bandcamp', color: '#1DA0C3' },
  { id: 'dailymotion', name: 'Dailymotion', color: '#0066DC' },
  { id: 'kick', name: 'Kick', color: '#53FC18' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
];

export function PublicDownloaderTab() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<DownloadMode>('video');
  const [platform, setPlatform] = useState<PlatformInfo>(detectPlatform(''));
  const [probeResult, setProbeResult] = useState<MediaProbeResult | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Private Video Restriction State (Two-Layer Auto-Detection)
  const [isPrivateRestricted, setIsPrivateRestricted] = useState(false);
  const [privateReason, setPrivateReason] = useState<string | null>(null);
  const [copiedModified, setCopiedModified] = useState(false);

  // Trimming State (Opt-in toggle, default false as per Rule 2)
  const [isTrimEnabled, setIsTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [startInput, setStartInput] = useState('00:00:00');
  const [endInput, setEndInput] = useState('00:01:00');

  // Compute modified URL via Client-Side Private Link Modifier
  const transformed = useMemo(() => {
    if (!url.trim()) return null;
    return transformPrivateVideoUrl(url.trim());
  }, [url]);

  const modifiedUrl = transformed?.modifiedUrl || url.trim();

  // Auto-detect platform on URL changes & auto-switch to audio for audio platforms
  useEffect(() => {
    const detected = detectPlatform(url);
    setPlatform(detected);
    setDownloadError(null);

    // Layer 1: Instant Client-Side URL Pattern Detection
    const clientPrivate = isLikelyPrivateMediaUrl(url);
    if (clientPrivate.isPrivate) {
      setIsPrivateRestricted(true);
      setPrivateReason(clientPrivate.reason || null);
    } else {
      setIsPrivateRestricted(false);
      setPrivateReason(null);
    }

    // Smart Audio Auto-Switch for Audio-First platforms (SoundCloud, Bandcamp)
    if (detected.isAudioFirst && mode !== 'audio') {
      setMode('audio');
    }

    // Auto-probe when a valid URL is provided
    if (detected.platform !== 'unknown' && url.trim().length > 10) {
      const handler = setTimeout(() => {
        fetchMetadata(url.trim());
      }, 500);
      return () => clearTimeout(handler);
    } else {
      setProbeResult(null);
    }
  }, [url]);

  // Fast metadata extraction via /api/media-info (with /api/probe fallback & Layer 2 Catch)
  const fetchMetadata = async (targetUrl: string) => {
    setIsProbing(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/media-info?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      // Layer 2 Catch: Check if server reported private/restricted status
      if (data.isPrivateRestricted || data.status === 'PRIVATE-RESTRICTED') {
        setIsPrivateRestricted(true);
        setPrivateReason(data.message || 'This video is private or restricted by group permissions.');
        setProbeResult(null);
        return;
      }

      if (data.success) {
        setIsPrivateRestricted(false);
        setProbeResult(data);
        if (typeof data.duration === 'number' && data.duration > 0) {
          const dur = data.duration;
          const forceHrs = dur >= 3600;
          setStartTime(0);
          setEndTime(dur);
          setStartInput(formatSecondsToTimestamp(0, forceHrs));
          setEndInput(formatSecondsToTimestamp(dur, forceHrs));
        }
      } else {
        // Fallback to /api/probe if media-info returned error
        const probeRes = await fetch('/api/probe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
        });
        const probeData: MediaProbeResult = await probeRes.json();

        if (probeData.isPrivateRestricted || probeData.status === 'PRIVATE-RESTRICTED') {
          setIsPrivateRestricted(true);
          setPrivateReason(probeData.message || 'This video is private or restricted by group permissions.');
          setProbeResult(null);
          return;
        }

        if (probeData.success) {
          setIsPrivateRestricted(false);
          setProbeResult(probeData);
          if (typeof probeData.duration === 'number' && probeData.duration > 0) {
            const dur = probeData.duration;
            const forceHrs = dur >= 3600;
            setStartTime(0);
            setEndTime(dur);
            setStartInput(formatSecondsToTimestamp(0, forceHrs));
            setEndInput(formatSecondsToTimestamp(dur, forceHrs));
          }
        }
      }
    } catch {
      // Graceful fallback: do not crash UI; manual trim entry remains allowed
    } finally {
      setIsProbing(false);
    }
  };

  const handleCopyModified = async () => {
    if (!modifiedUrl) return;
    try {
      await navigator.clipboard.writeText(modifiedUrl);
      setCopiedModified(true);
      setTimeout(() => setCopiedModified(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  // Slider change handler (bidirectional sync)
  const handleRangeChange = (newStart: number, newEnd: number) => {
    const totalDur = probeResult?.duration || Math.max(newEnd, 60);
    const forceHrs = totalDur >= 3600 || newStart >= 3600 || newEnd >= 3600;
    setStartTime(newStart);
    setEndTime(newEnd);
    setStartInput(formatSecondsToTimestamp(newStart, forceHrs));
    setEndInput(formatSecondsToTimestamp(newEnd, forceHrs));
  };

  // Input box change handlers (bidirectional sync)
  const handleStartInputChange = (val: string) => {
    setStartInput(val);
    const parsed = parseTimestampToSeconds(val);
    if (parsed !== null && parsed >= 0) {
      setStartTime(parsed);
    }
  };

  const handleEndInputChange = (val: string) => {
    setEndInput(val);
    const parsed = parseTimestampToSeconds(val);
    if (parsed !== null && parsed > 0) {
      setEndTime(parsed);
    }
  };

  // Client-Side Validation
  const trimValidation = useMemo((): { isValid: boolean; error?: string } => {
    if (!isTrimEnabled) return { isValid: true };
    return validateTrimInputs(startInput, endInput, probeResult?.duration);
  }, [isTrimEnabled, startInput, endInput, probeResult?.duration]);

  const handleDownload = () => {
    if (!url || platform.platform === 'unknown') {
      setDownloadError('Please enter a valid media link first.');
      return;
    }

    if (platform.platform === 'terabox' && probeResult?.teraBoxFallback) {
      window.open(probeResult.teraBoxFallback.embedUrl, '_blank');
      return;
    }

    if (isTrimEnabled && !trimValidation.isValid) {
      setDownloadError(trimValidation.error || 'Please correct the trim timestamps.');
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    const ext = mode === 'audio' ? 'mp3' : 'mp4';
    const cleanTitle = (probeResult?.title || 'zeon_media')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);

    let downloadUrl = `/api/download?url=${encodeURIComponent(url.trim())}&mode=${mode}`;
    let targetFilename = `${cleanTitle}.${ext}`;

    if (isTrimEnabled) {
      // Append sanitized timestamps to route
      downloadUrl += `&startTime=${encodeURIComponent(startInput.trim())}&endTime=${encodeURIComponent(endInput.trim())}`;
      const startStr = formatSecondsForFilename(startTime);
      const endStr = formatSecondsForFilename(endTime);
      targetFilename = `${cleanTitle}_clip_${startStr}-${endStr}.${ext}`;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = targetFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Keep visual status while backend stages and streams file
    setTimeout(() => {
      setIsDownloading(false);
    }, 6000);
  };

  const isTeraBox = platform.platform === 'terabox' || !!probeResult?.teraBoxFallback;

  const isDownloadDisabled =
    isDownloading ||
    !url.trim() ||
    platform.platform === 'unknown' ||
    (isTrimEnabled && !trimValidation.isValid);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-950/40 via-neutral-900/60 to-purple-950/40 border border-violet-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-medium text-violet-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Universal Multi-Platform Engine (18+ Platforms Supported)
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Best-Format Public Media Downloader
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Direct downloads for YouTube, TikTok, Reddit, X, Bilibili, Pinterest, Vimeo, SoundCloud, TeraBox & more.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {platform.isAudioFirst && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Headphones className="w-3.5 h-3.5" />
                Audio Platform Detected
              </span>
            )}
            <div className="inline-flex p-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 self-start md:self-auto">
              <button
                onClick={() => setMode('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'video'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                Best Video (MP4)
              </button>
              <button
                onClick={() => setMode('audio')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'audio'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4" />
                Best Audio (MP3)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Media URL
          </label>

          <div className="relative flex items-center">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={platform.placeholder}
              className="w-full pl-4 pr-32 py-4 bg-neutral-950/90 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm font-mono"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{copied ? 'Pasted!' : 'Paste'}</span>
              </button>
            </div>
          </div>

          {/* Platform Badge Bar */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Detected Source:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${platform.badgeBg}`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  {platform.displayName}
                </span>
              </div>
            </div>

            {/* Dynamic Supported Platforms Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-neutral-500 font-medium mr-1">Supported:</span>
              {POPULAR_PLATFORMS.map((p) => {
                const isActive = platform.platform === p.id;
                return (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] transition-all border ${
                      isActive
                        ? 'bg-neutral-800 text-white font-semibold border-violet-500/50 shadow-sm'
                        : 'bg-neutral-950/60 text-neutral-400 border-neutral-800/70 hover:text-neutral-300'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Private / Restricted Video 3-Dots Fallback Card (Merged from Module 2) */}
        {isPrivateRestricted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-gradient-to-br from-amber-950/40 via-neutral-950/90 to-blue-950/30 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Private or Restricted Video Detected
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                      Browser 3-Dots Direct Player
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1 leading-snug">
                    Direct download is blocked by the platform&apos;s privacy settings, but you can download it directly from your own logged-in browser using the modified link below.
                  </h4>
                  {privateReason && (
                    <p className="text-xs text-amber-200/80 mt-1">
                      {privateReason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modified Shell Link Display Box */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-0.5">
                  Modified Link ({transformed?.platformName || 'Native Web Shell'}):
                </span>
                <p className="text-xs font-mono text-cyan-300 truncate" title={modifiedUrl}>
                  {modifiedUrl}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyModified}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
                >
                  {copiedModified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={modifiedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-600/25 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Modified Link in New Tab</span>
                </a>
              </div>
            </div>

            {/* Compact 3-Step Visual Guide */}
            <div className="bg-neutral-900/50 border border-white/[0.06] rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                How to Download from Your Browser (3 Steps):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-neutral-300">
                <div className="flex items-start gap-2 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                  <span>Click <strong>Open Modified Link in New Tab</strong> (uses your existing browser login safely).</span>
                </div>
                <div className="flex items-start gap-2 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                  <span>Play the video, then click the <strong>⋮ (Three Dots)</strong> icon in the bottom-right corner of the video player.</span>
                </div>
                <div className="flex items-start gap-2 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
                  <span>Click <strong>Download</strong> to save the video directly to your device without quality loss.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TeraBox Direct Player Fallback Card */}
        {!isPrivateRestricted && isTeraBox && probeResult?.teraBoxFallback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-950/40 via-neutral-950 to-blue-950/30 border border-indigo-500/30 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">TeraBox Cloud Share</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">Browser Direct Player</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-0.5">Stream & Download Without Bot Restrictions</h4>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/60 border border-neutral-800 rounded-xl p-3">
              {probeResult.teraBoxFallback.guidance}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href={probeResult.teraBoxFallback.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open Direct Web Player
              </a>
              <a
                href={probeResult.teraBoxFallback.wapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Open Mobile WAP Player
              </a>
            </div>
          </motion.div>
        )}

        {/* Compact Probed Media Preview Card & Trim Toggle (Hidden if Private Restricted) */}
        <AnimatePresence>
          {!isPrivateRestricted && (isProbing || (probeResult && !isTeraBox)) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-4 backdrop-blur-md space-y-4"
            >
              {isProbing ? (
                <div className="flex items-center gap-3 text-sm text-neutral-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>Extracting live stream metadata & preview...</span>
                </div>
              ) : probeResult?.success ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 items-start w-full sm:w-auto">
                    {probeResult.thumbnail && (
                      <div className="relative rounded-xl overflow-hidden shrink-0 w-full sm:w-40 aspect-video bg-neutral-900 border border-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={probeResult.thumbnail}
                          alt={probeResult.title || 'Thumbnail'}
                          className="w-full h-full object-cover"
                        />
                        {probeResult.durationFormatted && (
                          <span className="absolute bottom-2 right-2 bg-black/85 text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10">
                            {probeResult.durationFormatted}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2" title={probeResult.title}>
                        {probeResult.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                        {probeResult.uploader && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{probeResult.uploader}</span>
                          </div>
                        )}
                        {probeResult.durationFormatted && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Total Duration: {probeResult.durationFormatted}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Direct Stream Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trim Toggle Switch (Rule 2: Opt-in, default false) */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsTrimEnabled(!isTrimEnabled)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isTrimEnabled
                          ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30 border-violet-500/50 text-white shadow-lg shadow-violet-500/20'
                          : 'bg-neutral-900 hover:bg-neutral-800/90 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <Scissors className={`w-3.5 h-3.5 ${isTrimEnabled ? 'text-cyan-400' : 'text-neutral-400'}`} />
                      <span>Trim Time Range (Cut specific part)</span>
                      <div
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                          isTrimEnabled ? 'bg-violet-600' : 'bg-neutral-700'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform ${
                            isTrimEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trim Controls Section (Active when Trim is enabled, not TeraBox, and not Private Restricted) */}
        <AnimatePresence>
          {!isPrivateRestricted && isTrimEnabled && !isTeraBox && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <TrimControl
                duration={probeResult?.duration}
                startTime={startTime}
                endTime={endTime}
                startInput={startInput}
                endInput={endInput}
                onRangeChange={handleRangeChange}
                onStartInputChange={handleStartInputChange}
                onEndInputChange={handleEndInputChange}
                validationError={trimValidation.isValid ? null : trimValidation.error}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Trigger (Hidden when Private Restricted, since the Fallback Card provides direct actions) */}
        {!isPrivateRestricted && (
          <div className="pt-2">
            {isTeraBox && probeResult?.teraBoxFallback ? (
              <a
                href={probeResult.teraBoxFallback.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xl shadow-indigo-600/25 active:scale-[0.99] border border-indigo-400/30"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Open in Direct Web Player</span>
              </a>
            ) : (
              <button
                onClick={handleDownload}
                disabled={isDownloadDisabled}
                className={`w-full py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all ${
                  isDownloadDisabled
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                    : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-600/25 active:scale-[0.99] border border-violet-400/30'
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      Preparing & Streaming {isTrimEnabled ? 'Trimmed Clip' : mode === 'video' ? 'Video' : 'Audio'}...
                    </span>
                  </>
                ) : isTrimEnabled ? (
                  <>
                    <Scissors className="w-5 h-5 text-cyan-300" />
                    <span>
                      Download Trimmed {mode === 'video' ? 'Clip (MP4)' : 'Audio (MP3)'}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>
                      Download {mode === 'video' ? 'Best Quality MP4' : 'Highest Bitrate MP3'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {downloadError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{downloadError}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

