'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  ShieldCheck,
  Film,
  Scissors,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { LiquidButton } from '@/components/ui/liquid-glass-button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const supportedPlatforms = [
    { name: 'YouTube', category: 'Video / Audio', color: '#FF0000', note: 'Videos, Shorts & Playlists' },
    { name: 'TikTok', category: 'Video', color: isDark ? '#FFFFFF' : '#000000', note: 'Watermark-free audio & video' },
    { name: 'Instagram', category: 'Social', color: '#E1306C', note: 'Reels, Posts, Carousels & Stories' },
    { name: 'Facebook', category: 'Social', color: '#1877F2', note: 'Public Reels & Private Groups (3-Dots)' },
    { name: 'Twitter / X', category: 'Social', color: isDark ? '#FFFFFF' : '#000000', note: 'HD Clips & Threads' },
    { name: 'Reddit', category: 'Social', color: '#FF4500', note: 'Native merged Video + Audio' },
    { name: 'Vimeo', category: 'Video', color: '#1AB7EA', note: 'Original master streaming' },
    { name: 'Twitch', category: 'Live & Clips', color: '#9146FF', note: 'Broadcast clips & VODs' },
    { name: 'SoundCloud', category: 'Audio', color: '#FF5500', note: 'Lossless audio streaming & MP3' },
    { name: 'Pinterest', category: 'Media', color: '#E60023', note: 'Direct pin video downloads' },
    { name: 'TeraBox', category: 'Cloud Share', color: '#4F46E5', note: 'Direct web player fallback' },
    { name: 'Dailymotion', category: 'Video', color: '#0066DC', note: 'Fast streaming video' },
    { name: 'Bilibili', category: 'Video', color: '#00A1D6', note: 'Animation & video archives' },
    { name: 'Google Drive', category: 'Cloud Share', color: '#34A853', note: 'Public file direct streams' },
    { name: 'Dropbox', category: 'Cloud Share', color: '#0061FE', note: 'Direct media download links' },
  ];

  const supportedImageFormats = [
    'JPEG / JPG',
    'PNG',
    'WebP',
    'AVIF',
    'HEIC / HEIF',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          />

          {/* Modal Card with Liquid Glass Refraction */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={`relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-5 sm:p-7 border shadow-2xl transition-all ${
              isDark
                ? 'bg-[#0b0e24]/90 border-white/15 text-white shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)]'
                : 'bg-white/90 border-white/90 text-slate-900 shadow-[0_25px_60px_rgba(124,92,255,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)]'
            } backdrop-blur-2xl`}
          >
            {/* Header Area */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <Image
                  src="/zeon-icon.png"
                  alt="Zeon Logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain rounded-xl shadow-xs"
                />
                <div>
                  <h2 id="about-title" className="text-lg font-bold tracking-tight">
                    About Zeon
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unified Media Engine &amp; Privacy-First AI Metadata Stripper
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close About Dialog"
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-5 pt-4 text-sm">
              {/* Developer Credit Card */}
              <div className="p-3.5 rounded-2xl border bg-slate-500/[0.04] dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-600/30">
                    T
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold block">
                      Engineering &amp; Architecture
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Developer: Tawsif
                    </span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                  Lead Creator
                </div>
              </div>

              {/* Section 1: What is Zeon For? */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>What is Zeon For?</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Zeon is a unified high-performance media toolkit created for developers, video editors, content archivists, and privacy advocates. It bridges three essential media capabilities in one sleek interface:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-2xl border bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-300">
                      <Film className="w-3.5 h-3.5" />
                      <span>Universal Downloader</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Ultra-fast 1-click media extraction in best-quality MP4 video or MP3 audio across major video and cloud platforms.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-300">
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Precision Trimming</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Keyframe-accurate slicing down to the millisecond. Download only the exact section you need without downloading full files.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>AI Metadata Stripper</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      100% in-browser client-side stripping of C2PA manifests, XMP packets, Midjourney prompts, and EXIF tracking metadata.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Supported Platforms */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>Supported Platforms ({supportedPlatforms.length}+)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Continuous updates &amp; zero account logins
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {supportedPlatforms.map((p) => (
                    <div
                      key={p.name}
                      className="p-2 rounded-xl border bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-semibold truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {p.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Supported Formats & Privacy Guarantee */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Privacy &amp; Binary Cleaning Architecture</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>100% Client-Side Image Processing</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Your images never touch an external server. The stripping engine parses raw binary chunks directly in your browser memory, removes C2PA JUMBF boxes and AI prompts, and produces clean files with zero external network requests.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {supportedImageFormats.map((fmt) => (
                      <span
                        key={fmt}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-medium"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Developer: <span className="font-bold text-indigo-600 dark:text-indigo-400">Tawsif</span>
              </div>
              <LiquidButton
                type="button"
                onClick={onClose}
                className="px-6 py-1.5 h-8 rounded-full font-semibold text-xs sm:text-sm text-white bg-slate-900 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md transition-colors"
              >
                Got It
              </LiquidButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
