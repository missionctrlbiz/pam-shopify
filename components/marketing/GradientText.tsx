import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: ReactNode;
  variant?: "psych" | "brain";
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
}

/**
 * Helper for the signature gradient text fills.
 * Uses bg-clip-text with our brand gradients.
 *
 * Default `psych` = red → pink → purple (used for featured headlines).
 * `brain` = purple → blue (used for hero accents).
 */
export function GradientText({
  children,
  variant = "psych",
  as: Tag = "span",
  className,
}: GradientTextProps) {
  return (
    <Tag
      className={cn(
        "text-transparent bg-clip-text drop-shadow-sm",
        variant === "psych" ? "bg-gradient-psych" : "bg-gradient-brain",
        className
      )}
    >
      {children}
    </Tag>
  );
}
