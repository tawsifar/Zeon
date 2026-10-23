"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockItemData {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Whether item is currently active */
  isActive?: boolean;
  /** Optional badge count or text */
  badge?: number | string;
  /** Custom item class */
  className?: string;
}

export interface MagneticDockProps {
  /** Array of dock items */
  items: DockItemData[];
  /** Size of icon containers in pixels */
  iconSize?: number;
  /** Maximum scale on hover */
  maxScale?: number;
  /** Distance of magnetic effect in pixels */
  magneticDistance?: number;
  /** Show tooltip labels on hover */
  showLabels?: boolean;
  /** Dock orientation */
  position?: "bottom" | "top" | "left" | "right";
  /** Background style */
  variant?: "glass" | "solid" | "transparent";
  /** Custom class name */
  className?: string;
  /** Children to append inside dock (e.g. brand or action controls) */
  children?: React.ReactNode;
}

interface DockItemProps {
  item: DockItemData;
  mouseX: MotionValue<number>;
  iconSize: number;
  maxScale: number;
  magneticDistance: number;
  showLabels: boolean;
  isVertical: boolean;
  position: "bottom" | "top" | "left" | "right";
  reducedMotion: boolean;
}

export function DockItem({
  item,
  mouseX,
  iconSize,
  maxScale,
  magneticDistance,
  showLabels,
  isVertical,
  position,
  reducedMotion,
}: DockItemProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const showLabel = showLabels && (isHovered || isFocused);

  // Calculate distance from mouse to center of item
  const distance = useTransform(mouseX, (val: number) => {
    if (!ref.current) return magneticDistance + 1;
    const rect = ref.current.getBoundingClientRect();
    const center = isVertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    return val - center;
  });

  // Scale based on distance - closer = larger
  const scale = useTransform(
    distance,
    [-magneticDistance, 0, magneticDistance],
    [1, maxScale, 1]
  );

  // Apply spring physics for smooth animation
  const springConfig = { damping: 18, stiffness: 320, mass: 0.45 };
  const smoothScale = useSpring(scale, springConfig);

  // Calculate the size based on scale
  const size = useTransform(smoothScale, (s) => s * iconSize);

  // Subtle floating offset (moves down if top-dock, moves up if bottom-dock)
  const floatDirection = position === "top" ? 1 : -1;
  const offset = useTransform(smoothScale, (s) => (s - 1) * 8 * floatDirection);
  const smoothOffset = useSpring(offset, springConfig);

  return (
    <motion.button
      ref={ref}
      type="button"
      tabIndex={0}
      aria-label={item.label}
      aria-current={item.isActive ? "page" : undefined}
      onClick={item.onClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center justify-center shrink-0 cursor-pointer",
        "rounded-2xl transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:focus-visible:ring-white/50",
        item.className
      )}
      style={{
        width: reducedMotion ? iconSize : size,
        height: reducedMotion ? iconSize : size,
        y: reducedMotion || isVertical ? 0 : smoothOffset,
        x: reducedMotion || !isVertical ? 0 : smoothOffset,
      }}
      whileTap={reducedMotion ? undefined : { scale: 0.92 }}
    >
      {/* Icon Container: Refined tactile surface without AI rainbow slop */}
      <motion.div
        className={cn(
          "relative w-full h-full rounded-2xl overflow-hidden",
          "backdrop-blur-md transition-all duration-200",
          "flex items-center justify-center",
          item.isActive
            ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)] border border-slate-800/40 dark:border-zinc-700/80"
            : cn(
                "bg-white/80 dark:bg-white/[0.06]",
                "border border-slate-200/70 dark:border-white/10",
                "text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white",
                "shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none",
                "hover:bg-white dark:hover:bg-white/[0.12]"
              )
        )}
        style={{
          boxShadow: isHovered && !item.isActive
            ? "0 4px 16px rgba(0,0,0,0.08)"
            : undefined,
        }}
      >
        {/* Icon Render */}
        <div aria-hidden="true" className="w-[52%] h-[52%] flex items-center justify-center">
          {item.icon}
        </div>
      </motion.div>

      {/* Badge Indicator */}
      <AnimatePresence initial={false}>
        {item.badge !== undefined && (
          <motion.div
            initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            className={cn(
              "absolute -top-1 -right-1 z-30",
              "min-w-[18px] h-4 px-1",
              "rounded-full",
              "bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-bold",
              "flex items-center justify-center",
              "border border-white dark:border-neutral-950",
              "shadow-sm"
            )}
          >
            {item.badge}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active State Indicator Dot */}
      <AnimatePresence initial={false}>
        {item.isActive && (
          <motion.div
            initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            className={cn(
              "absolute z-20",
              position === "top" ? "-top-1.5" : "-bottom-1.5",
              "w-1.5 h-1.5 rounded-full",
              "bg-[#6366F1] shadow-[0_0_8px_#6366F1]"
            )}
          />
        )}
      </AnimatePresence>

      {/* Tooltip Label */}
      <AnimatePresence initial={false}>
        {showLabel && (
          <motion.div
            aria-hidden="true"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    y: position === "top" ? -6 : 6,
                    scale: 0.9,
                  }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: position === "top" ? -6 : 6,
                    scale: 0.9,
                  }
            }
            transition={{ duration: 0.14, ease: "easeOut" }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none",
              position === "top" ? "top-full mt-2.5" : "bottom-full mb-2.5",
              "px-2.5 py-1 rounded-lg",
              "bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md",
              "text-slate-800 dark:text-slate-100 text-[11px] font-semibold whitespace-nowrap",
              "border border-white/80 dark:border-white/10",
              "shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
            )}
          >
            {item.label}
            {/* Arrow */}
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45",
                position === "top"
                  ? "-top-1 border-l border-t bg-white/95 dark:bg-neutral-950/95 border-white/80 dark:border-white/10"
                  : "-bottom-1 border-r border-b bg-white/95 dark:bg-neutral-950/95 border-white/80 dark:border-white/10"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function MagneticDock({
  items,
  iconSize = 42,
  maxScale = 1.35,
  magneticDistance = 120,
  showLabels = true,
  position = "top",
  variant = "glass",
  className,
  children,
}: MagneticDockProps) {
  const mousePosition = useMotionValue(Infinity);
  const reducedMotion = useReducedMotion() ?? false;
  const isVertical = position === "left" || position === "right";

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (isVertical) {
        mousePosition.set(e.clientY);
      } else {
        mousePosition.set(e.clientX);
      }
    },
    [mousePosition, isVertical]
  );

  const handleMouseLeave = () => {
    mousePosition.set(Infinity);
  };

  const variantStyles = {
    glass: cn(
      "bg-white/70 dark:bg-[#0c0f24]/75",
      "backdrop-blur-2xl backdrop-saturate-150",
      "border border-white/85 dark:border-white/10",
      "shadow-[0_12px_40px_rgba(124,92,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)]"
    ),
    solid: cn(
      "bg-neutral-100 dark:bg-neutral-900",
      "border border-neutral-300 dark:border-neutral-700",
      "shadow-lg"
    ),
    transparent: "bg-transparent border-0",
  };

  const positionStyles = {
    bottom: "flex-row items-end",
    top: "flex-row items-center",
    left: "flex-col items-start",
    right: "flex-col items-end",
  };

  return (
    <motion.nav
      role="navigation"
      aria-label="Floating Magnetic Dock"
      onMouseMove={reducedMotion ? undefined : handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "inline-flex gap-2.5 p-2 rounded-full",
        variantStyles[variant],
        positionStyles[position],
        className
      )}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {items.map((item) => (
        <DockItem
          key={item.id}
          item={item}
          mouseX={mousePosition}
          iconSize={iconSize}
          maxScale={maxScale}
          magneticDistance={magneticDistance}
          showLabels={showLabels}
          isVertical={isVertical}
          position={position}
          reducedMotion={reducedMotion}
        />
      ))}
      {children}
    </motion.nav>
  );
}
