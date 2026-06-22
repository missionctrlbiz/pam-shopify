"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg" | "xl";

interface BaseProps {
  children: ReactNode;
  className?: string;
  /** Render as `<a>` instead of `<Link>`. Use for external targets. */
  as?: "link" | "button" | "anchor";
  href?: string;
  /** Optional click handler (for buttons / anchors). */
  onClick?: () => void;
  /** Disable pointer events / dim. */
  disabled?: boolean;
  /** Right-side icon. */
  iconRight?: ReactNode;
  /** Left-side icon. */
  iconLeft?: ReactNode;
  /** Loading state — shows spinner and disables. */
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  /** Accessible label override. */
  ariaLabel?: string;
}

interface CTAButtonProps extends BaseProps {
  variant?: Variant;
  size?: Size;
  /** Border-radius style override. Defaults to size-driven rounding. */
  shape?: "pill" | "rounded" | "square";
}

/**
 * Halo CTA button — the signature button pattern of the brand.
 *
 * Renders a framer-motion wrapped button with a sibling gradient blur
 * that animates in on hover. Used for every primary call-to-action.
 */
export function CTAButton({
  children,
  className,
  variant = "primary",
  size = "md",
  shape,
  as = "link",
  href,
  onClick,
  disabled,
  iconRight,
  iconLeft,
  loading,
  type = "button",
  ariaLabel,
}: CTAButtonProps) {
  const sizeClass = {
    sm: "h-9 px-4 text-xs",
    md: "h-12 px-7 text-sm",
    lg: "h-14 px-8 text-base",
    xl: "h-16 px-10 text-lg",
  }[size];

  const shapeClass =
    shape === "pill"
      ? "rounded-full"
      : shape === "square"
        ? "rounded-none"
        : {
            sm: "rounded-lg",
            md: "rounded-xl",
            lg: "rounded-xl",
            xl: "rounded-2xl",
          }[size];

  const variantClass = {
    primary:
      "bg-gradient-psych text-white shadow-lg shadow-psych-purple/20",
    secondary:
      "bg-white text-psych-navy hover:bg-slate-50 border-2 border-slate-200",
    outline:
      "bg-psych-navy text-white hover:bg-[#052e7a]",
    ghost:
      "bg-transparent text-psych-navy hover:bg-psych-navy/5",
  }[variant];

  const content = (
    <>
      {variant === "primary" && (
        <span
          className="absolute -inset-1 bg-gradient-psych rounded-[inherit] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 -z-10"
          aria-hidden="true"
        />
      )}
      <span className="relative flex items-center justify-center gap-2 w-full">
        {loading ? (
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : (
          iconLeft
        )}
        {children}
        {iconRight}
      </span>
    </>
  );

  const motionProps = {
    whileHover: disabled || loading ? undefined : { scale: 1.05 },
    whileTap: disabled || loading ? undefined : { scale: 0.95 },
  } as const;

  const baseClass = cn(
    "relative group font-bold transition-all duration-200 inline-flex items-center justify-center whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-psych-blue/40 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none",
    sizeClass,
    shapeClass,
    variantClass,
    className
  );

  if (as === "link" && href) {
    return (
      <motion.div
        {...motionProps}
        className="relative inline-block"
      >
        <Link
          href={href}
          className={baseClass}
          aria-label={ariaLabel}
          aria-disabled={disabled}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  if (as === "anchor" && href) {
    return (
      <motion.div {...motionProps} className="relative inline-block">
        <a
          href={href}
          className={baseClass}
          aria-label={ariaLabel}
          aria-disabled={disabled}
        >
          {content}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.button
      {...motionProps}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClass}
      aria-label={ariaLabel}
    >
      {content}
    </motion.button>
  );
}
