'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export function BackgroundAesthetics() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {isDark ? (
        // DARK THEME: Deep Obsidian + Midnight Aurora + Horizon Mountain Contours + Reflective Lake
        <div className="absolute inset-0 transition-opacity duration-700 opacity-100">
          {/* Base Midnight Background */}
          <div className="absolute inset-0 bg-[#060711]" />

          {/* Deep Aurora Radial Atmospheric Glows */}
          <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1300px] h-[700px] bg-gradient-to-b from-indigo-600/30 via-purple-700/20 to-transparent blur-[140px] rounded-full" />
          <div className="absolute top-[15%] -left-[10%] w-[750px] h-[750px] bg-indigo-700/25 blur-[160px] rounded-full" />
          <div className="absolute top-[12%] -right-[10%] w-[750px] h-[750px] bg-purple-700/25 blur-[160px] rounded-full" />

          {/* Flowing Aurora Smoke & Silk Ribbons (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen"
            preserveAspectRatio="none"
            viewBox="0 0 1440 900"
            fill="none"
          >
            <defs>
              <linearGradient id="auroraLeftDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#060711" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="auroraRightDark" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9333EA" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#6366F1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#060711" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="mountainGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0d1127" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#05060f" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="mountainGradRight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10142e" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#05060f" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Aurora Waves */}
            <path
              d="M-50,480 C180,280 320,540 680,380 C1020,220 1200,450 1500,290 L1500,900 L-50,900 Z"
              fill="url(#auroraRightDark)"
            />
            <path
              d="M-50,320 C220,460 480,200 840,390 C1140,560 1320,340 1500,460 L1500,900 L-50,900 Z"
              fill="url(#auroraLeftDark)"
            />

            {/* Mountain Silhouettes */}
            <path
              d="M-50,620 L-50,450 Q40,430 110,480 L180,440 L280,560 L380,520 L480,620 L-50,620 Z"
              fill="url(#mountainGradLeft)"
              opacity="0.85"
            />
            <path
              d="M1500,620 L1500,430 Q1420,420 1360,470 L1280,430 L1180,540 L1080,510 L980,620 L1500,620 Z"
              fill="url(#mountainGradRight)"
              opacity="0.85"
            />
          </svg>

          {/* Lower Third Glossy Horizon Lake */}
          <div className="absolute bottom-0 inset-x-0 h-[260px] bg-gradient-to-t from-[#04050c] via-[#070919]/90 to-transparent">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent" />
            <div className="absolute top-12 left-1/4 w-1/2 h-[50px] bg-purple-500/12 blur-3xl rounded-full" />
            <div className="absolute top-24 left-1/3 w-1/3 h-[40px] bg-indigo-500/10 blur-2xl rounded-full" />
          </div>
        </div>
      ) : (
        // LIGHT THEME: The user-provided high-res background image that fits perfectly in 100% zoom
        <div className="absolute inset-0 transition-opacity duration-700 opacity-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/light-bg.png"
            alt="Light Background"
            className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
          />

          {/* Floating Pearl Bubbles with Specular Caustics */}
          <div className="absolute top-[26%] left-[8%] w-14 h-14 rounded-full bg-white/70 border border-white shadow-[0_8px_24px_rgba(124,92,255,0.14),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-md animate-float-bubble" />
          <div className="absolute top-[62%] left-[6%] w-18 h-18 rounded-full bg-white/60 border border-white/90 shadow-[0_12px_32px_rgba(124,92,255,0.16),inset_0_3px_6px_rgba(255,255,255,0.95)] backdrop-blur-md animate-float-bubble [animation-delay:1.5s]" />
          <div className="absolute top-[30%] right-[9%] w-12 h-12 rounded-full bg-white/65 border border-white shadow-[0_8px_20px_rgba(124,92,255,0.14),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-md animate-float-bubble [animation-delay:2.5s]" />
          <div className="absolute top-[56%] right-[5%] w-16 h-16 rounded-full bg-white/55 border border-white/80 shadow-[0_10px_28px_rgba(124,92,255,0.12),inset_0_2px_5px_rgba(255,255,255,0.95)] backdrop-blur-md animate-float-bubble [animation-delay:3.5s]" />
        </div>
      )}
    </div>
  );
}
