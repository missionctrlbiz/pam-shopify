"use client";

import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TransitionType = "nav-forward" | "nav-back" | "nav-lateral";

interface ViewTransitionLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  /** Visual style variants — keep this thin; full styling via className. */
  variant?: "default" | "ghost";
  /** Pass one or more transition types to drive the view-transition animation. */
  transitionTypes?: TransitionType | TransitionType[];
  children: ReactNode;
  className?: string;
}

/**
 * Drop-in replacement for next/link that emits a React View Transition
 * type on click so the destination page can pick a directional slide.
 *
 * Usage:
 *   <ViewTransitionLink href="/assessments" transitionTypes="nav-forward">
 *     Assessments
 *   </ViewTransitionLink>
 *
 * Falls back to a plain <a> + next/link on unsupported browsers (the
 * experimental flag in next.config.ts enables wrapping of every <Link>;
 * transitionTypes is a no-op if not supported).
 */
export const ViewTransitionLink = forwardRef<
  HTMLAnchorElement,
  ViewTransitionLinkProps
>(function ViewTransitionLink(
  { href, transitionTypes, className, children, variant = "default", ...rest },
  ref
) {
  const types = Array.isArray(transitionTypes)
    ? transitionTypes
    : transitionTypes
      ? [transitionTypes]
      : undefined;

  // next/link accepts transitionTypes prop when the experimental flag is on.
  // Cast to any to avoid pulling Next.js's internal type — keeps us
  // forward-compatible across canary / stable releases.
  const linkProps = {
    ref,
    href,
    className: cn(
      "inline-flex items-center gap-1 transition-colors",
      variant === "default" &&
        "text-psych-navy font-bold hover:text-psych-purple",
      variant === "ghost" && "hover:opacity-80",
      className
    ),
    ...rest,
  } as React.ComponentProps<typeof Link> & {
    transitionTypes?: TransitionType[];
  };

  if (types && types.length > 0) {
    (linkProps as { transitionTypes?: TransitionType[] }).transitionTypes =
      types;
  }

  return <Link {...linkProps}>{children}</Link>;
});
