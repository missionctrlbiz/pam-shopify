"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Slide-in direction. Defaults to "up". */
  direction?: Direction;
  /** Delay before the animation begins (seconds). */
  delay?: number;
  /** Duration in seconds. */
  duration?: number;
  /** Translate distance in pixels. */
  distance?: number;
  /** Stagger children using an inline stagger? */
  staggerChildren?: number;
  /** Element tag. */
  as?: "div" | "section" | "article" | "header" | "footer" | "li" | "ul" | "span";
  /** Replay animation every time the element enters the viewport. */
  repeat?: boolean;
}

/**
 * Reveal-on-scroll wrapper using framer-motion's `whileInView`.
 *
 * Applied to every section / block on the marketing surfaces per the
 * brief. Respects prefers-reduced-motion via global CSS override.
 */
export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 24,
  staggerChildren,
  as = "div",
  repeat = false,
}: ScrollRevealProps) {
  const dirOffset: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: dirOffset[direction].x,
      y: dirOffset[direction].y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
        ...(staggerChildren !== undefined && {
          staggerChildren,
          delayChildren: delay,
        }),
      },
    },
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: !repeat, margin: "-80px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Child variant used to stagger items inside a ScrollReveal parent.
 * Pair with `staggerChildren` on the parent.
 */
export const scrollRevealChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};
