'use client';

import React from 'react';
import { ArrowDownToLine, Lock, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function TrustFooterPill() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full flex justify-center pb-6 select-none">
      <div
        className={`inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-6 sm:px-8 py-2 rounded-full border backdrop-blur-xl transition-all ${
          isDark
            ? 'bg-white/[0.04] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
            : 'bg-white/70 border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.05)]'
        }`}
      >
        {/* 1. High Quality Downloads */}
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-500" strokeWidth={1.75} />
          <span
            className={`text-xs font-medium tracking-tight ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            High Quality Downloads
          </span>
        </div>

        {/* Divider */}
        <div
          className={`h-3 w-[1px] ${
            isDark ? 'bg-white/10' : 'bg-slate-300'
          }`}
        />

        {/* 2. No Account Required */}
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.75} />
          <span
            className={`text-xs font-medium tracking-tight ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            No Account Required
          </span>
        </div>

        {/* Divider */}
        <div
          className={`h-3 w-[1px] ${
            isDark ? 'bg-white/10' : 'bg-slate-300'
          }`}
        />

        {/* 3. Image Metadata Cleanup */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" strokeWidth={1.75} />
          <span
            className={`text-xs font-medium tracking-tight ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Client-Side Privacy
          </span>
        </div>

        {/* Divider */}
        <div
          className={`h-3 w-[1px] ${
            isDark ? 'bg-white/10' : 'bg-slate-300'
          }`}
        />

        {/* 4. Developer Credit */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Developer:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">Tawsif</span>
        </div>
      </div>
    </div>
  );
}
