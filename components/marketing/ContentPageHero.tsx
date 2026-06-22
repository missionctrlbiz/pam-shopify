"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { EyebrowBadge } from "./EyebrowBadge";
import { GradientText } from "./GradientText";
import { ScrollReveal } from "./ScrollReveal";

interface ContentPageHeroProps {
  eyebrow: string;
  /** Main headline (left part, dark). */
  headline: string;
  /** Accent part of the headline rendered with gradient. */
  headlineAccent?: string;
  /** Optional gradient variant for the accent. */
  accentVariant?: "psych" | "brain";
  subheadline: string;
  /** Optional element rendered below the subheadline (e.g. CTA buttons). */
  children?: ReactNode;
}

/**
 * Standardised hero for the new content pages (assessments / guides /
 * resources). Provides the same headline + gradient accent + scroll-reveal
 * rhythm as the home hero.
 */
export function ContentPageHero({
  eyebrow,
  headline,
  headlineAccent,
  accentVariant = "psych",
  subheadline,
  children,
}: ContentPageHeroProps) {
  return (
    <section className="relative pt-16 pb-20 bg-white overflow-hidden">
      {/* Ambient blobs */}
      <div
        className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-psych-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-[36rem] h-[36rem] bg-psych-blue/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <ScrollReveal direction="up" duration={0.6}>
          <EyebrowBadge variant="default" className="mb-6 mx-auto">
            {eyebrow}
          </EyebrowBadge>
        </ScrollReveal>

        <ScrollReveal direction="up" duration={0.7} delay={0.05}>
          <h1
            className={cn(
              "text-5xl lg:text-7xl font-extrabold leading-[1.05] mb-6 tracking-tight text-psych-navy"
            )}
          >
            {headline}
            {headlineAccent && (
              <>
                <br />
                <GradientText variant={accentVariant}>
                  {headlineAccent}
                </GradientText>
              </>
            )}
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="up" duration={0.7} delay={0.15}>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            {subheadline}
          </p>
        </ScrollReveal>

        {children && (
          <ScrollReveal direction="up" duration={0.7} delay={0.25}>
            {children}
          </ScrollReveal>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 to-transparent" />
    </section>
  );
}
