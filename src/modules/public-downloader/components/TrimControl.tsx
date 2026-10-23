'use client';

import React, { useRef, useCallback } from 'react';
import {
  Scissors,
  Clock,
  RotateCcw,
  AlertCircle,
  Film,
  Sparkles,
} from 'lucide-react';
import {
  formatSecondsToTimestamp,
} from '../time';

interface TrimControlProps {
  duration?: number;
  startTime: number;
  endTime: number;
  startInput: string;
  endInput: string;
  onRangeChange: (start: number, end: number) => void;
  onStartInputChange: (val: string) => void;
  onEndInputChange: (val: string) => void;
  validationError?: string | null;
}

export function TrimControl({
  duration,
  startTime,
  endTime,
  startInput,
  endInput,
  onRangeChange,
  onStartInputChange,
  onEndInputChange,
  validationError,
}: TrimControlProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<'start' | 'end' | null>(null);

  const hasKnownDuration = typeof duration === 'number' && duration > 0;
  const totalDuration = hasKnownDuration ? duration : 60;
  const forceHours = totalDuration >= 3600 || startTime >= 3600 || endTime >= 3600;

  // Percentage calculations for slider track
  const startPercent = Math.max(0, Math.min(100, (startTime / totalDuration) * 100));
  const endPercent = Math.max(0, Math.min(100, (endTime / totalDuration) * 100));

  // Compute live clip duration
  const clipDuration = Math.max(0, endTime - startTime);
  const clipSummaryText = `Selected Clip: ${formatSecondsToTimestamp(clipDuration, forceHours)} (from ${formatSecondsToTimestamp(startTime, forceHours)} to ${formatSecondsToTimestamp(endTime, forceHours)})`;

  // Handle pointer down on handles
  const handlePointerDown = (type: 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = type;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const percentage = offsetX / rect.width;
      const rawSeconds = Math.round(percentage * totalDuration);

      if (isDraggingRef.current === 'start') {
        const newStart = Math.max(0, Math.min(rawSeconds, endTime - 1));
        onRangeChange(newStart, endTime);
      } else if (isDraggingRef.current === 'end') {
        const newEnd = Math.max(startTime + 1, Math.min(rawSeconds, totalDuration));
        onRangeChange(startTime, newEnd);
      }
    },
    [endTime, startTime, totalDuration, onRangeChange]
  );

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      isDraggingRef.current = null;
    }
  };

  // Handle direct click on track: moves closest handle
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || isDraggingRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percentage = offsetX / rect.width;
    const clickSeconds = Math.round(percentage * totalDuration);

    const distToStart = Math.abs(clickSeconds - startTime);
    const distToEnd = Math.abs(clickSeconds - endTime);

    if (distToStart < distToEnd) {
      const newStart = Math.max(0, Math.min(clickSeconds, endTime - 1));
      onRangeChange(newStart, endTime);
    } else {
      const newEnd = Math.max(startTime + 1, Math.min(clickSeconds, totalDuration));
      onRangeChange(startTime, newEnd);
    }
  };

  // Preset buttons
  const applyPreset = (presetSeconds: number) => {
    const end = Math.min(presetSeconds, totalDuration);
    onRangeChange(0, end);
  };

  const resetToFull = () => {
    onRangeChange(0, totalDuration);
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white/70 dark:bg-[#0e1017]/90 border border-slate-200/80 dark:border-violet-500/20 p-4 sm:p-5 backdrop-blur-xl shadow-xl transition-all">
      {/* Header and Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-500 dark:text-violet-300">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Precision Time-Range Trimmer
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                Lossless Clip
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Only downloads the requested time window directly from stream
            </p>
          </div>
        </div>

        {/* Live Clip Summary Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/30 text-xs font-mono text-violet-700 dark:text-cyan-300 shadow-inner">
          <Film className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <span className="font-semibold">{clipSummaryText}</span>
        </div>
      </div>

      {/* Dual-Thumb Timeline Slider */}
      {hasKnownDuration ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-400 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              Start: {formatSecondsToTimestamp(startTime, forceHours)}
            </span>
            <span className="text-slate-400 dark:text-neutral-500 font-sans text-[10px]">
              Drag handles or click timeline
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              End: {formatSecondsToTimestamp(endTime, forceHours)}
            </span>
          </div>

          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="relative w-full h-4 bg-slate-100 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700/80 rounded-full cursor-pointer select-none touch-none py-1"
          >
            {/* Background Track Pattern */}
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full pointer-events-none" />

            {/* Selected Active Range Bar */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-full shadow-lg shadow-violet-500/30 pointer-events-none transition-all duration-75"
              style={{
                left: `${startPercent}%`,
                width: `${Math.max(0, endPercent - startPercent)}%`,
              }}
            />

            {/* Start Thumb Handle */}
            <div
              onPointerDown={handlePointerDown('start')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ left: `${startPercent}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-violet-600 shadow-lg shadow-violet-600/50 cursor-ew-resize hover:scale-110 active:scale-125 transition-transform flex items-center justify-center group z-20"
              title={`Start: ${formatSecondsToTimestamp(startTime, forceHours)}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity bg-slate-900 dark:bg-neutral-900 text-white font-mono text-[10px] px-2 py-0.5 rounded border border-neutral-700 whitespace-nowrap pointer-events-none">
                {formatSecondsToTimestamp(startTime, forceHours)}
              </div>
            </div>

            {/* End Thumb Handle */}
            <div
              onPointerDown={handlePointerDown('end')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ left: `${endPercent}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-cyan-500 shadow-lg shadow-cyan-500/50 cursor-ew-resize hover:scale-110 active:scale-125 transition-transform flex items-center justify-center group z-20"
              title={`End: ${formatSecondsToTimestamp(endTime, forceHours)}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity bg-slate-900 dark:bg-neutral-900 text-white font-mono text-[10px] px-2 py-0.5 rounded border border-neutral-700 whitespace-nowrap pointer-events-none">
                {formatSecondsToTimestamp(endTime, forceHours)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-neutral-500 font-mono px-1">
            <span>0:00</span>
            <span>Total: {formatSecondsToTimestamp(totalDuration, forceHours)}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-xs text-slate-600 dark:text-neutral-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-500 shrink-0" />
          <span>
            Total duration was not reported by this source platform. Enter precision timestamps manually below.
          </span>
        </div>
      )}

      {/* Precision Input Boxes & Quick Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Start Time Box */}
        <div className="bg-white dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 space-y-1 focus-within:border-violet-500/60 transition-all">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Start Timestamp
            </label>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">MM:SS or HH:MM:SS</span>
          </div>
          <div className="relative flex items-center">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={startInput}
              onChange={(e) => onStartInputChange(e.target.value)}
              placeholder="00:00:00"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/60 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>
        </div>

        {/* End Time Box */}
        <div className="bg-white dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 space-y-1 focus-within:border-cyan-500/60 transition-all">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              End Timestamp
            </label>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono">MM:SS or HH:MM:SS</span>
          </div>
          <div className="relative flex items-center">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={endInput}
              onChange={(e) => onEndInputChange(e.target.value)}
              placeholder="00:01:30"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/60 rounded-lg text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Quick Trim Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span>Quick Cuts:</span>
          {totalDuration >= 30 && (
            <button
              type="button"
              onClick={() => applyPreset(30)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors text-[11px]"
            >
              First 30s
            </button>
          )}
          {totalDuration >= 60 && (
            <button
              type="button"
              onClick={() => applyPreset(60)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors text-[11px]"
            >
              First 60s
            </button>
          )}
          {hasKnownDuration && (
            <button
              type="button"
              onClick={resetToFull}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              Full
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
          Min Clip: 1s
        </div>
      </div>

      {/* Inline Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl p-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
