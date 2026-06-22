import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatPillProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Surface variant.
   * - `dark` (default) = translucent white pill for navy/dark backgrounds
   * - `light` = subtle navy pill for white/light backgrounds
   */
  variant?: "dark" | "light";
}

/**
 * Compact credibility pill ("12th-grade reading", "ESL-friendly").
 * Used in the hero and pricing sections. Choose the variant that
 * matches the surface so contrast stays AA-compliant.
 */
export function StatPill({
  icon,
  children,
  className,
  variant = "dark",
}: StatPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm border",
        variant === "dark"
          ? "bg-white/10 border-white/20 text-white"
          : "bg-psych-navy/5 border-psych-navy/15 text-psych-navy",
        className
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </span>
  );
}
