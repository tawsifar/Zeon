'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export function FloatingPlatformTiles() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10 hidden lg:block">
      {/* ================= LEFT CLUSTER ================= */}
      <div className="absolute left-[1%] xl:left-[3%] 2xl:left-[6%] top-[14%] sm:top-[16%] w-[280px] xl:w-[320px] h-[480px]">
        {/* 1. YouTube Tile (Top-Left, Large, -rotate-12) */}
        <div
          className="absolute top-0 left-2 xl:left-4 animate-float-slow"
          style={{ '--tile-rot': '-12deg' } as React.CSSProperties}
        >
          <div
            className={`w-20 h-20 xl:w-24 xl:h-24 rounded-3xl flex items-center justify-center p-3 xl:p-4 transition-all duration-300 ${
              isDark
                ? 'bg-[#121631]/60 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.25)] backdrop-blur-xl'
                : 'bg-white/65 border border-white/90 shadow-[0_16px_36px_rgba(124,92,255,0.16),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-xl'
            }`}
          >
            <div className="w-12 h-8 xl:w-14 xl:h-10 rounded-xl bg-[#FF0000] flex items-center justify-center shadow-md shadow-red-600/30">
              <svg className="w-4 h-4 xl:w-5 xl:h-5 fill-white ml-0.5" viewBox="0 0 24 24">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Floating Bubble near YouTube */}
        <div className="absolute top-6 right-8 xl:right-12 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-white/40 border border-white/70 shadow-sm backdrop-blur-md animate-float-bubble" />

        {/* 2. TikTok Tile (Mid-Left, rotate-6) */}
        <div
          className="absolute top-[125px] right-4 xl:right-8 animate-float-slow-reverse"
          style={{ '--tile-rot': '6deg' } as React.CSSProperties}
        >
          <div
            className={`w-16 h-16 xl:w-18 xl:h-18 rounded-2xl flex items-center justify-center p-2.5 xl:p-3 transition-all duration-300 ${
              isDark
                ? 'bg-[#121631]/60 border border-white/20 shadow-[0_14px_36px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] backdrop-blur-xl'
                : 'bg-white/65 border border-white/90 shadow-[0_14px_32px_rgba(124,92,255,0.14),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-xl'
            }`}
          >
            <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-xl bg-black flex items-center justify-center shadow-md shadow-black/40 relative overflow-hidden">
              <svg className="w-5 h-5 xl:w-6 xl:h-6" viewBox="0 0 24 24">
                <path
                  fill="#00F2FE"
                  d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.068-.102a2.895 2.895 0 0 1 2.373-4.537c.394 0 .769.078 1.114.22V9.45a6.34 6.34 0 0 0-1.114-.1c-3.535 0-6.4 2.865-6.4 6.4s2.865 6.4 6.4 6.4a6.402 6.402 0 0 0 6.399-6.4V8.472a8.17 8.17 0 0 0 4.712 1.488V6.515a4.838 4.838 0 0 1-1.001.171z"
                  transform="translate(-0.5, -0.5)"
                />
                <path
                  fill="#FE2C55"
                  d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.068-.102a2.895 2.895 0 0 1 2.373-4.537c.394 0 .769.078 1.114.22V9.45a6.34 6.34 0 0 0-1.114-.1c-3.535 0-6.4 2.865-6.4 6.4s2.865 6.4 6.4 6.4a6.402 6.402 0 0 0 6.399-6.4V8.472a8.17 8.17 0 0 0 4.712 1.488V6.515a4.838 4.838 0 0 1-1.001.171z"
                  transform="translate(0.5, 0.5)"
                />
                <path
                  fill="#FFFFFF"
                  d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.068-.102a2.895 2.895 0 0 1 2.373-4.537c.394 0 .769.078 1.114.22V9.45a6.34 6.34 0 0 0-1.114-.1c-3.535 0-6.4 2.865-6.4 6.4s2.865 6.4 6.4 6.4a6.402 6.402 0 0 0 6.399-6.4V8.472a8.17 8.17 0 0 0 4.712 1.488V6.515a4.838 4.838 0 0 1-1.001.171z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. Instagram Tile (Bottom-Left, -rotate-6) */}
        <div
          className="absolute top-[240px] left-4 xl:left-8 animate-float-slow"
          style={{ '--tile-rot': '-6deg' } as React.CSSProperties}
        >
          <div
            className={`w-18 h-18 xl:w-20 xl:h-20 rounded-2xl flex items-center justify-center p-2.5 xl:p-3 transition-all duration-300 ${
              isDark
                ? 'bg-[#121631]/60 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] backdrop-blur-xl'
                : 'bg-white/65 border border-white/90 shadow-[0_16px_36px_rgba(124,92,255,0.14),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-xl'
            }`}
          >
            <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#C13584] flex items-center justify-center p-2 shadow-md shadow-pink-500/20">
              <svg className="w-full h-full fill-white" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. X (Twitter) Tile (Inner-Left, rotate-12, Smaller) */}
        <div
          className="absolute top-[260px] right-6 xl:right-10 animate-float-slow-reverse"
          style={{ '--tile-rot': '12deg' } as React.CSSProperties}
        >
          <div
            className={`w-13 h-13 xl:w-14 xl:h-14 rounded-2xl flex items-center justify-center p-2 xl:p-2.5 transition-all duration-300 ${
              isDark
                ? 'bg-[#121631]/60 border border-white/20 shadow-[0_12px_28px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.2)] backdrop-blur-xl'
                : 'bg-white/65 border border-white/90 shadow-[0_12px_28px_rgba(124,92,255,0.12),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-xl'
            }`}
          >
            <svg
              className={`w-5 h-5 xl:w-6 xl:h-6 ${isDark ? 'fill-white' : 'fill-[#0F172A]'}`}
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>

        {/* Lower Left Bubble */}
        <div className="absolute top-[350px] left-14 xl:left-20 w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-white/45 border border-white/80 shadow-md backdrop-blur-md animate-float-bubble [animation-delay:2s]" />
      </div>

      {/* ================= RIGHT CLUSTER ================= */}
      <div className="absolute right-[1%] xl:right-[3%] 2xl:right-[6%] top-[14%] sm:top-[16%] w-[290px] xl:w-[330px] h-[480px]">
        {/* 1. Spotify Tile (Top-Right, rotate-12) */}
        <div
          className="absolute top-2 left-6 xl:left-10 animate-float-slow"
          style={{ '--tile-rot': '12deg' } as React.CSSProperties}
        >
          <div
            className={`w-16 h-16 xl:w-18 xl:h-18 rounded-2xl flex items-center justify-center p-2.5 xl:p-3 transition-all duration-300 ${
              isDark
                ? 'bg-[#121631]/60 border border-white/20 shadow-[0_14px_36px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] backdrop-blur-xl'
                : 'bg-white/65 border border-white/90 shadow-[0_14px_32px_rgba(124,92,255,0.14),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-xl'
            }`}
          >
            <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-full bg-[#1ED760] flex items-center justify-center shadow-md shadow-emerald-500/25">
              <svg className="w-5 h-5 xl:w-6 xl:h-6 fill-black" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 2. Facebook Tile (Top-Right / Far-Right, -rotate-10) */}
        <div
          className="absolute top-10 right-4 xl:right-6 animate-float-slow-reverse"
          style={{ '--tile-rot': '-10deg' } as React.CSSProperties}
        >
          <div
            className={`w-16 h-16 xl:w-18 xl:h-18 rounded-2xl flex items-center justify-center p-2.5 xl:p-3 transition-all duration-300 ${
              isDark
                ? 'bg-[#121631]/60 border border-white/20 shadow-[0_16px_38px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] backdrop-blur-xl'
                : 'bg-white/65 border border-white/90 shadow-[0_16px_34px_rgba(124,92,255,0.14),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-xl'
            }`}
          >
            <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-md shadow-blue-600/30">
              <svg className="w-6 h-6 xl:w-7 xl:h-7 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. Twitch / Live Media Tile (Mid-Right, rotate-6) */}
        <div
          className="absolute top-[150px] left-4 xl:left-6 animate-float-slow"
          style={{ '--tile-rot': '6deg' } as React.CSSProperties}
        >
          <div
            className={`w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex items-center justify-center p-2.5 xl:p-3 transition-all duration-300 ${
              isDark
                ? 'bg-[#121631]/60 border border-white/20 shadow-[0_14px_32px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.2)] backdrop-blur-xl'
                : 'bg-white/65 border border-white/90 shadow-[0_14px_30px_rgba(124,92,255,0.12),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-xl'
            }`}
          >
            <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#9146FF] flex items-center justify-center shadow-md shadow-purple-600/30">
              <svg className="w-5 h-5 xl:w-6 xl:h-6 fill-white" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Overlapping Pair: Audio Waveform Tile + Image Mountains Tile with AI Badge */}
        <div className="absolute top-[210px] right-2 xl:right-4 w-[190px] xl:w-[210px] h-[190px]">
          {/* Layer 1: Audio Waveform Tile (Behind, -rotate-6) */}
          <div
            className="absolute top-4 left-0 animate-float-slow-reverse"
            style={{ '--tile-rot': '-6deg' } as React.CSSProperties}
          >
            <div
              className={`w-20 h-20 xl:w-24 xl:h-24 rounded-3xl flex items-center justify-center p-2.5 xl:p-3 transition-all duration-300 ${
                isDark
                  ? 'bg-[#121631]/50 border border-white/15 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur-xl'
                  : 'bg-white/55 border border-white/80 shadow-[0_14px_30px_rgba(124,92,255,0.12)] backdrop-blur-xl'
              }`}
            >
              {/* Cyan / Blue Audio Waveform Bars */}
              <div className="flex items-center gap-1.5 h-8 xl:h-10">
                <div className="w-1.5 h-3 xl:h-4 bg-cyan-400 rounded-full animate-pulse" />
                <div className="w-1.5 h-6 xl:h-8 bg-sky-400 rounded-full" />
                <div className="w-1.5 h-8 xl:h-10 bg-indigo-400 rounded-full" />
                <div className="w-1.5 h-5 xl:h-6 bg-cyan-400 rounded-full" />
                <div className="w-1.5 h-2.5 xl:h-3 bg-sky-300 rounded-full" />
              </div>
            </div>
          </div>

          {/* Layer 2: Image Mountain Tile with AI Badge (In front, rotate-6) */}
          <div
            className="absolute top-8 xl:top-10 left-12 xl:left-16 z-20 animate-float-slow"
            style={{ '--tile-rot': '6deg' } as React.CSSProperties}
          >
            <div
              className={`relative w-20 h-20 xl:w-24 xl:h-24 rounded-3xl flex items-center justify-center p-3 xl:p-4 transition-all duration-300 ${
                isDark
                  ? 'bg-[#161b3d]/75 border border-white/25 shadow-[0_20px_45px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.3)] backdrop-blur-2xl'
                  : 'bg-white/80 border border-white shadow-[0_20px_40px_rgba(124,92,255,0.18),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-2xl'
              }`}
            >
              {/* Mountain landscape SVG */}
              <svg
                className={`w-10 h-10 xl:w-12 xl:h-12 ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>

              {/* Glowing Circular AI Badge in bottom-right corner */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 xl:w-7 xl:h-7 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 border border-white/80 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.8)]">
                <span className="text-[9px] xl:text-[10px] font-black tracking-tighter text-white font-mono">
                  AI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Small floating bubble */}
        <div className="absolute top-[360px] right-14 xl:right-20 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-white/40 border border-white/70 shadow-sm backdrop-blur-md animate-float-bubble [animation-delay:1.8s]" />
      </div>
    </div>
  );
}
