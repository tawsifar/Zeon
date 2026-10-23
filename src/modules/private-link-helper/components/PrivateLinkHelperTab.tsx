'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  MousePointerClick,
  MoreVertical,
  Download,
  Lock,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { transformPrivateVideoUrl } from '../transformer';
import { TransformationResult } from '../types';

export function PrivateLinkHelperTab() {
  const [inputUrl, setInputUrl] = useState('');
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTransform = (val: string) => {
    setInputUrl(val);
    if (val.trim()) {
      const res = transformPrivateVideoUrl(val);
      setResult(res);
    } else {
      setResult(null);
    }
  };

  const handleCopy = () => {
    if (result?.modifiedUrl) {
      navigator.clipboard.writeText(result.modifiedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpen = () => {
    if (result?.modifiedUrl) {
      window.open(result.modifiedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900/60 to-teal-950/40 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Client-Side Privacy Policy (Zero Passwords, Zero Proxies)
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Private Video Link Modifier: 3-Dots Helper
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Rewrites private Facebook, Instagram, or LinkedIn feeds into unencumbered mobile-basic containers where the native browser 3-dots download button is fully unlocked.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-3.5 py-2 rounded-xl self-start md:self-auto font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero Account Credentials Needed</span>
          </div>
        </div>
      </div>

      {/* Input Field */}
      <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Private Post / Reel URL
        </label>

        <div className="relative">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => handleTransform(e.target.value)}
            placeholder="Paste private Facebook Reel/Watch, Instagram post, or LinkedIn update link..."
            className="w-full px-4 py-4 bg-neutral-950/90 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm font-mono"
          />
        </div>

        {/* Transformation Output Card */}
        {result && result.isValid && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-2"
          >
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Modified Action Link ({result.platformName})
                </span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 font-mono text-xs text-neutral-200 break-all select-all">
                {result.modifiedUrl}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>{result.explanation}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpen}
                  className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-emerald-400/30"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab (Logged In Session)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl font-semibold text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center justify-center gap-2 border border-neutral-700/60"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Link' : 'Copy Modified Link'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Interactive Visual 3-Step Micro-Guide */}
      <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
          <span>How It Works: 3-Step Native Browser Download Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Step 1 */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-emerald-400" />
                Open in New Tab
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Click <strong>Open in New Tab</strong>. The rewritten URL loads via your active browser session without passing credentials anywhere.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MoreVertical className="w-4 h-4 text-teal-400" />
                Tap ⋮ (Three Dots)
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Start playing the video. In the bottom-right corner of the native HTML5 player, tap the standard <strong>⋮ (Three Dots)</strong> menu.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-cyan-400" />
                Save Video
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Select <strong>Download</strong> (or right-click &quot;Save video as...&quot;) to immediately save the original MP4 file directly to your device storage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
