"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { ViewTransitionLink } from "./ViewTransitionLink";
import { CTAButton } from "./CTAButton";

interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

interface HeaderProps {
  navigation: NavItem[];
  brandName: string;
  /** Optional handler invoked when "Preview Sample" is clicked. */
  onPreviewSample?: () => void;
  /** Optional className appended to the outer <header> element. */
  className?: string;
}

/**
 * Frosted-glass sticky navigation. Extracted from the original inline
 * header in app/page.tsx and generalised for all marketing surfaces.
 *
 * Behaviour:
 * - Fixed top, full-width, z-50
 * - `bg-white/90 backdrop-blur-md` with a subtle bottom border
 * - Logo on the left, desktop nav links centred-right
 * - Halo gradient "Start Practicing" CTA on the right
 * - Mobile: hamburger toggle + slide-down panel
 * - Subtle scroll-shrink when scrolled past hero threshold
 */
export function Header({
  navigation,
  brandName,
  onPreviewSample,
  className,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ viewTransitionName: "persistent-nav" }}
      className={cn(
        "fixed w-full z-50 top-0 left-0 right-0",
        "bg-white/85 backdrop-blur-xl border-b border-slate-200/70",
        "transition-all duration-300",
        isScrolled ? "shadow-md" : "shadow-sm",
        className
      )}
    >
      <ViewTransitionLink
        href="/"
        className="absolute inset-0 opacity-0 pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
      >
        {brandName}
      </ViewTransitionLink>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={cn(
            "flex justify-between items-center transition-all duration-300",
            isScrolled ? "h-16" : "h-20"
          )}
        >
          {/* Brand */}
          <ViewTransitionLink
            href="/"
            className="flex items-center gap-3 relative"
            aria-label={`${brandName} home`}
          >
            <Image
              src="/logo.webp"
              alt={`${brandName} logo`}
              width={240}
              height={70}
              style={{ viewTransitionName: "brand-logo" }}
              className={cn(
                "object-contain w-auto transition-all duration-300",
                isScrolled ? "h-10" : "h-12"
              )}
              priority
            />
          </ViewTransitionLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {navigation.map((item) => {
              const transitionType = inferTransitionType(item.href);
              return (
                <ViewTransitionLink
                  key={item.label}
                  href={item.href}
                  transitionTypes={transitionType}
                  className="text-psych-navy font-bold hover:text-psych-purple transition flex items-center gap-1.5 text-sm"
                >
                  {item.label}
                  {item.badge && (
                    <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </ViewTransitionLink>
              );
            })}
            {onPreviewSample && (
              <button
                onClick={onPreviewSample}
                className="text-psych-navy font-bold hover:text-psych-purple transition flex items-center gap-1.5 text-sm"
                type="button"
              >
                <BookOpen className="w-4 h-4" /> Preview Sample
              </button>
            )}
          </nav>

          {/* Right-side CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <CTAButton
                as="anchor"
                href="#pricing"
                variant="primary"
                size="sm"
                shape="pill"
              >
                Start Practicing
              </CTAButton>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden text-psych-navy p-2 hover:bg-slate-100 rounded-lg transition"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const transitionType = inferTransitionType(item.href);
                return (
                  <ViewTransitionLink
                    key={item.label}
                    href={item.href}
                    transitionTypes={transitionType}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-psych-navy font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition text-base"
                  >
                    {item.label}
                    {item.badge && (
                      <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </ViewTransitionLink>
                );
              })}
              {onPreviewSample && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onPreviewSample();
                  }}
                  className="flex items-center gap-2 text-psych-navy font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition w-full text-left"
                >
                  <BookOpen className="w-4 h-4" /> Preview Sample
                </button>
              )}
              <div className="pt-2">
                <CTAButton
                  as="anchor"
                  href="#pricing"
                  variant="primary"
                  size="md"
                  shape="rounded"
                  className="w-full"
                >
                  Start Practicing
                </CTAButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/**
 * Heuristic — given a nav href, return the appropriate transition type.
 * - In-app routes (/soap-architect) → nav-forward
 * - Hash links on same page (#pricing, #about) → no transition
 * - Same page (/) → no transition
 */
function inferTransitionType(href: string) {
  if (href.startsWith("#")) return undefined;
  if (href === "/") return undefined;
  return "nav-forward" as const;
}
