"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  AlertCircle,
  Flag,
  CheckSquare,
  ShoppingCart,
  Download,
  Sparkles,
  Package,
  Send,
} from "lucide-react";

import siteContent from "@/content/site-content.json";
import { createCheckout, getProducts } from "@/lib/shopify";
import { LeadMagnet } from "@/components/LeadMagnet";
import { EyebrowBadge } from "@/components/marketing/EyebrowBadge";
import { CTAButton } from "@/components/marketing/CTAButton";
import { GlassCard } from "@/components/marketing/GlassCard";
import { GradientText } from "@/components/marketing/GradientText";
import { MotionGrid } from "@/components/marketing/MotionGrid";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { Section } from "@/components/marketing/Section";
import { StatPill } from "@/components/marketing/StatPill";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const content = siteContent.homePage;

const PRODUCT_IDS = {
  DIGITAL: "gid://shopify/Product/8137108652111",
  PHYSICAL: "gid://shopify/Product/8094955569231",
  BUNDLE: "gid://shopify/Product/8121252020303",
} as const;

const painPointIcons = {
  red: AlertCircle,
  brand: CheckSquare,
  slate: Flag,
} as const;

const painPointIconStyles = {
  red: "bg-red-100 text-red-600",
  brand: "bg-psych-navy/10 text-psych-navy",
  slate: "bg-slate-200 text-slate-700",
} as const;

const pricingCtaIcons = {
  package: Package,
  cart: ShoppingCart,
  download: Download,
} as const;

interface PricingItem {
  text: string;
  bold: string;
  highlight: boolean;
  highlightLabel?: string;
}

interface PricingCard {
  key: string;
  title: string;
  subtitle: string;
  price: string;
  regularPrice?: string;
  badge?: string;
  items: PricingItem[];
  ctaLabel: string;
  ctaIcon: string;
  ctaHref?: string;
  smallLink?: string;
}

interface SolutionFeature {
  emoji: string;
  title: string;
  description: string;
  tag: string;
}

export default function Home() {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [variantIds, setVariantIds] = useState<{ [key: string]: string }>({});
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      try {
        const fetchedProducts = await getProducts();
        if (cancelled) return;
        const newVariantIds: { [key: string]: string } = {};
        fetchedProducts.forEach(
          (p: { id: string; variants: { id: string }[] }) => {
            if (p.id === PRODUCT_IDS.DIGITAL) {
              newVariantIds.DIGITAL = p.variants[0]?.id;
            } else if (p.id === PRODUCT_IDS.PHYSICAL) {
              newVariantIds.PHYSICAL = p.variants[0]?.id;
            } else if (p.id === PRODUCT_IDS.BUNDLE) {
              newVariantIds.BUNDLE = p.variants[0]?.id;
            }
          }
        );
        setVariantIds(newVariantIds);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null
              ? JSON.stringify(error)
              : String(error);
        console.warn("[Shopify] Could not load products:", message);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuy = async (key: string) => {
    setCheckoutMessage(null);
    const variantId = variantIds[key];
    if (!variantId) {
      setCheckoutMessage(
        "This product is still loading. Please try again in a moment."
      );
      return;
    }
    setLoadingProduct(key);
    try {
      const checkoutUrl = await createCheckout(variantId);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutMessage(
        "Something went wrong initiating checkout. Please try again or refresh the page."
      );
    } finally {
      setLoadingProduct(null);
    }
  };

  return (
    <>
      {/* HERO */}
      <section
        id="hero"
        className="relative pt-12 pb-24 overflow-hidden bg-white"
      >
        <div
          className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-psych-navy/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-float-slow"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-[36rem] h-[36rem] bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="text-center lg:text-left mb-12 lg:mb-0">
              <ScrollReveal direction="up" duration={0.6}>
                <EyebrowBadge
                  icon={<Sparkles className="w-3 h-3" />}
                  variant="default"
                  className="mb-6"
                >
                  {content.hero.badge}
                </EyebrowBadge>
              </ScrollReveal>

              <ScrollReveal direction="up" duration={0.7} delay={0.05}>
                <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.05] mb-6 text-psych-navy tracking-tight">
                  {content.hero.headline}
                  <br />
                  <GradientText variant="brain">
                    {content.hero.headlineAccent}
                  </GradientText>
                </h1>
              </ScrollReveal>

              <ScrollReveal direction="up" duration={0.7} delay={0.1}>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {content.hero.subheadline}
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" duration={0.7} delay={0.18}>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                  <StatPill variant="light">12th-Grade Reading</StatPill>
                  <StatPill variant="light">ESL Friendly</StatPill>
                  <StatPill variant="light">Instant Access</StatPill>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" duration={0.7} delay={0.25}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <CTAButton
                    as="link"
                    href={content.hero.primaryCTA.href}
                    variant="primary"
                    size="lg"
                    shape="rounded"
                  >
                    {content.hero.primaryCTA.label}
                  </CTAButton>
                  <CTAButton
                    as="link"
                    href={content.hero.secondaryCTA.href}
                    variant="secondary"
                    size="lg"
                    shape="rounded"
                    iconLeft={
                      <Sparkles className="w-5 h-5 text-psych-purple" />
                    }
                  >
                    {content.hero.secondaryCTA.label}
                  </CTAButton>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="right" duration={0.8} delay={0.15}>
              <div className="flex justify-center items-center relative py-8">
                <div className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-9/16 rounded-2xl md:rounded-4xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(4,31,80,0.3)] bg-white -rotate-2 hover:rotate-0 transition-transform duration-500 ring-1 ring-slate-200">
                  <div
                    className="absolute top-0 left-0 w-full h-[22%] z-10 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, #ffffff 40%, transparent 100%)",
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-full h-[22%] z-10 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, #ffffff 40%, transparent 100%)",
                    }}
                  />
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-label="Animated preview of the Psychiatric Assessment Mastery workbook being flipped through"
                    className="absolute inset-0 w-full h-full object-cover scale-[1.35] [object-position:center_48%]"
                    poster="/1.png"
                  >
                    <source src="/Mockup.webm" type="video/webm" />
                  </video>
                </div>

                <div className="hidden lg:block absolute top-12 -left-6 glass-dark rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl animate-float-slow">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    MSE Auto-Filled
                  </div>
                </div>
                <div className="hidden lg:block absolute bottom-16 -right-8 glass-dark rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-300" aria-hidden="true" />
                    Safety Domains ✓
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-slate-50 to-transparent z-10" />
      </section>

      {/* WHAT WE DO */}
      <Section
        id="what-we-do"
        eyebrow={content.whatWeDo.sectionLabel}
        headline={content.whatWeDo.headline}
        subheadline={content.whatWeDo.subheadline}
        background="slate"
        spacing="md"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {content.whatWeDo.items.map(
            ({ label, icon }: { label: string; icon: string }, i: number) => (
              <ScrollReveal
                key={label}
                direction="up"
                delay={i * 0.05}
                duration={0.5}
              >
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-psych-purple/30 transition-all h-full">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-semibold text-slate-700">{label}</span>
                </div>
              </ScrollReveal>
            )
          )}
        </div>
        <p className="text-center text-slate-500 text-sm">
          {content.whatWeDo.footnote}
        </p>
      </Section>

      {/* THE GAP */}
      <Section
        id="problem"
        eyebrow="The Gap"
        headline={content.problem.headline}
        subheadline={content.problem.subLabel}
        background="slate"
        spacing="lg"
        className="border-t border-slate-200"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal direction="left" duration={0.7}>
            <div className="relative">
              <div className="absolute -inset-4 bg-psych-navy/10 rounded-3xl transform -rotate-2" />
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/student-with-pam-in-library.png"
                  alt="Student studying with the Psychiatric Assessment Mastery workbook"
                  width={600}
                  height={800}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right" duration={0.7}>
            <p className="text-base font-semibold text-psych-navy mb-4">
              {content.problem.description}
            </p>
            <div className="space-y-6 mt-8">
              {content.problem.painPoints.map(
                (point: {
                  title: string;
                  description: string;
                  iconColor: string;
                }) => {
                  const IconComponent =
                    painPointIcons[
                      point.iconColor as keyof typeof painPointIcons
                    ] ?? AlertCircle;
                  const iconStyle =
                    painPointIconStyles[
                      point.iconColor as keyof typeof painPointIconStyles
                    ] ?? painPointIconStyles.red;
                  return (
                    <div key={point.title} className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-lg shrink-0", iconStyle)}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">
                          {point.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </ScrollReveal>
        </div>
      </Section>

      {/* SOAP ARCHITECT TEASER */}
      <section
        id="soap-architect"
        className="py-24 bg-psych-navy relative overflow-hidden"
      >
        <MotionGrid variant="light" />
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-psych-purple/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="up" duration={0.7}>
              <div>
                <EyebrowBadge
                  variant="light"
                  className="mb-5"
                  icon={
                    <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      New
                    </span>
                  }
                >
                  {content.soapArchitectTeaser.badge}
                </EyebrowBadge>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                  {content.soapArchitectTeaser.headline}
                </h2>
                <p className="text-blue-200 text-lg mb-3 font-semibold">
                  {content.soapArchitectTeaser.subheadline}
                </p>
                <p className="text-blue-300 mb-8 leading-relaxed">
                  {content.soapArchitectTeaser.valueProp}
                </p>
                <ul className="space-y-3 mb-8">
                  {content.soapArchitectTeaser.features.map((item: string) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-blue-100"
                    >
                      <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 items-center mt-2">
                  <CTAButton
                    as="link"
                    href={content.soapArchitectTeaser.ctaHref}
                    variant="primary"
                    size="lg"
                    shape="rounded"
                  >
                    {content.soapArchitectTeaser.ctaLabel}
                  </CTAButton>
                  <span className="flex items-center text-blue-300 text-xs">
                    {content.soapArchitectTeaser.disclaimer}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <div className="hidden lg:block">
              <ScrollReveal direction="right" delay={0.15}>
                <div className="space-y-4">
                  <GlassCard tone="dark" className="p-5">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                      {content.soapArchitectTeaser.demo.inputLabel}
                    </span>
                    <p className="mt-2 text-blue-100 font-mono text-sm italic">
                      {content.soapArchitectTeaser.demo.inputText}
                    </p>
                  </GlassCard>
                  <div className="text-center text-white/40 text-2xl" aria-hidden="true">↓</div>
                  <GlassCard tone="light" className="p-5">
                    <span className="text-xs font-bold text-psych-navy uppercase tracking-wider">
                      {content.soapArchitectTeaser.demo.outputLabel}
                    </span>
                    <div className="mt-2 text-slate-700 text-xs space-y-1.5">
                      <p>
                        <strong className="text-psych-navy">Subjective:</strong>{" "}
                        {content.soapArchitectTeaser.demo.outputSubjective}
                      </p>
                      <p>
                        <strong className="text-psych-navy">
                          Objective (MSE):
                        </strong>{" "}
                        {content.soapArchitectTeaser.demo.outputObjective}
                      </p>
                      <p>
                        <strong className="text-psych-navy">Assessment:</strong>{" "}
                        {content.soapArchitectTeaser.demo.outputAssessment}
                      </p>
                    </div>
                  </GlassCard>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* WHY STUDENTS LOVE US */}
      <Section
        id="features"
        eyebrow="Student Love"
        headline={content.solution.headline}
        subheadline={content.solution.subheadline}
        background="white"
        spacing="lg"
      >
        <div className="grid md:grid-cols-3 gap-8">
          {content.solution.features.map(
            (feature: SolutionFeature, i: number) => (
              <ScrollReveal
                key={feature.title}
                direction="up"
                delay={i * 0.08}
                duration={0.55}
              >
                <FeatureCard feature={feature} />
              </ScrollReveal>
            )
          )}
        </div>

        <ScrollReveal
          direction="up"
          duration={0.8}
          className="my-16 md:my-24"
        >
          <div className="relative min-h-[24rem] md:h-96 rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/pam-book-mockup.png"
              alt="Workbook spread preview"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-slate-900/90 via-slate-900/50 to-transparent flex items-center p-8 py-16 md:p-16">
              <div className="max-w-lg">
                <h3 className="text-white text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                  {content.visualBreak.headline}
                  <br />
                  {content.visualBreak.headlineAccent}
                </h3>
                <p className="text-slate-200 mb-8 text-lg">
                  {content.visualBreak.description}
                </p>
                <CTAButton
                  as="anchor"
                  href="#pricing"
                  variant="primary"
                  size="lg"
                  shape="rounded"
                >
                  {content.visualBreak.ctaLabel}
                </CTAButton>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* PRICING */}
      <Section
        id="pricing"
        headline={content.pricing.headline}
        subheadline={content.pricing.subheadline}
        background="slate"
        spacing="lg"
      >
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {content.pricing.cards.map((card: PricingCard, i: number) => (
            <ScrollReveal
              key={card.key}
              direction="up"
              delay={i * 0.1}
              duration={0.55}
            >
              <PricingCardView
                card={card}
                loading={loadingProduct === card.key}
                onBuy={() => handleBuy(card.key)}
              />
            </ScrollReveal>
          ))}
        </div>
        <div
          role="status"
          aria-live="polite"
          className="max-w-5xl mx-auto mt-6 min-h-[1rem]"
        >
          {checkoutMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm font-medium text-center">
              {checkoutMessage}
            </div>
          )}
        </div>
        <ScrollReveal direction="up" delay={0.1}>
          <LeadMagnet />
        </ScrollReveal>
      </Section>

      {/* ABOUT + FEEDBACK */}
      <section
        id="about"
        className="py-32 bg-slate-50 relative overflow-hidden"
      >
        {/* Slanted blue banner — only this block carries the motion-grid backdrop (matches Footer) */}
        <div className="absolute top-0 left-0 w-full h-[36rem] bg-psych-navy -skew-y-3 origin-top-left -translate-y-20 z-0 overflow-hidden">
          {/* Animated motion-grid backdrop */}
          <MotionGrid variant="light" />
          {/* Ambient colour orbs */}
          <div
            className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-psych-purple/20 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full bg-psych-blue/20 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <span className="text-blue-200 font-bold tracking-widest uppercase text-xs mb-3 block">
                {content.aboutAuthor.sectionLabel}
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
                {content.aboutAuthor.headline}
              </h2>
              <p className="text-blue-100 font-semibold text-xl">
                {content.aboutAuthor.role}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <Card className="overflow-hidden flex flex-col lg:flex-row rounded-[2.5rem] border-slate-200">
              <div className="lg:w-1/2 p-10 lg:p-16 flex flex-col">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-psych-navy/10 shrink-0">
                    <Image
                      src="/Tonia Ojomo, MSN, BSN, RN.png"
                      alt="Tonia Ojomo — Author of Psychiatric Assessment Mastery"
                      fill
                      sizes="(max-width: 768px) 112px, 112px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-slate-900 leading-tight">
                      Tonia Ojomo
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-psych text-lg">
                        MSN, BSN, RN
                      </span>
                    </h3>
                  </div>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed mb-6">
                  {content.aboutAuthor.bio}
                </p>
                <blockquote className="border-l-4 border-psych-purple pl-5 py-2 text-slate-700 italic text-base mb-10 leading-relaxed bg-psych-purple/5 rounded-r-xl">
                  {content.aboutAuthor.mission}
                </blockquote>
                <div className="flex flex-wrap gap-2 mb-10 mt-auto">
                  {content.aboutAuthor.credentials.map((cred: string) => (
                    <Badge key={cred} variant="soft">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {cred}
                    </Badge>
                  ))}
                </div>
                <CTAButton
                  as="link"
                  href={content.aboutAuthor.ctaHref}
                  variant="primary"
                  size="lg"
                  shape="rounded"
                  className="w-fit"
                >
                  {content.aboutAuthor.ctaLabel}
                </CTAButton>
              </div>

              <div className="lg:w-1/2 p-10 lg:p-16 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-100 relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-psych text-white rounded-xl shadow-md border border-white">
                    <Send className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {content.aboutAuthor.feedbackForm.headline}
                  </h3>
                </div>
                <p className="text-slate-500 text-base mb-8 leading-relaxed max-w-sm">
                  {content.aboutAuthor.feedbackForm.description}
                </p>
                <FeedbackForm content={content.aboutAuthor.feedbackForm} />
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </section>

    </>
  );
}

/* ============================================================ */
/*                       Sub-Components                          */
/* ============================================================ */

function PricingCardView({
  card,
  loading,
  onBuy,
}: {
  card: PricingCard;
  loading: boolean;
  onBuy: () => void;
}) {
  const CtaIcon =
    pricingCtaIcons[card.ctaIcon as keyof typeof pricingCtaIcons] ?? Package;
  const isFeatured = card.key === "DIGITAL";

  return (
    <div
      className={cn(
        "rounded-2xl p-8 bg-white relative flex flex-col h-full transition-all",
        isFeatured
          ? "md:scale-105 z-10 border-2 border-psych-purple shadow-2xl shadow-psych-purple/10"
          : "border border-slate-200 shadow-xl"
      )}
    >
      {card.badge && (
        <Badge
          variant={isFeatured ? "gradient" : "default"}
          className="absolute top-4 right-4"
        >
          {card.badge}
        </Badge>
      )}
      <div className="mb-6">
        <h3
          className={cn(
            "font-bold text-slate-900 mb-1",
            isFeatured ? "text-2xl" : "text-xl"
          )}
        >
          {card.title}
        </h3>
        <p className="text-sm text-slate-500">{card.subtitle}</p>
      </div>
      <div className="flex items-baseline flex-wrap gap-2 mb-6">
        {card.regularPrice && (
          <span className="text-2xl text-slate-400 line-through font-medium">
            {card.regularPrice}
          </span>
        )}
        <span
          className={cn(
            "text-slate-900",
            isFeatured ? "text-5xl font-extrabold" : "text-4xl font-bold"
          )}
        >
          {card.price}
        </span>
        {isFeatured && (
          <span className="text-sm font-semibold text-slate-500 w-full mt-1">
            (Introductory Price)
          </span>
        )}
      </div>

      <div className="mb-8 flex flex-col items-center w-full">
        {card.ctaHref ? (
          <>
            <CTAButton
              as="link"
              href={card.ctaHref}
              variant={isFeatured ? "primary" : "outline"}
              size="lg"
              shape="rounded"
              className="w-full"
              iconLeft={<CtaIcon />}
            >
              {card.ctaLabel}
            </CTAButton>
            {card.smallLink && (
              <a
                href={card.ctaHref}
                className="mt-4 text-sm text-slate-500 underline decoration-slate-300 font-semibold hover:text-psych-purple transition"
              >
                {card.smallLink}
              </a>
            )}
          </>
        ) : (
          <CTAButton
            as="button"
            onClick={onBuy}
            loading={loading}
            variant={isFeatured ? "primary" : "outline"}
            size="lg"
            shape="rounded"
            className="w-full"
            iconLeft={loading ? undefined : <CtaIcon />}
          >
            {card.ctaLabel}
          </CTAButton>
        )}
      </div>

      <ul className="space-y-4 mb-4 grow">
        {card.items.map((item) => (
          <li
            key={item.text}
            className={cn(
              "flex items-start",
              item.highlight &&
                "border border-amber-200 bg-amber-50 rounded-lg px-3 py-2"
            )}
          >
            <CheckCircle2
              className={cn(
                "mr-2 w-5 h-5 shrink-0 mt-0.5",
                item.highlight ? "text-amber-600" : "text-psych-navy"
              )}
              aria-hidden="true"
            />
            <span className="text-slate-700 text-sm">
              <strong>{item.bold}</strong>
              {item.text.slice(item.bold.length)}
              {item.highlightLabel && (
                <span className="ml-1 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  {item.highlightLabel}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FeedbackContent {
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  submitLabel: string;
  successMessage: string;
}

function FeedbackForm({ content }: { content: FeedbackContent }) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formValues.name,
          email: formValues.email,
          message: formValues.message,
        }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not send your feedback.");
      }
      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not send your feedback."
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-psych-purple/5 border border-psych-purple/20 rounded-xl p-8 text-center text-psych-purple">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4" aria-hidden="true" />
        <h4 className="font-bold text-xl mb-2">{content.successMessage}</h4>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setFormValues({ name: "", email: "", message: "" });
          }}
          className="mt-6 text-sm font-bold underline hover:no-underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <FormField
          id="nameInput"
          label={content.nameLabel}
          placeholder={content.namePlaceholder}
          value={formValues.name}
          onChange={(v) => setFormValues((p) => ({ ...p, name: v }))}
        />
        <FormField
          id="emailInput"
          label={content.emailLabel}
          placeholder={content.emailPlaceholder}
          type="email"
          value={formValues.email}
          onChange={(v) => setFormValues((p) => ({ ...p, email: v }))}
        />
      </div>
      <FormField
        id="messageInput"
        label={content.messageLabel}
        placeholder={content.messagePlaceholder}
        as="textarea"
        rows={4}
        value={formValues.message}
        onChange={(v) => setFormValues((p) => ({ ...p, message: v }))}
      />
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {errorMessage}
        </p>
      )}
      <CTAButton
        type="submit"
        variant="primary"
        size="lg"
        shape="rounded"
        className="w-full"
        loading={status === "submitting"}
        iconLeft={
          status === "submitting" ? undefined : <Send className="w-5 h-5" />
        }
      >
        {content.submitLabel}
      </CTAButton>
    </form>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  as?: "input" | "textarea";
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
}

function FormField({
  id,
  label,
  placeholder,
  type = "text",
  as = "input",
  rows,
  value,
  onChange,
}: FormFieldProps) {
  const focusRing =
    "focus-within:bg-gradient-psych transition bg-slate-300 rounded-xl p-0.5";
  const innerClass =
    "w-full bg-white rounded-[10px] px-4 py-3 text-slate-900 focus:outline-none transition";

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-bold text-slate-700 mb-2"
      >
        {label}
      </label>
      <div className={focusRing}>
        {as === "textarea" ? (
          <textarea
            id={id}
            required
            rows={rows ?? 3}
            placeholder={placeholder}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${innerClass} resize-none`}
          />
        ) : (
          <input
            id={id}
            required
            type={type}
            placeholder={placeholder}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            className={innerClass}
          />
        )}
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: SolutionFeature }) {
  return (
    <div className="group bg-white p-10 rounded-3xl border border-slate-100 hover:border-psych-navy hover:shadow-xl transition duration-300 text-center h-full cursor-default">
      <div className="text-5xl mb-5 transition-transform group-hover:scale-110">
        {feature.emoji}
      </div>
      <Badge variant="soft" className="mb-4">
        {feature.tag}
      </Badge>
      <h3 className="font-extrabold text-2xl mb-4 text-slate-900">
        {feature.title}
      </h3>
      <p className="text-slate-500 leading-relaxed">{feature.description}</p>
    </div>
  );
}
