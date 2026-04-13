
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createCheckout, getProducts } from "@/lib/shopify";
import { SoapArchitect } from "@/components/ClinicalTools";
import { LeadMagnet } from "@/components/LeadMagnet";
// Dynamically import PDFPreview to avoid SSR issues
const PDFPreview = dynamic(
  () => import("@/components/PDFPreview").then(mod => ({ default: mod.PDFPreview })),
  { ssr: false }
);
// ThemeToggle removed
import {
  CheckCircle2,
  AlertCircle,
  Quote,
  Flag,
  PenTool,
  CheckSquare,
  Loader2,
  ShoppingCart,
  Download,
  Sparkles,
  Package,
  BookOpen,
  Menu,
  X,
  Target,
  Tag,
  Send,
  User,
  Facebook,
  Instagram,
  Linkedin,
  Music,
} from "lucide-react";
import { motion } from "framer-motion";

// Import centralized content
import siteContent from "@/content/site-content.json";

const content = siteContent.homePage;
const global = siteContent.global as any;

interface NavigationItem {
  label: string;
  href: string;
  badge?: string;
}

// Icon map for pain points
const painPointIcons: Record<string, typeof AlertCircle> = {
  red: AlertCircle,
  brand: CheckSquare,
  slate: Flag,
};

const painPointIconStyles: Record<string, string> = {
  red: "p-3 bg-red-100 text-red-600 rounded-lg",
  brand: "p-3 bg-psych-navy/10 text-psych-navy rounded-lg",
  slate: "p-3 bg-slate-200 text-slate-700 rounded-lg",
};

// Icon map for pricing CTA
const pricingCtaIcons: Record<string, typeof Package> = {
  package: Package,
  cart: ShoppingCart,
  download: Download,
};

export default function Home() {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [variantIds, setVariantIds] = useState<{ [key: string]: string }>({});
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const PRODUCT_IDS = {
    DIGITAL: "gid://shopify/Product/8137108652111",
    PHYSICAL: "gid://shopify/Product/8094955569231",
    BUNDLE: "gid://shopify/Product/8121252020303",
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await getProducts();

        const newVariantIds: { [key: string]: string } = {};
        fetchedProducts.forEach((p: any) => {
          if (p.id === PRODUCT_IDS.DIGITAL) {
            newVariantIds.DIGITAL = p.variants[0]?.id;
          } else if (p.id === PRODUCT_IDS.PHYSICAL) {
            newVariantIds.PHYSICAL = p.variants[0]?.id;
          } else if (p.id === PRODUCT_IDS.BUNDLE) {
            newVariantIds.BUNDLE = p.variants[0]?.id;
          }
        });
        setVariantIds(newVariantIds);
      } catch (error: unknown) {
        // Shopify SDK may throw non-Error objects — handle gracefully
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
  }, []);

  const handleBuy = async (key: string) => {
    const variantId = variantIds[key];
    if (!variantId) {
      alert("Product not available or loading...");
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
      alert("Something went wrong initiating checkout. Please try again.");
    } finally {
      setLoadingProduct(null);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans selection:bg-psych-navy/20 min-h-screen flex flex-col">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-auto h-10 flex items-center">
                {/* New Psych Mastery brand logo */}
                <Image
                  src="/logo.webp"
                  alt="Psych Mastery Logo"
                  width={240}
                  height={70}
                  className="object-contain h-14 w-auto"
                  priority
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex space-x-8 items-center">
                {(global.navigation as NavigationItem[]).map((nav) => (
                  <Link
                    key={nav.label}
                    href={nav.href}
                    className="text-psych-navy font-bold hover:text-[#052647] transition flex items-center gap-1"
                  >
                    {nav.label}
                    {nav.badge && (
                      <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        {nav.badge}
                      </span>
                    )}
                  </Link>
                ))}
                <button
                  onClick={() => setIsPDFPreviewOpen(true)}
                  className="text-psych-navy font-bold hover:text-[#052647] transition flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" /> Preview Sample
                </button>
              </div>
              {/* ThemeToggle Removed */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group hidden md:inline-block">
                <div className="absolute -inset-1 bg-gradient-psych rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="relative bg-gradient-psych text-white px-6 py-2 rounded-full font-bold transition shadow-lg"
                >
                  Start Practicing
                </button>
              </motion.div>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-psych-navy p-2 hover:bg-slate-100 rounded-lg transition"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 shadow-xl absolute w-full top-20 left-0">
            <div className="px-4 py-4 space-y-3">
              {(global.navigation as NavigationItem[]).map((nav) => (
                <Link
                  key={nav.label}
                  href={nav.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-psych-navy font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition"
                >
                  {nav.label}
                  {nav.badge && (
                    <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {nav.badge}
                    </span>
                  )}
                </Link>
              ))}
              <button
                onClick={() => { setIsPDFPreviewOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-psych-navy font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition w-full"
              >
                <BookOpen className="w-4 h-4" /> Preview Sample
              </button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="relative group w-full mt-2">
                <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <button
                  onClick={() => {
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="relative w-full bg-gradient-psych text-white px-6 py-3.5 rounded-xl font-bold transition shadow-md"
                >
                  Start Practicing
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-white z-0"></div>

        {/* Subtle nice background element */}
        <div className="absolute top-0 right-0 w-200 h-200 bg-psych-navy/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-60"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

            <div className="text-center lg:text-left mb-12 lg:mb-0 relative z-30">
              <div className="inline-flex items-center px-4 py-1.5 bg-psych-navy/10 text-psych-navy rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-psych-navy/20">
                <PenTool className="w-3 h-3 mr-2" /> {content.hero.badge}
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-slate-900 tracking-tight">
                {content.hero.headline}<br />
                <span className="text-transparent bg-clip-text bg-gradient-brain drop-shadow-sm">{content.hero.headlineAccent}</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                {content.hero.subheadline}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <Link href={content.hero.primaryCTA.href} className="relative bg-gradient-psych text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                    {content.hero.primaryCTA.label}
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative p-0.5 rounded-xl bg-gradient-brain group hover:shadow-lg hover:shadow-psych-blue/20 transition">
                  <Link href={content.hero.secondaryCTA.href} className="bg-white text-psych-navy px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition flex items-center justify-center gap-2 h-full w-full">
                    <SparklesIcon className="w-5 h-5 text-psych-purple" /> {content.hero.secondaryCTA.label}
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Video Hero — 9:16 mockup, bezels cropped via scale + white fade masks */}
            <div className="flex justify-center items-center relative z-20 py-8">
              <div className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-9/16 rounded-2xl md:rounded-4xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(4,31,80,0.3)] bg-white -rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* White fade masks — tall enough to fully cover bezels */}
                <div className="absolute top-0 left-0 w-full h-[22%] z-10 pointer-events-none" style={{ background: "linear-gradient(to bottom, #ffffff 40%, transparent 100%)" }} />
                <div className="absolute bottom-0 left-0 w-full h-[22%] z-10 pointer-events-none" style={{ background: "linear-gradient(to top, #ffffff 40%, transparent 100%)" }} />
                <video
                  suppressHydrationWarning
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover scale-[1.35] [object-position:center_48%]"
                  poster="/1.png"
                >
                  <source src="/Mockup.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient Fade at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-slate-50 to-transparent z-10"></div>
      </header>

      {/* What We Do Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-psych-navy font-bold tracking-widest uppercase text-xs mb-3 block">{content.whatWeDo.sectionLabel}</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">{content.whatWeDo.headline}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {content.whatWeDo.subheadline}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {content.whatWeDo.items.map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
                <span className="text-xl">{icon}</span>
                <span className="font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm">
            {content.whatWeDo.footnote}
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-psych-navy/10 rounded-3xl transform -rotate-2"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/student-with-pam-in-library.png"
                  alt="Student studying with workbook"
                  width={600}
                  height={800}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{content.problem.headline}</h2>
              <p className="text-base font-semibold text-psych-navy mb-4">{content.problem.subLabel}</p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {content.problem.description}
              </p>

              <div className="space-y-6">
                {content.problem.painPoints.map((point) => {
                  const IconComponent = painPointIcons[point.iconColor] || AlertCircle;
                  const iconStyle = painPointIconStyles[point.iconColor] || painPointIconStyles.red;
                  return (
                    <div key={point.title} className="flex items-start gap-4">
                      <div className={iconStyle}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{point.title}</h3>
                        <p className="text-slate-600">{point.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOAP Architect Teaser */}
      <section id="soap-architect" className="py-20 bg-psych-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-blue-200 rounded-full text-xs font-bold tracking-widest uppercase mb-5">
                <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">{content.soapArchitectTeaser.badge ? "New" : ""}</span>
                {content.soapArchitectTeaser.badge}
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">{content.soapArchitectTeaser.headline}</h2>
              <p className="text-blue-200 text-lg mb-3 font-semibold">{content.soapArchitectTeaser.subheadline}</p>
              <p className="text-blue-300 mb-8 leading-relaxed">
                {content.soapArchitectTeaser.valueProp}
              </p>
              <ul className="space-y-3 mb-8">
                {content.soapArchitectTeaser.features.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-blue-100">
                    <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 items-center mt-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <Link
                    href={content.soapArchitectTeaser.ctaHref}
                    className="relative inline-block bg-gradient-psych text-white px-8 py-4 rounded-xl font-bold transition text-center"
                  >
                    {content.soapArchitectTeaser.ctaLabel}
                  </Link>
                </motion.div>
                <span className="flex items-center text-blue-300 text-xs px-4">{content.soapArchitectTeaser.disclaimer}</span>
              </div>
            </div>
            <div className="hidden lg:block">
              {/* Before/After preview */}
              <div className="space-y-4">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">{content.soapArchitectTeaser.demo.inputLabel}</span>
                  <p className="mt-2 text-blue-100 font-mono text-sm italic">{content.soapArchitectTeaser.demo.inputText}</p>
                </div>
                <div className="text-center text-white/40 text-2xl">↓</div>
                <div className="bg-white rounded-2xl p-5 shadow-xl">
                  <span className="text-xs font-bold text-psych-navy uppercase tracking-wider">{content.soapArchitectTeaser.demo.outputLabel}</span>
                  <div className="mt-2 text-slate-700 text-xs space-y-1.5">
                    <p><strong className="text-psych-navy">Subjective:</strong> {content.soapArchitectTeaser.demo.outputSubjective}</p>
                    <p><strong className="text-psych-navy">Objective (MSE):</strong> {content.soapArchitectTeaser.demo.outputObjective}</p>
                    <p><strong className="text-psych-navy">Assessment:</strong> {content.soapArchitectTeaser.demo.outputAssessment}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Students Love Us */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-transparent bg-clip-text bg-gradient-psych font-bold tracking-widest uppercase text-xs mb-3 block">Student Love</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{content.solution.headline}</h2>
            <p className="text-slate-600 text-lg">{content.solution.subheadline}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {content.solution.features.map(({ emoji, title, description, tag }) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={title}
                className="bg-slate-50 p-10 rounded-3xl border border-slate-100 hover:border-psych-navy hover:shadow-xl transition duration-300 text-center"
              >
                <div className="text-5xl mb-5">{emoji}</div>
                <div className="inline-block px-3 py-1 bg-psych-purple/10 text-psych-purple rounded-full text-xs font-bold mb-4 tracking-widest uppercase">{tag}</div>
                <h3 className="font-extrabold text-2xl mb-4 text-slate-900">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>

          {/* Visual Break */}
          <div className="my-16 md:my-24 relative min-h-100 md:h-96 rounded-3xl overflow-hidden shadow-2xl">
            <Image src="/pam-book-mockup.png" alt="Workbook Spread" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-slate-900/90 via-slate-900/50 to-transparent flex items-center p-8 py-16 md:p-16">
              <div className="max-w-lg">
                <h3 className="text-white text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                  {content.visualBreak.headline}<br />{content.visualBreak.headlineAccent}
                </h3>
                <p className="text-slate-200 mb-8 text-lg">{content.visualBreak.description}</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group inline-block">
                  <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="relative bg-gradient-psych text-white px-8 py-4 rounded-xl font-bold transition w-full">{content.visualBreak.ctaLabel}</button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Funnel */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900">{content.pricing.headline}</h2>
            <p className="text-slate-600 mt-4">{content.pricing.subheadline}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {content.pricing.cards.map((card) => {
              const CtaIcon = pricingCtaIcons[card.ctaIcon] || Package;
              const isFeatured = card.key === "DIGITAL";
              return (
                <div
                  key={card.key}
                  className={`${isFeatured ? "md:scale-105 z-10 border-2 border-psych-purple" : "border border-slate-200"} rounded-2xl p-8 bg-white ${isFeatured ? "shadow-2xl shadow-psych-purple/10" : "shadow-xl"} relative flex flex-col`}
                >
                  {card.badge && (
                    <div className={`absolute top-0 right-0 ${isFeatured ? "bg-gradient-psych" : "bg-slate-600"} text-white text-xs font-bold px-4 py-1.5 rounded-xl uppercase tracking-wider`}>
                      {card.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`${isFeatured ? "text-2xl" : "text-xl"} font-bold text-slate-900 mb-1`}>{card.title}</h3>
                    <p className="text-sm text-slate-500">{card.subtitle}</p>
                  </div>
                  <div className="flex items-baseline flex-wrap gap-2 mb-6">
                    {(card as any).regularPrice && (
                      <span className="text-2xl text-slate-400 line-through font-medium">{(card as any).regularPrice}</span>
                    )}
                    <span className={`${isFeatured ? "text-5xl font-extrabold" : "text-4xl font-bold"} text-slate-900`}>{card.price}</span>
                    {isFeatured && (
                      <span className="text-sm font-semibold text-slate-500 w-full xs:w-auto mt-1 xs:mt-0">(Introductory Price)</span>
                    )}
                  </div>

                  <div className="mb-8 flex flex-col items-center w-full">
                    {(card as any).ctaHref ? (
                      <>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={isFeatured ? "relative group w-full" : "w-full"}>
                          {isFeatured && <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>}
                          <Link
                            href={(card as any).ctaHref}
                            className={`relative w-full ${isFeatured ? "bg-gradient-psych text-white shadow-xl shadow-psych-purple/20" : "bg-white border-2 border-psych-navy text-psych-navy hover:bg-slate-50"} font-bold py-4 rounded-xl transition flex items-center justify-center gap-2`}
                          >
                            <CtaIcon />
                            {card.ctaLabel}
                          </Link>
                        </motion.div>
                        {(card as any).smallLink && (
                          <Link href={(card as any).ctaHref} className="mt-4 text-sm text-slate-500 underline decoration-slate-300 font-semibold hover:text-psych-purple transition">
                            {(card as any).smallLink}
                          </Link>
                        )}
                      </>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={isFeatured ? "relative group w-full" : "w-full"}>
                        {isFeatured && <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>}
                        <button
                          onClick={() => handleBuy(card.key)}
                          disabled={loadingProduct === card.key}
                          className={`relative w-full ${isFeatured ? "bg-gradient-psych text-white shadow-xl shadow-psych-purple/20" : "bg-psych-navy text-white hover:bg-[#052647]"} font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70`}
                        >
                          {loadingProduct === card.key ? <Loader2 className="animate-spin" /> : <CtaIcon />}
                          {card.ctaLabel}
                        </button>
                      </motion.div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-4 grow">
                    {card.items.map((item: any, idx: number) => (
                      <li
                        key={item.text}
                        className={`flex items-start ${item.highlight ? "border border-amber-200 bg-amber-50 rounded-lg px-3 py-2" : ""}`}
                      >
                        <CheckCircle2 className={`${item.highlight ? "text-amber-600" : "text-psych-navy"} mr-2 w-5 h-5 shrink-0 ${item.highlight ? "mt-0.5" : ""}`} />
                        <span className="text-slate-700 text-sm">
                          <strong>{item.bold}</strong>
                          {item.text.replace(item.bold, "") && ` ${item.text.slice(item.bold.length)}`}
                          {item.highlightLabel && (
                            <span className="ml-1 text-amber-700 text-[10px] font-bold uppercase tracking-wider">{item.highlightLabel}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <LeadMagnet />

        </div>
      </section>

      {/* About the Author + Feedback Section */}
      <section id="about" className="py-32 bg-slate-50 relative overflow-hidden">
        {/* Decorative deep blue background cut */}
        <div className="absolute top-0 left-0 w-full h-150 bg-psych-navy -skew-y-3 origin-top-left -translate-y-20 z-0" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="text-blue-200 font-bold tracking-widest uppercase text-xs mb-3 block">{content.aboutAuthor.sectionLabel}</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white">{content.aboutAuthor.headline}</h2>
            <p className="text-blue-100 font-semibold text-xl mt-4">{content.aboutAuthor.role}</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-psych-navy/10 overflow-hidden flex flex-col lg:flex-row">
            {/* Bio Column */}
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
                  <h3 className="font-bold text-2xl text-slate-900 leading-tight block xl:hidden">Meet Tonia</h3>
                  <h3 className="font-bold text-2xl text-slate-900 leading-tight hidden xl:block">Tonia Ojomo,<br /><span className="text-transparent bg-clip-text bg-gradient-psych text-lg">MSN, BSN, RN</span></h3>
                </div>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                {content.aboutAuthor.bio}
              </p>

              <blockquote className="border-l-4 border-psych-purple pl-5 py-2 text-slate-700 italic text-base mb-10 leading-relaxed bg-psych-purple/5 rounded-r-xl">
                {content.aboutAuthor.mission}
              </blockquote>

              {/* Credential pills */}
              <div className="flex flex-wrap gap-2 mb-10 mt-auto">
                {content.aboutAuthor.credentials.map((cred: string) => (
                  <span key={cred} className="inline-flex items-center gap-1.5 px-4 py-2 bg-psych-purple/5 text-psych-purple border border-psych-purple/20 rounded-full text-xs font-bold tracking-wide shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {cred}
                  </span>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group inline-block mt-auto w-fit">
                <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Link
                  href={content.aboutAuthor.ctaHref}
                  className="relative inline-flex items-center justify-center gap-2 bg-gradient-psych text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-xl w-full"
                >
                  {content.aboutAuthor.ctaLabel}
                </Link>
              </motion.div>
            </div>

            {/* Feedback Form Column */}
            <div className="lg:w-1/2 p-10 lg:p-16 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-100 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-slate-200 to-transparent lg:w-1 lg:h-full lg:bg-linear-to-b" />

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-psych text-white rounded-xl shadow-md border border-white">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{content.aboutAuthor.feedbackForm.headline}</h3>
              </div>

              <p className="text-slate-500 text-base mb-10 leading-relaxed max-w-sm">
                {content.aboutAuthor.feedbackForm.description}
              </p>

              <FeedbackForm content={content.aboutAuthor.feedbackForm} />
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-slate-900 text-slate-400 py-16 text-center border-t border-slate-800 mt-auto relative">
        <p className="text-slate-300 font-semibold mb-2">{global.brandName}</p>
        <p className="mb-6">{global.footerCopyright}</p>
        <p className="max-w-2xl mx-auto text-xs leading-relaxed text-slate-600 px-6">
          {global.footerDisclaimer}
        </p>
        <div className="flex justify-center space-x-4 mt-6 mb-8">
          {global.socialLinks?.facebook && (
            <Link href={global.socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook className="w-6 h-6 text-slate-400 hover:text-psych-purple transition-colors" />
            </Link>
          )}
          {global.socialLinks?.instagram && (
            <Link href={global.socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="w-6 h-6 text-slate-400 hover:text-psych-purple transition-colors" />
            </Link>
          )}
          {global.socialLinks?.tiktok && (
            <Link href={global.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <Music className="w-6 h-6 text-slate-400 hover:text-psych-purple transition-colors" />
            </Link>
          )}
          {global.socialLinks?.linkedin && (
            <Link href={global.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="w-6 h-6 text-slate-400 hover:text-psych-purple transition-colors" />
            </Link>
          )}
        </div>
        <Link href="/admin/login" className="inline-block mt-4 px-6 py-2 bg-psych-navy text-white rounded-full font-semibold hover:bg-psych-purple transition-colors text-sm">Admin Login</Link>
      </footer>

      {/* PDF Preview Modal */}
      <PDFPreview
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
        maxPreviewPages={10}
      />
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}

function FeedbackForm({ content }: { content: any }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
    }, 1000); // Simulate API call
  };

  if (status === "success") {
    return (
      <div className="bg-psych-purple/5 border border-psych-purple/20 rounded-xl p-8 text-center text-psych-purple">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
        <h4 className="font-bold text-xl mb-2">{content.successMessage}</h4>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-bold underline hover:no-underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nameInput" className="block text-sm font-bold text-slate-700 mb-2">{content.nameLabel}</label>
          <div className="relative p-0.5 rounded-xl focus-within:bg-gradient-psych transition bg-slate-300">
            <input
              id="nameInput"
              required
              type="text"
              placeholder={content.namePlaceholder}
              className="w-full bg-white rounded-[10px] px-4 py-3 text-slate-900 focus:outline-none transition"
            />
          </div>
        </div>
        <div>
          <label htmlFor="emailInput" className="block text-sm font-bold text-slate-700 mb-2">{content.emailLabel}</label>
          <div className="relative p-0.5 rounded-xl focus-within:bg-gradient-psych transition bg-slate-300">
            <input
              id="emailInput"
              required
              type="email"
              placeholder={content.emailPlaceholder}
              className="w-full bg-white rounded-[10px] px-4 py-3 text-slate-900 focus:outline-none transition"
            />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="messageInput" className="block text-sm font-bold text-slate-700 mb-2">{content.messageLabel}</label>
        <div className="relative p-0.5 rounded-xl focus-within:bg-gradient-psych transition bg-slate-300">
          <textarea
            id="messageInput"
            required
            rows={4}
            placeholder={content.messagePlaceholder}
            className="w-full bg-white rounded-[10px] px-4 py-3 text-slate-900 focus:outline-none transition resize-none"
          ></textarea>
        </div>
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative group">
        <div className="absolute -inset-1 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="relative w-full bg-gradient-psych text-white shadow-xl shadow-psych-purple/20 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {status === "submitting" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {content.submitLabel}
        </button>
      </motion.div>
    </form>
  );
}
