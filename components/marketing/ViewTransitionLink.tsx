"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addTransitionType,
  forwardRef,
  startTransition,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

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
 *   <ViewTransitionLink href="/soap-architect" transitionTypes="nav-forward">
 *     Assessments
 *   </ViewTransitionLink>
 *
 * Implementation note: `next/link` does not expose `transitionTypes` in
 * Next.js 16.1.6 — passing it through leaks the prop onto the DOM <a>
 * and triggers a React warning. We therefore handle navigation
 * ourselves via `useRouter` + `startTransition` + `addTransitionType`,
 * while still rendering through `next/link` for prefetch + ref forwarding.
 */
export const ViewTransitionLink = forwardRef<
  HTMLAnchorElement,
  ViewTransitionLinkProps
>(function ViewTransitionLink(
  { href, transitionTypes, className, children, variant = "default", onClick, ...rest },
  ref
) {
  const router = useRouter();

  const types = transitionTypes
    ? Array.isArray(transitionTypes)
      ? transitionTypes
      : [transitionTypes]
    : undefined;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Honor modifier keys, non-primary buttons, new-tab/window targets,
    // and downloads so the browser handles them natively.
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.currentTarget.target;
    if (target && target !== "_self") return;
    if (event.currentTarget.hasAttribute("download")) return;

    event.preventDefault();
    startTransition(() => {
      if (types) {
        for (const t of types) addTransitionType(t);
      }
      router.push(href);
    });
  };

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors",
        variant === "default" &&
          "text-psych-navy font-bold hover:text-psych-purple",
        variant === "ghost" && "hover:opacity-80",
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  );
});
