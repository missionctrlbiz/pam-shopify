
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createCheckout, getProducts } from "@/lib/shopify";
import { SoapArchitect } from "@/components/GeminiTools";
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
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [variantIds, setVariantIds] = useState<{ [key: string]: string }>({});
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const PRODUCT_IDS = {
    DIGITAL: "gid://shopify/Product/8121253003343",
    PHYSICAL: "gid://shopify/Product/8094955569231",
    BUNDLE: "gid://shopify/Product/8121252020303",
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        console.log('Fetching products from Shopify...');
        console.log('Domain:', process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN);
        const fetchedProducts = await getProducts();
        console.log('Products fetched:', fetchedProducts.length);

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
      } catch (error) {
        console.error("Failed to fetch products", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
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
    <div className="bg-slate-50 text-slate-800 font-sans selection:bg-[#041f50]/20 min-h-screen flex flex-col">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-auto h-10 flex items-center">
                {/* Changed logo to be rectangular/responsive */}
                <Image
                  src="/logo.png"
                  alt="PsychAssessment Mastery Logo"
                  width={180}
                  height={50}
                  className="object-contain h-10 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex space-x-8 items-center">
                <a href="/" className="text-[#041f50] font-bold hover:text-[#052647] transition">
                  Home
                </a>
                <a href="#problem" className="text-[#041f50] font-bold hover:text-[#052647] transition">
                  The Gap
                </a>
                <a href="#soap-architect" className="text-[#041f50] font-bold hover:text-[#052647] transition flex items-center gap-1">
                  SOAP Architect™ <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
                </a>
                <a href="#pricing" className="text-[#041f50] font-bold hover:text-[#052647] transition">
                  Pricing
                </a>
                <a href="#contact" className="text-[#041f50] font-bold hover:text-[#052647] transition">
                  Contact
                </a>
              </div>
              {/* ThemeToggle Removed */}
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="hidden md:block bg-[#041f50] text-white px-6 py-2 rounded-full font-bold hover:bg-[#052647] transition shadow-lg transform hover:-translate-y-0.5"
              >
                Start Practicing
              </button>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-[#041f50] p-2 hover:bg-slate-100 rounded-lg transition"
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
              <a
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[#041f50] font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition"
              >
                Home
              </a>
              <a
                href="#problem"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[#041f50] font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition"
              >
                The Gap
              </a>
              <a
                href="#soap-architect"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-[#041f50] font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition"
              >
                SOAP Architect™ <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[#041f50] font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition"
              >
                Pricing
              </a>
              <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[#041f50] font-bold py-3 px-4 hover:bg-slate-50 rounded-xl transition"
              >
                Contact
              </a>
              <button
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-[#041f50] text-white px-6 py-3.5 mt-2 rounded-xl font-bold hover:bg-[#052647] transition shadow-md"
              >
                Start Practicing
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-white z-0"></div>

        {/* Subtle nice background element */}
        <div className="absolute top-0 right-0 w-200 h-200 bg-[#041f50]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-60"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left mb-12 lg:mb-0 relative z-30"
            >
              <div className="inline-flex items-center px-4 py-1.5 bg-[#041f50]/10 text-[#041f50] rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-[#041f50]/20">
                <PenTool className="w-3 h-3 mr-2" /> Simple English · ESL Friendly
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-slate-900 tracking-tight">
                Pysch Assessment<br />
                <span className="text-[#041f50]">the  Simple Guide.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Beginner-friendly mental health resources written in clear, plain English — ideal for nursing students, PMHNP learners, psych techs, and ESL users. The complete step-by-step guide for learning psychiatric assessment with confidence —
even if you’re brand new.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#pricing" className="bg-[#041f50] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#052647] transition shadow-xl flex items-center justify-center gap-2">
                  Get the Mastery Bundle →
                </a>
                <a href="#soap-architect" className="bg-white text-[#041f50] border-2 border-[#041f50] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#041f50] hover:text-white transition flex items-center justify-center shadow-sm gap-2">
                  <SparklesIcon className="w-5 h-5" /> Try SOAP Architect™
                </a>
              </div>
            </motion.div>

            {/* Video Hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center items-center relative z-20 py-8"
            >
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(4,31,80,0.3)] border-[6px] border-white ring-1 ring-slate-200 bg-white transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover bg-white"
                  style={{ objectPosition: 'center' }}
                  poster="/pam-book-mockup.png" // Fallback
                >
                  <source src="/HERO-splash.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Gradient Fade at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent z-10"></div>
      </header>

      {/* What We Do Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#041f50] font-bold tracking-widest uppercase text-xs mb-3 block">Our Mission</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">What We Do</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Psychiatric Assessment Mastery™ creates clear, practical, and easy-to-understand psychiatric education tools.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {[
              { label: "Mental Status Exams", icon: "🧠" },
              { label: "SOAP Notes", icon: "📋" },
              { label: "Psych Evaluations", icon: "🔍" },
              { label: "Differential Diagnosis", icon: "⚕️" },
              { label: "PMHNP Training", icon: "🎓" },
              { label: "Case Studies", icon: "📚" },
              { label: "Psych Med Cheat Sheets", icon: "💊" },
              { label: "Documentation Phrases", icon: "✍️" },
              { label: "Risk Assessment Tools", icon: "🛡️" },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
                <span className="text-xl">{icon}</span>
                <span className="font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm">
            All written in simple, 12th-grade English so you learn faster and feel more confident in clinical settings.
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#041f50]/10 rounded-3xl transform -rotate-2"></div>
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
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">The "Textbook Gap" is Real.</h2>
              <p className="text-base font-semibold text-[#041f50] mb-4">Simple English. 12th Grade Reading Level. ESL Friendly.</p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                You know the theory. You've memorized the pharmacology. But when you walk into that exam room, do you freeze? We call it the "Textbook Gap".
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Preceptor Red Flags</h3>
                    <p className="text-slate-600">A guide to common mistakes preceptors hate (and how to avoid them).</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#041f50]/10 text-[#041f50] rounded-lg">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Phrase Banks</h3>
                    <p className="text-slate-600">Exact scripts for trauma, substance use, and redirecting chatty patients.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-200 text-slate-700 rounded-lg">
                    <Flag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Step-by-Step Teaching</h3>
                    <p className="text-slate-600">"I break down complex concepts into bite-sized pieces."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOAP Architect™ Teaser */}
      <section id="soap-architect" className="py-20 bg-[#041f50] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-blue-200 rounded-full text-xs font-bold tracking-widest uppercase mb-5">
                <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">New</span>
                AI Documentation Tool
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">SOAP Architect™</h2>
              <p className="text-blue-200 text-lg mb-3 font-semibold">Structured Psychiatric Documentation. Instantly Organized.</p>
              <p className="text-blue-300 mb-8 leading-relaxed">
                Paste raw psychiatric notes. Generate a structured, safety-aware SOAP note using the Psychiatric Assessment Mastery™ framework.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Applies structured psychiatric SOAP format.",
                  "Highlights commonly documented safety domains.",
                  "Enhances clarity of MSE terminology.",
                  "Preserves your clinician judgment and voice.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-blue-100">
                    <CheckCircle2 className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/soap-architect"
                  className="inline-block bg-white text-[#041f50] px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition shadow-xl text-center"
                >
                  Access SOAP Architect™ →
                </a>
                <span className="flex items-center text-blue-300 text-xs px-4">No auto-diagnosis. Structural support only.</span>
              </div>
            </div>
            <div className="hidden lg:block">
              {/* Before/After preview */}
              <div className="space-y-4">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Input — Raw Notes</span>
                  <p className="mt-2 text-blue-100 font-mono text-sm italic">&ldquo;45yo male. Sad 2 weeks. Poor sleep. Denies SI. Disheveled. Slow speech.&rdquo;</p>
                </div>
                <div className="text-center text-white/40 text-2xl">↓</div>
                <div className="bg-white rounded-2xl p-5 shadow-xl">
                  <span className="text-xs font-bold text-[#041f50] uppercase tracking-wider">Output — Structured SOAP</span>
                  <div className="mt-2 text-slate-700 text-xs space-y-1.5">
                    <p><strong className="text-[#041f50]">Subjective:</strong> 45-year-old male, 2-week depressed mood, insomnia, decreased appetite. Denies SI.</p>
                    <p><strong className="text-[#041f50]">Objective (MSE):</strong> Disheveled. Speech slowed. Mood: &ldquo;Sad.&rdquo; Affect: Constricted.</p>
                    <p><strong className="text-[#041f50]">Assessment:</strong> Depressive episode; safety denied; monitoring indicated.</p>
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
            <span className="text-[#041f50] font-bold tracking-widest uppercase text-xs mb-3 block">Student Love</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Why Students Love Us</h2>
            <p className="text-slate-600 text-lg">Built for real learning — simple, practical, and confidence-building.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                emoji: "💡",
                title: "Clear",
                desc: "We remove the jargon and make every psychiatric concept easy to understand. If we use a clinical word, we define it.",
                tag: "Plain English",
              },
              {
                emoji: "📋",
                title: "Practical",
                desc: "Our templates are copy-and-paste friendly, perfect for documentation. Every topic includes examples, scripts, and scenarios.",
                tag: "Ready to Use",
              },
              {
                emoji: "🌍",
                title: "Beginner-Friendly",
                desc: "Ideal for new nurses, NP students, and learners whose first language is not English. No slang. No complex metaphors.",
                tag: "ESL Friendly",
              },
            ].map(({ emoji, title, desc, tag }) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={title}
                className="bg-slate-50 p-10 rounded-3xl border border-slate-100 hover:border-[#041f50] hover:shadow-xl transition duration-300 text-center"
              >
                <div className="text-5xl mb-5">{emoji}</div>
                <div className="inline-block px-3 py-1 bg-[#041f50]/10 text-[#041f50] rounded-full text-xs font-bold mb-4 tracking-widest uppercase">{tag}</div>
                <h3 className="font-extrabold text-2xl mb-4 text-slate-900">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Visual Break */}
          <div className="my-16 md:my-24 relative min-h-[400px] md:h-96 rounded-3xl overflow-hidden shadow-2xl">
            <Image src="/psych-cover.png" alt="Workbook Spread" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent flex items-center p-8 py-16 md:p-16">
              <div className="max-w-lg">
                <h3 className="text-white text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Stop Guessing.<br />Start Assessing.</h3>
                <p className="text-slate-200 mb-8 text-lg">Join thousands of students who have mastered their clinical rotations with PAM.</p>
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#041f50] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#052647] transition shadow-lg transform hover:-translate-y-1">Get Your Copy</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Funnel */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Get Clinical Ready Today</h2>
            <p className="text-slate-600 mt-4">Choose the format that fits your study style.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Bundle - Featured */}
            <div className="lg:col-span-1 lg:scale-105 z-10 border-2 border-amber-500 rounded-2xl p-8 bg-white shadow-2xl relative flex flex-col">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">Most Popular</div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Mastery Bundle</h3>
                <p className="text-sm text-slate-500">Physical + Digital + AI</p>
              </div>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-slate-900">$49.99</span>
                <span className="ml-2 text-slate-400">USD</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>The Physical Workbook</strong> — shipped directly to you</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Digital PDF Edition</strong> — instant access on all devices</span></li>
                <li className="flex items-start border border-amber-200 bg-amber-50 rounded-lg px-3 py-2"><CheckCircle2 className="text-amber-600 mr-2 w-5 h-5 flex-shrink-0 mt-0.5" /> <span className="text-slate-700 text-sm"><strong>1-Year Access to SOAP Architect™</strong> <span className="ml-1 text-amber-700 text-[10px] font-bold uppercase tracking-wider">New!</span></span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Script Doctor AI Tool</strong> — instant clinical scripts</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>5-Page Cheat Sheet</strong> (Lead Magnet, included free)</span></li>
              </ul>
              <button
                onClick={() => handleBuy('BUNDLE')}
                disabled={loadingProduct === 'BUNDLE'}
                className="w-full bg-[#041f50] hover:bg-[#052647] text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                {loadingProduct === 'BUNDLE' ? <Loader2 className="animate-spin" /> : <Package />}
                Get The Bundle
              </button>
            </div>

            {/* Physical Workbook */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-xl relative flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Physical Workbook</h3>
                <p className="text-sm text-slate-500">Paperback (Shipped)</p>
              </div>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-slate-900">$17.99</span>
                <span className="ml-2 text-slate-400">USD</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Physical Paperback Workbook</strong> shipped right to your door</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Durable Write-In Worksheets</strong> for your daily clinical notes</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Quick-Reference Desk Guide</strong> for fast clinical decisions</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Free Standard Shipping</strong> included with your purchase</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Perfect for Offline Use</strong> during any clinical encounter</span></li>
              </ul>
              <button
                onClick={() => handleBuy('PHYSICAL')}
                disabled={loadingProduct === 'PHYSICAL'}
                className="w-full bg-[#041f50] text-white font-bold py-4 rounded-xl hover:bg-[#052647] transition shadow-lg flex items-center justify-center gap-2"
              >
                {loadingProduct === 'PHYSICAL' ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
                Ship to Me
              </button>
            </div>

            {/* Digital Edition */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-xl relative flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Digital Edition</h3>
                <p className="text-sm text-slate-500">PDF + AI Tool Access</p>
              </div>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-slate-900">$17.99</span>
                <span className="ml-2 text-slate-400">USD</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Instant PDF Download</strong> compatible with any device</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Complete Assessment Framework</strong> for quick reference</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Fully Searchable &amp; Printable</strong> PDF for any device</span></li>
                <li className="flex items-start border border-blue-200 bg-blue-50 rounded-lg px-3 py-2"><CheckCircle2 className="text-blue-600 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>SOAP Architect™ AI Tool Access</strong> — 5 structured notes included</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-[#041f50] mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>5-Page Cheat Sheet</strong> (Bonus, included free)</span></li>
              </ul>
              <button
                onClick={() => handleBuy('DIGITAL')}
                disabled={loadingProduct === 'DIGITAL'}
                className="w-full bg-[#041f50] text-white font-bold py-4 rounded-xl hover:bg-[#052647] transition flex items-center justify-center gap-2 shadow-lg"
              >
                {loadingProduct === 'DIGITAL' ? <Loader2 className="animate-spin" /> : <Download />}
                Download Now
              </button>
            </div>
          </div>

          <LeadMagnet />

        </div>
      </section>

      <footer id="contact" className="bg-slate-900 text-slate-400 py-16 text-center border-t border-slate-800 mt-auto">
        <p className="text-slate-300 font-semibold mb-2">Psychiatric Assessment Mastery™</p>
        <p className="mb-6">&copy; 2026 Tonia Ojomo. All Rights Reserved.</p>
        <p className="max-w-2xl mx-auto text-xs leading-relaxed text-slate-600 px-6">
          Educational content only. Not a substitute for clinical supervision or professional judgment. SOAP Architect™ provides structural support only and does not offer medical advice or diagnosis.
        </p>
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
