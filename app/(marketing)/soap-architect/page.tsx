"use client";

import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { SoapArchitect } from "@/components/ClinicalTools";

import siteContent from "@/content/site-content.json";
import { EyebrowBadge } from "@/components/marketing/EyebrowBadge";
import { CTAButton } from "@/components/marketing/CTAButton";
import { GlassCard } from "@/components/marketing/GlassCard";
import { GradientText } from "@/components/marketing/GradientText";
import { MotionGrid } from "@/components/marketing/MotionGrid";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { Section } from "@/components/marketing/Section";
import { Badge } from "@/components/ui/badge";

const content = siteContent.soapArchitectPage;

export default function SoapArchitectPage() {
  return (
    <>
      {/* A. HERO */}
      <section className="pt-16 pb-24 bg-white relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-psych-navy/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-60 pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <ScrollReveal direction="up" duration={0.6}>
            <EyebrowBadge
              variant="default"
              className="mb-6 mx-auto"
              icon={
                <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  New
                </span>
              }
            >
              {content.hero.badge}
            </EyebrowBadge>
          </ScrollReveal>

          <ScrollReveal direction="up" duration={0.7} delay={0.05}>
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-5 tracking-tight leading-tight">
              <GradientText variant="psych">
                {content.hero.headline}
              </GradientText>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" duration={0.7} delay={0.15}>
            <p className="text-2xl text-psych-navy font-semibold mb-6">
              {content.hero.subheadline}
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" duration={0.7} delay={0.25}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              {content.hero.valueProp}
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" duration={0.7} delay={0.35}>
            <div className="flex flex-col items-center gap-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold border border-slate-200">
                {content.hero.authTrigger}
              </div>
              <CTAButton
                as="anchor"
                href="#soap-tool"
                variant="primary"
                size="xl"
                shape="rounded"
              >
                {content.hero.ctaLabel}
              </CTAButton>
              <p className="text-sm text-slate-400 italic">
                {content.hero.disclaimer}
              </p>
            </div>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* B. THE REAL PROBLEM */}
      <Section background="slate" spacing="md">
        <ScrollReveal direction="up" duration={0.6}>
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              {content.problemBlock.headline}
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-8">
              {content.problemBlock.items.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-600 italic border-l-4 border-red-400 pl-4 text-base">
              {content.problemBlock.blockquote}
            </p>
          </div>
        </ScrollReveal>
      </Section>

      {/* C & D. WHAT IT DOES + HOW IT WORKS */}
      <Section background="white" spacing="md">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <ScrollReveal direction="left" duration={0.6}>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                {content.whatItDoes.headline}
              </h2>
              <ul className="space-y-4 mb-8">
                {content.whatItDoes.features.map(
                  (item: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-700"
                    >
                      <CheckCircle2 className="w-5 h-5 text-psych-navy shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-blue-800 text-sm leading-relaxed">
                <strong>Important:</strong> {content.whatItDoes.importantNote}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" duration={0.6}>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                {content.howItWorks.headline}
              </h2>
              <div className="space-y-6">
                {content.howItWorks.steps.map(
                  (s: { step: string; label: string; desc: string }) => (
                    <div key={s.step} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-psych-navy text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.label}</p>
                        <p className="text-slate-500 text-sm mt-0.5">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Section>

      {/* E. BEFORE & AFTER DEMO */}
      <Section background="slate" spacing="md">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          {content.beforeAfterDemo.headline}
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <ScrollReveal direction="left" duration={0.6}>
            <GlassCard tone="light" className="p-8 h-full">
              <Badge variant="default" className="mb-5">
                {content.beforeAfterDemo.input.label}
              </Badge>
              <p className="text-slate-700 font-mono text-sm leading-relaxed italic">
                {content.beforeAfterDemo.input.text}
              </p>
            </GlassCard>
          </ScrollReveal>
          <ScrollReveal direction="right" duration={0.6} delay={0.15}>
            <GlassCard tone="light" featured className="p-8 h-full">
              <Badge variant="gradient" className="mb-5">
                {content.beforeAfterDemo.output.label}
              </Badge>
              <div className="text-sm text-slate-700 space-y-4 leading-relaxed">
                <div>
                  <p className="font-bold text-psych-navy mb-1">Subjective:</p>
                  <p>{content.beforeAfterDemo.output.subjective}</p>
                </div>
                <div>
                  <p className="font-bold text-psych-navy mb-1">
                    Objective (MSE):
                  </p>
                  <ul className="ml-4 space-y-1">
                    {content.beforeAfterDemo.output.objectiveMSE.map(
                      (mse: { label: string; value: string }) => (
                        <li key={mse.label}>
                          <strong>{mse.label}:</strong> {mse.value}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-psych-navy mb-1">Assessment:</p>
                  <p>{content.beforeAfterDemo.output.assessment}</p>
                </div>
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </Section>

      {/* INTERACTIVE TOOL */}
      <Section id="soap-tool" background="white" spacing="md">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900">
                {content.interactiveTool.headline}
              </h2>
              <p className="text-slate-500 mt-2 text-lg">
                {content.interactiveTool.subheadline}
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.15}>
            <SoapArchitect />
          </ScrollReveal>
          <p className="text-center text-xs text-slate-400 mt-4 italic">
            {content.interactiveTool.disclaimer}
          </p>
        </div>
      </Section>

      {/* CTA BANNER */}
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
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              {content.ctaBanner.headline}
            </h2>
            <p className="text-blue-200 text-lg mb-8 leading-relaxed">
              {content.ctaBanner.description}
            </p>
            <CTAButton
              as="link"
              href="/#pricing"
              variant="secondary"
              size="xl"
              shape="rounded"
              iconRight={<ArrowRight className="w-5 h-5" />}
            >
              {content.ctaBanner.ctaLabel}
            </CTAButton>
            <p className="mt-4 text-blue-300 text-sm">
              {content.ctaBanner.priceNote}
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
