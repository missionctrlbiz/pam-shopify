"use client";

import { motion } from "framer-motion";
import { type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  /** Frosted dark surface (default) vs frosted light surface. */
  tone?: "dark" | "light";
  /** Lift on hover. */
  hoverLift?: boolean;
  /** Add subtle gradient border ring. */
  featured?: boolean;
  className?: string;
  /** Inline styles for the wrapper. */
  style?: React.CSSProperties;
  /** Optional onClick — when set, the card becomes a button. */
  onClick?: () => void;
  /** HTML role override (defaults to "button" when onClick is set). */
  role?: string;
  /** Accessible label when the card is interactive. */
  ariaLabel?: string;
}

/**
 * Frosted-glass card primitive. Used by the Footer, SOAP teaser,
 * LeadMagnet, pricing cards, and assessment/guide/resource tiles.
 *
 * Combines a translucent background with backdrop-blur, subtle border,
 * and a radial highlight in the top-left corner for that "premium glass"
 * look. The `featured` flag adds a gradient border ring.
 */
export function GlassCard({
  children,
  tone = "dark",
  hoverLift = false,
  featured = false,
  className,
  style,
  onClick,
  role,
  ariaLabel,
}: GlassCardProps) {
  const baseClass = cn(
    "relative overflow-hidden rounded-2xl transition-all duration-300",
    tone === "dark"
      ? "glass-dark text-white"
      : "glass-light text-psych-navy",
    featured &&
      "border-2 border-psych-purple shadow-2xl shadow-psych-purple/20",
    hoverLift && "hover:-translate-y-1 hover:shadow-2xl",
    className
  );

  const inner = (
    <>
      {/* Radial highlight */}
      <span
        className={cn(
          "absolute -top-px -left-px size-40 rounded-full blur-3xl opacity-30 pointer-events-none",
          tone === "dark" ? "bg-psych-purple" : "bg-psych-blue-light"
        )}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </>
  );

  if (onClick) {
    return (
      <motion.div
        whileHover={{ y: hoverLift ? -4 : 0 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        role={role ?? "button"}
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={baseClass}
        style={style}
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <div className={baseClass} style={style}>
      {inner}
    </div>
  );
}
