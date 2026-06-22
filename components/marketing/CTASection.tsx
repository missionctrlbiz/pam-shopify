"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EyebrowBadge } from "./EyebrowBadge";
import { CTAButton } from "./CTAButton";
import { MotionGrid } from "./MotionGrid";
import { ScrollReveal } from "./ScrollReveal";

interface CTASectionProps {
  eyebrow: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  disclaimer?: string;
}

/**
 * Dark navy CTA banner with motion-grid background — used at the
 * bottom of each content page (assessments / guides / resources).
 */
export function CTASection({
  eyebrow,
  headline,
  description,
  ctaLabel,
  ctaHref,
  disclaimer,
}: CTASectionProps) {
  return (
    <section className="py-24 bg-psych-navy relative overflow-hidden">
      <MotionGrid variant="light" />
      <div
        className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-psych-purple/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-[420px] h-[420px] bg-psych-blue/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <ScrollReveal direction="up" duration={0.7}>
          <EyebrowBadge variant="light" className="mb-5 mx-auto">
            {eyebrow}
          </EyebrowBadge>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            {headline}
          </h2>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            {description}
          </p>
          <CTAButton
            as="link"
            href={ctaHref}
            variant="primary"
            size="xl"
            shape="rounded"
            iconRight={<ArrowRight className="w-5 h-5" />}
          >
            {ctaLabel}
          </CTAButton>
          {disclaimer && (
            <p className="mt-4 text-blue-300 text-sm italic">{disclaimer}</p>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}
