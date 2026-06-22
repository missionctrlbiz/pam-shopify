import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EyebrowBadgeProps {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "light" | "gradient" | "soft";
  className?: string;
}

/**
 * Standardised uppercase eyebrow / kicker tag.
 * Replaces 8+ ad-hoc inline implementations across the site.
 */
export function EyebrowBadge({
  children,
  icon,
  variant = "default",
  className,
}: EyebrowBadgeProps) {
  const variants = {
    default:
      "bg-psych-navy/10 text-psych-navy border-psych-navy/20",
    light:
      "bg-white/10 text-blue-100 border-white/20",
    gradient:
      "bg-gradient-psych text-white border-transparent shadow-sm",
    soft:
      "bg-psych-purple/5 text-psych-purple border-psych-purple/20",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border",
        variants[variant],
        className
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </span>
  );
}
