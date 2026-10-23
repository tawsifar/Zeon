'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Home,
  ArrowDownToLine,
  ShieldCheck,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { MagneticDock, DockItemData } from '@/components/ui/magnetic-dock';
import { AboutModal } from '@/components/AboutModal';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [activeId, setActiveId] = useState<'home' | 'tools' | 'clean' | 'about'>('home');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleHomeClick = () => {
    setActiveId('home');
    window.dispatchEvent(new CustomEvent('zeon:switch-tab', { detail: 'video-audio' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToolsClick = () => {
    setActiveId('tools');
    window.dispatchEvent(new CustomEvent('zeon:switch-tab', { detail: 'video-audio' }));
  };

  const handleCleanClick = () => {
    setActiveId('clean');
    window.dispatchEvent(new CustomEvent('zeon:switch-tab', { detail: 'clean-metadata' }));
  };

  const handleAboutClick = () => {
    setActiveId('about');
    setIsAboutOpen(true);
  };

  const dockItems: DockItemData[] = [
    {
      id: 'brand',
      label: 'Home',
      icon: <Home className="w-4 h-4" strokeWidth={1.75} />,
      onClick: handleHomeClick,
      isActive: activeId === 'home',
    },
    {
      id: 'tools',
      label: 'Media Downloader',
      icon: <ArrowDownToLine className="w-4 h-4" strokeWidth={1.75} />,
      onClick: handleToolsClick,
      isActive: activeId === 'tools',
    },
    {
      id: 'clean',
      label: 'Clean AI Metadata',
      icon: <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />,
      onClick: handleCleanClick,
      isActive: activeId === 'clean',
    },
    {
      id: 'about',
      label: 'About & Platforms',
      icon: <Info className="w-4 h-4" strokeWidth={1.75} />,
      onClick: handleAboutClick,
      isActive: isAboutOpen || activeId === 'about',
    },
    {
      id: 'theme',
      label: isDark ? 'Switch to Light' : 'Switch to Dark',
      icon: isDark ? (
        <Sun className="w-4 h-4 text-amber-300" strokeWidth={1.75} />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
      ),
      onClick: toggleTheme,
    },
  ];

  return (
    <>
      <header className="relative z-40 w-full pt-3 pb-1 px-4 flex items-center justify-between max-w-6xl mx-auto select-none">
        {/* Left Brand Badge with Official Zeon Logo */}
        <div
          onClick={handleHomeClick}
          className="group flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] bg-white/70 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs hover:shadow-md"
        >
          <Image
            src="/zeon-icon.png"
            alt="Zeon Logo"
            width={24}
            height={24}
            className="w-6 h-6 object-contain rounded-md transition-transform duration-300 group-hover:scale-110"
            priority
          />
          <span className="text-sm font-extrabold tracking-[0.16em] text-slate-900 dark:text-white font-sans">
            ZEON
          </span>
          <span className="hidden sm:inline-block text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            PRO
          </span>
        </div>

        {/* Center: Refined Floating Magnetic Dock Navigation Bar */}
        <div className="flex justify-center">
          <MagneticDock
            items={dockItems}
            iconSize={38}
            maxScale={1.25}
            magneticDistance={100}
            position="top"
            variant="glass"
            className="px-2.5 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)]"
          />
        </div>

        {/* Right Status Capsule: Fast • Private • Secure + Developer: Tawsif Credit */}
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-xl bg-white/70 dark:bg-white/[0.06] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          <span className="tracking-tight text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Fast • Private • Secure
          </span>
          <span className="h-3 w-[1px] bg-slate-300 dark:bg-white/15" />
          <span className="text-[10px] font-mono font-medium text-indigo-600 dark:text-indigo-400">
            Developer: Tawsif
          </span>
        </div>
      </header>

      {/* About Modal Dialog */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
