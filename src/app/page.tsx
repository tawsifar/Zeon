'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Navbar } from '@/components/Navbar';
import { BackgroundAesthetics } from '@/components/BackgroundAesthetics';
import { FloatingPlatformTiles } from '@/components/FloatingPlatformTiles';
import { CentralCommandCard } from '@/components/CentralCommandCard';
import { SupportedPlatformsBar } from '@/components/SupportedPlatformsBar';
import { TrustFooterPill } from '@/components/TrustFooterPill';

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="relative h-screen max-h-screen flex flex-col justify-between overflow-hidden select-none">
      {/* Background Aesthetics: User-provided high-res light background or Dark midnight-aurora */}
      <BackgroundAesthetics />

      {/* 3D Floating Glass Platform Tiles (Left & Right Clusters) */}
      <FloatingPlatformTiles />

      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-1 w-full max-w-6xl mx-auto space-y-3 sm:space-y-4 my-auto">
        {/* Hero Typography Section */}
        <div className="text-center space-y-2 max-w-2xl mx-auto pt-0 sm:pt-1 select-none">
          {/* Eyebrow Pill */}
          <div className="flex items-center justify-center gap-3">
            {isDark ? (
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#94A3B8] uppercase">
                ONE TOOL. ENDLESS POSSIBILITIES.
              </span>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-6 sm:w-10 h-[1px] bg-indigo-200" />
                <span className="px-3 py-0.5 rounded-full border border-indigo-200/90 bg-white/70 text-[10px] sm:text-[11px] font-bold tracking-wider text-[#6366F1] uppercase backdrop-blur-md shadow-sm">
                  ALL-IN-ONE MEDIA TOOLKIT
                </span>
                <div className="w-6 sm:w-10 h-[1px] bg-indigo-200" />
              </div>
            )}
          </div>

          {/* Main H1 Headline (Zero Em Dashes) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.12]">
            <span className={isDark ? 'text-white block' : 'text-[#0F172A] block'}>
              Download, Train &amp; Clean
            </span>
            <span
              className={`block bg-clip-text text-transparent ${
                isDark
                  ? 'bg-gradient-to-r from-[#7A77FF] via-[#9B7BFF] to-[#C084FC]'
                  : 'bg-gradient-to-r from-[#7C5CFF] via-[#A855F7] to-[#F48FB1]'
              }`}
            >
              Media, All in One Place.
            </span>
          </h1>

          {/* Subtitle (Zero Em Dashes) */}
          <p
            className={`max-w-lg mx-auto text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
            }`}
          >
            Grab videos and audio from almost any platform, train them for your needs,
            and remove AI metadata from images quickly, easily, and securely.
          </p>
        </div>

        {/* Central Glassmorphic Command Card */}
        <CentralCommandCard />

        {/* Supported Platforms Strip */}
        <SupportedPlatformsBar />
      </main>

      {/* Bottom Trust Footer Pill */}
      <div className="relative z-20 pb-1">
        <TrustFooterPill />
      </div>
    </div>
  );
}
