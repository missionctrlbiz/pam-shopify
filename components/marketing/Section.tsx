"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ScrollReveal } from "./ScrollReveal";
import { EyebrowBadge } from "./EyebrowBadge";
import { MotionGrid } from "./MotionGrid";

interface SectionProps {
  id?: string;
  /** Optional uppercase eyebrow rendered above the headline. */
  eyebrow?: string;
  /** Optional icon shown next to the eyebrow. */
  eyebrowIcon?: ReactNode;
  /** Main H2 heading. */
  headline?: ReactNode;
  /** Subheadline paragraph below the H2. */
  subheadline?: ReactNode;
  /** Optional right-aligned action in the header row. */
  headerAction?: ReactNode;
  /** Section body. */
  children: ReactNode;
  /** Background style. */
  background?: "white" | "slate" | "navy" | "navy-grid" | "slate-grid";
  /** Vertical padding scale. */
  spacing?: "sm" | "md" | "lg";
  /** Tailwind classes appended to the section element. */
  className?: string;
  /** Override the wrapper container className. */
  containerClassName?: string;
  /** Center the headline / subheadline stack. */
  centered?: boolean;
  /** Eyebrow variant. */
  eyebrowVariant?: "default" | "light" | "gradient";
}

/**
 * Standardised section wrapper. Enforces consistent vertical rhythm,
 * eyebrow + headline + subheadline pattern, and scroll-reveal animation.
 */
export function Section({
  id,
  eyebrow,
  eyebrowIcon,
  headline,
  subheadline,
  headerAction,
  children,
  background = "white",
  spacing = "lg",
  className,
  containerClassName,
  centered = false,
  eyebrowVariant,
}: SectionProps) {
  const bgClass = {
    white: "bg-white",
    slate: "bg-slate-50",
    navy: "bg-psych-navy text-white",
    "navy-grid": "bg-psych-navy text-white relative overflow-hidden",
    "slate-grid": "bg-slate-50 relative overflow-hidden",
  }[background];

  const padding = {
    sm: "py-16",
    md: "py-20",
    lg: "py-24",
  }[spacing];

  const isDark = background === "navy" || background === "navy-grid";

  return (
    <section id={id} className={cn(padding, bgClass, className)}>
      {/* Animated motion-grid backdrop for the *-grid backgrounds */}
      {background === "navy-grid" && <MotionGrid variant="light" />}
      {background === "slate-grid" && <MotionGrid variant="dark" />}
      <div
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10",
          containerClassName
        )}
      >
        {(eyebrow || headline || subheadline) && (
          <ScrollReveal
            direction="up"
            duration={0.7}
            className={cn(
              "mb-12 lg:mb-16 max-w-3xl",
              centered && "mx-auto text-center"
            )}
          >
            {eyebrow && (
              <EyebrowBadge
                icon={eyebrowIcon}
                variant={eyebrowVariant ?? (isDark ? "light" : "default")}
                className="mb-4"
              >
                {eyebrow}
              </EyebrowBadge>
            )}
            {headline && (
              <h2
                className={cn(
                  "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4",
                  isDark ? "text-white" : "text-psych-navy"
                )}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                className={cn(
                  "text-lg leading-relaxed",
                  isDark ? "text-blue-200" : "text-slate-600"
                )}
              >
                {subheadline}
              </p>
            )}
            {headerAction && <div className="mt-6">{headerAction}</div>}
          </ScrollReveal>
        )}
        {children}
      </div>
    </section>
  );
}
