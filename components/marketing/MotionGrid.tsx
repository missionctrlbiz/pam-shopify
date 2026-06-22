"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotionGridProps {
  /** Light grid (dark sections) or dark grid (light sections). */
  variant?: "light" | "dark";
  /** Optional absolute-positioning className. */
  className?: string;
  /** Add subtle mask fade at top + bottom edges. */
  fade?: boolean;
}

/**
 * Animated dot-lattice backdrop.
 *
 * Used by the Footer (motion-grid background per the brief), the SOAP
 * Architect teaser, and other dark navy sections. Renders a static
 * radial-gradient dot grid plus a few floating highlight dots whose
 * opacity pulses via framer-motion's `animate` loop.
 *
 * Light variant = white dots on dark surface.
 * Dark variant = dim white dots on light surface.
 */
export function MotionGrid({
  variant = "light",
  className,
  fade = false,
}: MotionGridProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden",
        variant === "light" ? "motion-grid" : "motion-grid-dark",
        fade &&
          "[mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]",
        className
      )}
      aria-hidden="true"
    >
      {/* Floating highlight dots */}
      <div className="absolute inset-0">
        {[
          { x: "10%", y: "20%", delay: 0, size: 6 },
          { x: "30%", y: "70%", delay: 0.6, size: 4 },
          { x: "55%", y: "30%", delay: 1.2, size: 8 },
          { x: "78%", y: "60%", delay: 0.3, size: 5 },
          { x: "88%", y: "20%", delay: 1.5, size: 6 },
          { x: "20%", y: "85%", delay: 0.9, size: 7 },
          { x: "65%", y: "85%", delay: 1.8, size: 4 },
          { x: "42%", y: "12%", delay: 0.4, size: 5 },
        ].map((dot, i) => (
          <motion.span
            key={i}
            className={cn(
              "absolute rounded-full",
              variant === "light" ? "bg-psych-purple" : "bg-psych-navy"
            )}
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.size,
              height: dot.size,
            }}
            initial={{ opacity: 0.2, scale: 1 }}
            animate={{
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 4 + (i % 3),
              delay: dot.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
