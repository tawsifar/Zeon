'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Video,
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Scissors,
  Download,
  Clipboard,
  ExternalLink,
  Share2,
  Lock,
  UploadCloud,
  ShieldCheck,
  FolderArchive,
  Trash2,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import JSZip from 'jszip';
import { useTheme } from '@/context/ThemeContext';
import { detectPlatform } from '@/modules/public-downloader/detector';
import { DownloadMode, MediaProbeResult, PlatformInfo } from '@/modules/public-downloader/types';
import { TrimControl } from '@/modules/public-downloader/components/TrimControl';
import {
  formatSecondsToTimestamp,
  formatSecondsForFilename,
  parseTimestampToSeconds,
  validateTrimInputs,
} from '@/modules/public-downloader/time';
import { isLikelyPrivateMediaUrl } from '@/modules/public-downloader/privacy-detector';
import { transformPrivateVideoUrl } from '@/modules/private-link-helper/transformer';
import {
  ProcessedItem,
  CleanOptions,
  CameraProfile,
} from '@/modules/ai-label-remover/types';
import {
  validateIncomingFile,
  processItem,
} from '@/modules/ai-label-remover/engine/processor';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

type InternalTab = 'video-audio' | 'clean-metadata';

export function CentralCommandCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Internal Tab State
  const [activeTab, setActiveTab] = useState<InternalTab>('video-audio');

  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent<InternalTab>;
      if (customEvent.detail === 'video-audio' || customEvent.detail === 'clean-metadata') {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('zeon:switch-tab', handleSwitch);
    return () => window.removeEventListener('zeon:switch-tab', handleSwitch);
  }, []);

  // ================= MODULE 1 & 2 STATE: VIDEO & AUDIO =================
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<DownloadMode>('video');
  const [platform, setPlatform] = useState<PlatformInfo>(detectPlatform(''));
  const [probeResult, setProbeResult] = useState<MediaProbeResult | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('Connecting to media source...');
  const [downloadDetailText, setDownloadDetailText] = useState('Preparing pipeline...');
  const [downloadSpeedOrSize, setDownloadSpeedOrSize] = useState<string | null>(null);
  const downloadAbortControllerRef = useRef<AbortController | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (downloadAbortControllerRef.current) downloadAbortControllerRef.current.abort();
    };
  }, []);

  const [copied, setCopied] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Private Video Restriction State (Two-Layer Auto-Detection)
  const [isPrivateRestricted, setIsPrivateRestricted] = useState(false);
  const [privateReason, setPrivateReason] = useState<string | null>(null);
  const [copiedModified, setCopiedModified] = useState(false);

  // Trimming State
  const [isTrimEnabled, setIsTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [startInput, setStartInput] = useState('00:00:00');
  const [endInput, setEndInput] = useState('00:01:00');

  // Compute modified URL
  const transformed = useMemo(() => {
    if (!url.trim()) return null;
    return transformPrivateVideoUrl(url.trim());
  }, [url]);

  const modifiedUrl = transformed?.modifiedUrl || url.trim();

  // Auto-detect platform on URL changes
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

    if (detected.isAudioFirst && mode !== 'audio') {
      setMode('audio');
    }

    if (detected.platform !== 'unknown' && url.trim().length > 10) {
      setHasSubmitted(true);
      const handler = setTimeout(() => {
        fetchMetadata(url.trim());
      }, 500);
      return () => clearTimeout(handler);
    } else if (!url.trim()) {
      setProbeResult(null);
      setHasSubmitted(false);
    }
  }, [url]);

  const fetchMetadata = async (targetUrl: string) => {
    setIsProbing(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/media-info?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

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
      // Ignore
    } finally {
      setIsProbing(false);
    }
  };

  const handleContinueClick = () => {
    if (!url.trim()) return;
    setHasSubmitted(true);
    fetchMetadata(url.trim());
  };

  const handleCopyModified = async () => {
    if (!modifiedUrl) return;
    try {
      await navigator.clipboard.writeText(modifiedUrl);
      setCopiedModified(true);
      setTimeout(() => setCopiedModified(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setHasSubmitted(true);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const handleRangeChange = (newStart: number, newEnd: number) => {
    const totalDur = probeResult?.duration || Math.max(newEnd, 60);
    const forceHrs = totalDur >= 3600 || newStart >= 3600 || newEnd >= 3600;
    setStartTime(newStart);
    setEndTime(newEnd);
    setStartInput(formatSecondsToTimestamp(newStart, forceHrs));
    setEndInput(formatSecondsToTimestamp(newEnd, forceHrs));
  };

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

  const trimValidation = useMemo((): { isValid: boolean; error?: string } => {
    if (!isTrimEnabled) return { isValid: true };
    return validateTrimInputs(startInput, endInput, probeResult?.duration);
  }, [isTrimEnabled, startInput, endInput, probeResult?.duration]);

  const handleCancelDownload = () => {
    if (downloadAbortControllerRef.current) {
      downloadAbortControllerRef.current.abort();
      downloadAbortControllerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadSpeedOrSize(null);
  };

  const handleDownload = async () => {
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
    setDownloadProgress(6);
    setDownloadStatusText('Connecting to media source...');
    setDownloadDetailText('Locating audio & video streams...');
    setDownloadSpeedOrSize(null);

    const ext = mode === 'audio' ? 'mp3' : 'mp4';
    const cleanTitle = (probeResult?.title || 'zeon_media')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);

    let downloadUrl = `/api/download?url=${encodeURIComponent(url.trim())}&mode=${mode}`;
    let targetFilename = `${cleanTitle}.${ext}`;

    if (isTrimEnabled) {
      downloadUrl += `&startTime=${encodeURIComponent(startInput.trim())}&endTime=${encodeURIComponent(endInput.trim())}`;
      const startStr = formatSecondsForFilename(startTime);
      const endStr = formatSecondsForFilename(endTime);
      targetFilename = `${cleanTitle}_clip_${startStr}-${endStr}.${ext}`;
    }

    const abortController = new AbortController();
    downloadAbortControllerRef.current = abortController;

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    // Smooth asymptotic progress ticker while backend downloads/transcodes
    progressTimerRef.current = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev < 28) {
          setDownloadStatusText('Contacting platform server...');
          setDownloadDetailText('Analyzing stream codecs & resolution...');
          return Math.min(28, prev + Math.floor(Math.random() * 4) + 2);
        } else if (prev < 58) {
          setDownloadStatusText(
            isTrimEnabled
              ? 'Clipping time range...'
              : mode === 'audio'
              ? 'Extracting high-bitrate audio...'
              : 'Extracting highest resolution stream...'
          );
          setDownloadDetailText(
            isTrimEnabled
              ? `Precision slice: ${startInput} → ${endInput}`
              : 'Direct pipe from provider...'
          );
          return Math.min(58, prev + Math.floor(Math.random() * 3) + 1);
        } else if (prev < 80) {
          setDownloadStatusText('Transcoding & optimizing media...');
          setDownloadDetailText('Merging MP4 container with faststart...');
          return Math.min(80, prev + Math.floor(Math.random() * 2) + 1);
        } else if (prev < 88) {
          setDownloadStatusText('Finalizing download stream...');
          setDownloadDetailText('Preparing file transfer...');
          return Math.min(88, prev + 1);
        }
        return prev;
      });
    }, 250);

    try {
      const response = await fetch(downloadUrl, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error || errorData?.message || `Download failed (HTTP ${response.status})`;
        setDownloadError(errMsg);
        setIsDownloading(false);
        setDownloadProgress(0);
        return;
      }

      // Backend staging complete, receiving bytes
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      const contentType = response.headers.get('content-type') || (mode === 'audio' ? 'audio/mpeg' : 'video/mp4');

      setDownloadStatusText('Streaming to your browser...');
      setDownloadProgress((prev) => Math.max(prev, 85));

      if (response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            receivedBytes += value.length;
            if (totalBytes > 0) {
              const streamPercent = Math.min(99, 85 + Math.round((receivedBytes / totalBytes) * 14));
              setDownloadProgress(streamPercent);
              const mbReceived = (receivedBytes / (1024 * 1024)).toFixed(1);
              const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
              setDownloadSpeedOrSize(`${mbReceived} MB / ${mbTotal} MB`);
            } else {
              const mbReceived = (receivedBytes / (1024 * 1024)).toFixed(1);
              setDownloadSpeedOrSize(`${mbReceived} MB received`);
              setDownloadProgress((prev) => Math.min(98, prev + 1));
            }
          }
        }

        // 100% Complete! Save to disk
        setDownloadProgress(100);
        setDownloadStatusText('Download complete! Saving to device...');
        setDownloadDetailText('File ready');

        const blob = new Blob(chunks as BlobPart[], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = targetFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          setIsDownloading(false);
          setDownloadProgress(0);
          setDownloadSpeedOrSize(null);
        }, 2200);
      } else {
        const blob = await response.blob();
        setDownloadProgress(100);
        setDownloadStatusText('Download complete! Saving to device...');
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = targetFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          setIsDownloading(false);
          setDownloadProgress(0);
        }, 2200);
      }
    } catch (err: unknown) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (abortController.signal.aborted) {
        setIsDownloading(false);
        setDownloadProgress(0);
        return;
      }

      console.warn('Direct stream fetch failed, falling back to standard anchor trigger:', err);
      // Fallback to standard anchor download so nothing ever breaks
      setDownloadProgress(100);
      setDownloadStatusText('Initiating browser download...');
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 3500);
    }
  };

  const isTeraBox = platform.platform === 'terabox' || !!probeResult?.teraBoxFallback;
  const isDownloadDisabled =
    isDownloading ||
    !url.trim() ||
    platform.platform === 'unknown' ||
    (isTrimEnabled && !trimValidation.isValid);

  // ================= MODULE 3 STATE: CLEAN IMAGE METADATA =================
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [options, setOptions] = useState<CleanOptions>({
    injectCameraExif: false,
    cameraProfile: 'apple',
  });
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setGlobalError(null);
      const incoming = Array.from(fileList);

      if (items.length + incoming.length > 30) {
        setGlobalError('Batch limit reached: Up to 30 images can be processed simultaneously.');
        return;
      }

      const newItems: ProcessedItem[] = [];

      for (const file of incoming) {
        const validation = validateIncomingFile(file);
        if (!validation.valid) {
          setGlobalError(validation.error || 'Invalid file detected.');
          continue;
        }

        const id = Math.random().toString(36).substring(2, 11);
        const item: ProcessedItem = {
          id,
          file,
          name: file.name,
          size: file.size,
          fileType: 'unknown',
          markers: {
            c2pa: false,
            xmp: false,
            exif: false,
            iptc: false,
            pngText: false,
            comments: false,
            details: [],
          },
          hasAiMarkers: false,
          hasAnyMetadata: false,
          status: 'queued',
        };

        newItems.push(item);
      }

      setItems((prev) => [...prev, ...newItems]);

      for (const item of newItems) {
        setItems((current) =>
          current.map((it) => (it.id === item.id ? { ...it, status: 'processing' } : it))
        );
        const processed = await processItem(item, options);
        setItems((current) =>
          current.map((it) => (it.id === item.id ? processed : it))
        );
      }
    },
    [items.length, options]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.cleanedUrl) URL.revokeObjectURL(it.cleanedUrl);
    });
    setItems([]);
    setGlobalError(null);
  };

  const handleRemoveItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (it?.cleanedUrl) URL.revokeObjectURL(it.cleanedUrl);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((it) => it.status === 'done' && it.cleanedBlob);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const it of readyItems) {
        if (it.cleanedBlob) {
          const extension = it.name.includes('.') ? it.name.split('.').pop() : 'jpg';
          const baseName = it.name.substring(0, it.name.lastIndexOf('.')) || it.name;
          const cleanFileName = `${baseName}_clean.${extension}`;
          zip.file(cleanFileName, it.cleanedBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `zeon_cleaned_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      setGlobalError(`Error creating ZIP archive: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsZipping(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const totalDetectedAi = items.filter((x) => x.hasAiMarkers).length;
  const totalCompleted = items.filter((x) => x.status === 'done').length;

  const shouldShowExpansion =
    hasSubmitted ||
    url.trim().length > 0 ||
    isProbing ||
    probeResult !== null ||
    isPrivateRestricted;

  return (
    <div
      className={`w-full max-w-xl sm:max-w-2xl mx-auto rounded-[28px] p-4 sm:p-5 transition-all duration-300 relative z-20 ${
        isDark
          ? 'bg-[#0f1226]/65 border border-white/[0.12] shadow-[0_16px_50px_-10px_rgba(124,92,255,0.45),inset_0_-1px_2px_rgba(168,85,247,0.3)] backdrop-blur-2xl'
          : 'bg-white/70 border border-white/90 shadow-[0_20px_60px_rgba(124,92,255,0.14)] backdrop-blur-2xl'
      }`}
    >
      {/* Subtle Bottom Rim Light */}
      <div className="absolute -bottom-[1px] left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-violet-500/60 to-transparent pointer-events-none rounded-full" />

      {/* Main Content Area */}
      <div className="space-y-3.5">
        <AnimatePresence mode="wait">
          {activeTab === 'video-audio' ? (
            <motion.div
              key="video-audio-panel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Top Input Row */}
              <div
                className={`relative flex items-center rounded-full p-1 pl-3.5 sm:pl-4 pr-1 border transition-all ${
                  isDark
                    ? 'bg-[#090b1c]/80 border-white/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] focus-within:border-violet-500/50'
                    : 'bg-white/85 border-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_4px_16px_rgba(124,92,255,0.06)] focus-within:border-violet-400'
                }`}
              >
                {/* Left Link Icon */}
                <Link2
                  className={`w-4 h-4 shrink-0 mr-2 transition-colors ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />

                {/* Text Input */}
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleContinueClick();
                  }}
                  placeholder="Paste a video, audio, or image URL..."
                  className={`w-full bg-transparent text-xs sm:text-sm outline-none pr-2 font-normal transition-colors ${
                    isDark
                      ? 'text-white placeholder-slate-500'
                      : 'text-slate-900 placeholder-slate-400'
                  }`}
                />

                {/* Paste Shortcut Button with Liquid Glass */}
                {!url && (
                  <LiquidButton
                    type="button"
                    onClick={handlePaste}
                    size="sm"
                    className={`hidden sm:flex items-center gap-1 mr-1.5 px-2.5 py-1 h-7 rounded-full text-[11px] font-medium transition-colors ${
                      isDark
                        ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>{copied ? 'Pasted!' : 'Paste'}</span>
                  </LiquidButton>
                )}

                {/* Glass Button: Continue → using LiquidButton component */}
                <LiquidButton
                  type="button"
                  onClick={handleContinueClick}
                  className="shrink-0 flex items-center justify-center gap-1 px-5 sm:px-6 py-2 h-9 rounded-full font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] shadow-[0_4px_16px_rgba(99,102,241,0.5)] transition-all cursor-pointer"
                >
                  {isProbing ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Checking...</span>
                    </div>
                  ) : (
                    <span>Continue →</span>
                  )}
                </LiquidButton>
              </div>

              {/* Dynamic Expansion Area: Constrained with max-h so page window never scrolls */}
              <AnimatePresence>
                {shouldShowExpansion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 pt-1 max-h-[46vh] overflow-y-auto pr-1"
                  >
                    {/* Platform Tag */}
                    {platform.platform !== 'unknown' && (
                      <div className="flex items-center justify-between text-xs px-1">
                        <div className="flex items-center gap-2">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            Platform:
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${platform.badgeBg}`}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: platform.color }}
                            />
                            {platform.displayName}
                          </span>
                        </div>

                        {/* Format Mode Selector (Video MP4 / Audio MP3) */}
                        <div
                          className={`inline-flex p-1 rounded-xl border ${
                            isDark
                              ? 'bg-neutral-950/80 border-neutral-800'
                              : 'bg-slate-100/90 border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setMode('video')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              mode === 'video'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                                : isDark
                                ? 'text-slate-400 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Video className="w-3 h-3" />
                            <span>MP4 Video</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode('audio')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              mode === 'audio'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                                : isDark
                                ? 'text-slate-400 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Music className="w-3 h-3" />
                            <span>MP3 Audio</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Probing State */}
                    {isProbing && (
                      <div
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-xs ${
                          isDark
                            ? 'bg-neutral-900/60 border-neutral-800 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                        <span>Inspecting live video stream & metadata...</span>
                      </div>
                    )}

                    {/* Private Video Detected Fallback Card */}
                    {isPrivateRestricted && (
                      <div className="bg-gradient-to-br from-amber-950/30 via-neutral-900/90 to-blue-950/20 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-xl">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                Private or Restricted Media
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                3-Dots Direct Player
                              </span>
                            </div>
                            <p className="text-xs text-white/90 leading-relaxed">
                              This video is protected by group or privacy settings. Download directly from your browser session using the modified link:
                            </p>
                          </div>
                        </div>

                        {/* Modified Link Box */}
                        <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              Modified Shell Link:
                            </span>
                            <p className="text-xs font-mono text-cyan-300 truncate" title={modifiedUrl}>
                              {modifiedUrl}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <LiquidButton
                              type="button"
                              onClick={handleCopyModified}
                              className="px-3 py-1.5 h-auto rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
                            >
                              {copiedModified ? 'Copied!' : 'Copy'}
                            </LiquidButton>
                            <LiquidButton
                              type="button"
                              onClick={() => window.open(modifiedUrl, '_blank')}
                              className="flex items-center gap-1 px-3.5 py-1.5 h-auto rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow transition-all"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open in New Tab</span>
                            </LiquidButton>
                          </div>
                        </div>

                        {/* 3 Steps Guide */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-300">
                          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                            <span className="font-bold text-amber-400 mr-1">1.</span>
                            Open the link in a new tab where you are logged in.
                          </div>
                          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                            <span className="font-bold text-blue-400 mr-1">2.</span>
                            Play video & click <strong>⋮ (3-Dots)</strong> in the player.
                          </div>
                          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                            <span className="font-bold text-emerald-400 mr-1">3.</span>
                            Click <strong>Download</strong> to save immediately.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TeraBox Fallback Card */}
                    {!isPrivateRestricted && isTeraBox && probeResult?.teraBoxFallback && (
                      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300">
                            TeraBox Direct Player
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                            Direct Stream
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {probeResult.teraBoxFallback.guidance}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <LiquidButton
                            type="button"
                            onClick={() => window.open(probeResult.teraBoxFallback!.embedUrl, '_blank')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 h-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open Web Player</span>
                          </LiquidButton>
                          <LiquidButton
                            type="button"
                            onClick={() => window.open(probeResult.teraBoxFallback!.wapUrl, '_blank')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 h-auto rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Open Mobile WAP</span>
                          </LiquidButton>
                        </div>
                      </div>
                    )}

                    {/* Public Media Probed Preview Card */}
                    {!isPrivateRestricted && !isTeraBox && probeResult?.success && (
                      <div
                        className={`rounded-2xl p-3 border transition-all ${
                          isDark
                            ? 'bg-neutral-950/80 border-white/10'
                            : 'bg-white/80 border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          {probeResult.thumbnail && (
                            <div className="relative rounded-xl overflow-hidden shrink-0 w-full sm:w-32 aspect-video bg-neutral-900 border border-neutral-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={probeResult.thumbnail}
                                alt={probeResult.title || 'Thumbnail'}
                                className="w-full h-full object-cover"
                              />
                              {probeResult.durationFormatted && (
                                <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-mono px-1 py-0.2 rounded">
                                  {probeResult.durationFormatted}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-1">
                            <h3
                              className={`text-xs font-semibold line-clamp-2 ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {probeResult.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-500">
                              {probeResult.uploader && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{probeResult.uploader}</span>
                                </div>
                              )}
                              {probeResult.durationFormatted && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{probeResult.durationFormatted}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-0.5 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Direct Stream Ready
                              </span>

                              <LiquidButton
                                type="button"
                                onClick={() => setIsTrimEnabled(!isTrimEnabled)}
                                size="sm"
                                className={`flex items-center gap-1.5 px-2.5 py-1 h-7 rounded-lg text-xs font-medium border transition-all ${
                                  isTrimEnabled
                                    ? 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-300'
                                    : isDark
                                    ? 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-white'
                                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <Scissors className="w-3 h-3" />
                                <span>Trim Clip</span>
                              </LiquidButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Time-Range Trimmer Controls */}
                    {!isPrivateRestricted && isTrimEnabled && !isTeraBox && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
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

                    {/* Download Glass Button (for public links) */}
                    {!isPrivateRestricted && !isTeraBox && (
                      <div className="space-y-3">
                        <LiquidButton
                          type="button"
                          onClick={handleDownload}
                          disabled={isDownloadDisabled}
                          className={`w-full py-3 px-6 h-auto rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isDownloadDisabled
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/40 opacity-50'
                              : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-600/30 active:scale-[0.99] border border-violet-400/30'
                          }`}
                        >
                          {isDownloading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>
                                Streaming {isTrimEnabled ? 'Trimmed Clip' : mode === 'video' ? 'Video' : 'Audio'}... ({downloadProgress}%)
                              </span>
                            </div>
                          ) : isTrimEnabled ? (
                            <div className="flex items-center gap-2">
                              <Scissors className="w-4 h-4" />
                              <span>
                                Download Trimmed {mode === 'video' ? 'Clip (MP4)' : 'Audio (MP3)'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Download className="w-4 h-4" />
                              <span>
                                Download {mode === 'video' ? 'Best Quality MP4' : 'Highest Bitrate MP3'}
                              </span>
                            </div>
                          )}
                        </LiquidButton>

                        {/* Live Download Progress Percentage Bar */}
                        <AnimatePresence>
                          {isDownloading && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -4 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -4 }}
                              transition={{ duration: 0.25 }}
                              className={`p-3.5 rounded-2xl border backdrop-blur-xl shadow-lg transition-all ${
                                isDark
                                  ? 'bg-neutral-900/90 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                                  : 'bg-white/95 border-indigo-100 shadow-[0_8px_24px_rgba(99,102,241,0.12)]'
                              }`}
                            >
                              {/* Header Row: Status & Live Percentage */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {downloadProgress === 100 ? (
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />
                                  )}
                                  <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    {downloadStatusText}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-xs font-extrabold tracking-tight text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                                    {downloadProgress}%
                                  </span>
                                  {downloadProgress < 100 && (
                                    <button
                                      type="button"
                                      onClick={handleCancelDownload}
                                      className="text-[10px] text-slate-400 hover:text-red-400 font-medium px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                      title="Cancel download"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress Track & Fill */}
                              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-black/50 overflow-hidden relative border border-slate-300/40 dark:border-white/5">
                                <div
                                  className={`h-full rounded-full transition-all duration-200 relative ${
                                    downloadProgress === 100
                                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                                      : 'bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                                  }`}
                                  style={{ width: `${downloadProgress}%` }}
                                >
                                  {downloadProgress < 100 && (
                                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                  )}
                                </div>
                              </div>

                              {/* Footer Detail Row */}
                              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                <span className="truncate pr-2">{downloadDetailText}</span>
                                {downloadSpeedOrSize && <span className="shrink-0">{downloadSpeedOrSize}</span>}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {downloadError && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl p-2.5 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{downloadError}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // ================= CLEAN IMAGE METADATA TAB VIEW =================
            <motion.div
              key="clean-metadata-panel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="space-y-3 max-h-[46vh] overflow-y-auto pr-1"
            >
              {/* Privacy Guarantee Header */}
              <div
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isDark
                    ? 'bg-cyan-950/30 border-cyan-500/20 text-slate-300'
                    : 'bg-cyan-50/70 border-cyan-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-semibold">
                    100% Client-Side Pure Binary Stripping (Zero Uploads)
                  </span>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.injectCameraExif}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, injectCameraExif: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Inject Camera EXIF</span>
                  {options.injectCameraExif && (
                    <select
                      value={options.cameraProfile}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          cameraProfile: e.target.value as CameraProfile,
                        }))
                      }
                      className={`text-[10px] rounded-lg px-2 py-0.5 border ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="apple">Apple iPhone 15</option>
                      <option value="sony">Sony Alpha</option>
                      <option value="canon">Canon EOS</option>
                    </select>
                  )}
                </label>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                    : isDark
                    ? 'border-white/10 hover:border-white/20 bg-neutral-950/40 hover:bg-neutral-950/60'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.avif,.heic"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4
                      className={`text-xs sm:text-sm font-bold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Drag & drop images here, or browse
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Strips C2PA, XMP, Midjourney/ComfyUI params & EXIF (Up to 30 files)
                    </p>
                  </div>
                </div>
              </div>

              {globalError && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-xl p-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{globalError}</span>
                </div>
              )}

              {/* Processed Items Batch List */}
              {items.length > 0 && (
                <div
                  className={`rounded-2xl p-3 border space-y-2.5 ${
                    isDark
                      ? 'bg-neutral-950/70 border-white/10'
                      : 'bg-white/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-300">
                        Queue ({items.length})
                      </span>
                      {totalDetectedAi > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold">
                          {totalDetectedAi} AI Markers
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <LiquidButton
                        type="button"
                        onClick={handleDownloadAllZip}
                        disabled={isZipping || totalCompleted === 0}
                        className="px-3 py-1.5 h-auto rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow flex items-center gap-1.5"
                      >
                        <FolderArchive className="w-3.5 h-3.5" />
                        <span>{isZipping ? 'Zipping...' : 'Download ZIP'}</span>
                      </LiquidButton>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                        title="Clear queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-white/5 max-h-40 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p
                            className={`font-semibold truncate max-w-[180px] sm:max-w-xs ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{formatBytes(item.size)}</span>
                            {item.markers.c2pa && (
                              <span className="text-red-400 font-semibold">• C2PA</span>
                            )}
                            {item.markers.xmp && (
                              <span className="text-orange-400 font-semibold">• XMP</span>
                            )}
                            {item.markers.pngText && (
                              <span className="text-amber-400 font-semibold">• PNG Text</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'done' && item.cleanedUrl ? (
                            <LiquidButton
                              type="button"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = item.cleanedUrl!;
                                a.download = `clean_${item.name}`;
                                a.click();
                              }}
                              className="px-2.5 py-1 h-auto rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </LiquidButton>
                          ) : (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= BOTTOM INTERNAL TAB BAR ================= */}
        <div className="pt-1 flex items-center justify-center">
          <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-semibold select-none">
            {/* 1. Video & Audio Tab Trigger */}
            <button
              type="button"
              onClick={() => setActiveTab('video-audio')}
              className={`relative flex items-center gap-2 pb-1 cursor-pointer transition-colors ${
                activeTab === 'video-audio'
                  ? isDark
                    ? 'text-white'
                    : 'text-[#0F172A]'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  activeTab === 'video-audio'
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : isDark
                    ? 'bg-white/5 border-white/10 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </div>
              <span>Video & Audio</span>

              {activeTab === 'video-audio' && (
                <motion.div
                  layoutId="internalActiveUnderline"
                  className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] bg-[#6366F1] rounded-full shadow-[0_0_8px_#6366F1]"
                />
              )}
            </button>

            {/* Subtle Divider */}
            <div
              className={`h-3.5 w-[1px] ${
                isDark ? 'bg-white/15' : 'bg-slate-300'
              }`}
            />

            {/* 2. Clean Image Metadata Tab Trigger */}
            <button
              type="button"
              onClick={() => setActiveTab('clean-metadata')}
              className={`relative flex items-center gap-2 pb-1 cursor-pointer transition-colors ${
                activeTab === 'clean-metadata'
                  ? isDark
                    ? 'text-white'
                    : 'text-[#0F172A]'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Clean Image Metadata</span>

              {activeTab === 'clean-metadata' && (
                <motion.div
                  layoutId="internalActiveUnderline"
                  className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] bg-[#6366F1] rounded-full shadow-[0_0_8px_#6366F1]"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
