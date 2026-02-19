
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createCheckout, getProducts } from "@/lib/shopify";
import { ScriptDoctor, SoapArchitect } from "@/components/GeminiTools";
import { LeadMagnet } from "@/components/LeadMagnet";
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
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [variantIds, setVariantIds] = useState<{ [key: string]: string }>({});

  const PRODUCT_IDS = {
    DIGITAL: "gid://shopify/Product/8121253003343",
    PHYSICAL: "gid://shopify/Product/8094955569231",
    BUNDLE: "gid://shopify/Product/8121252020303",
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);

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
    <div className="bg-slate-50 text-slate-800 font-sans selection:bg-teal-200 min-h-screen flex flex-col">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 transaction-colors duration-500">
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
                <a href="#clinical-ai" className="text-teal-700 font-bold hover:text-teal-900 transition flex items-center gap-1">
                  <SparklesIcon className="w-4 h-4" /> AI Tools
                </a>
                <a href="#problem" className="text-slate-600 hover:text-teal-600 font-medium transition">Why This Workbook?</a>
                <a href="#pricing" className="text-slate-600 hover:text-teal-600 font-medium transition">Pricing</a>
              </div>
              {/* ThemeToggle Removed */}
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="hidden md:block bg-teal-600 text-white px-6 py-2 rounded-full font-bold hover:bg-teal-700 transition shadow-lg transform hover:-translate-y-0.5"
              >
                Start Practicing
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-white z-0"></div>

        {/* Subtle nice background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-60"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left mb-12 lg:mb-0 relative z-30"
            >
              <div className="inline-flex items-center px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-teal-100">
                <PenTool className="w-3 h-3 mr-2" /> Interactive Workbook Edition
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 text-slate-900 tracking-tight">
                Master Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Clinical Assessment.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 font-serif leading-relaxed max-w-lg mx-auto lg:mx-0">
                The "Write-In" Clinical Companion for PMHNP Students. Includes <span className="text-teal-700 font-bold inline-flex items-center gap-1"><SparklesIcon className="w-4 h-4" /> AI Clinical Tools</span> to generate scripts and structure notes instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#clinical-ai" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-xl flex items-center justify-center gap-2 border border-transparent">
                  Try AI Tools <SparklesIcon className="w-5 h-5" />
                </a>
                <a href="#pricing" className="bg-white text-teal-700 border-2 border-teal-100 px-8 py-4 rounded-xl font-bold text-lg hover:border-teal-600 hover:text-teal-600 transition flex items-center justify-center shadow-sm">
                  Get the Workbook
                </a>
              </div>
            </motion.div>

            {/* Video Hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center items-center relative z-20"
            >
              <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto bg-white"
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

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-teal-200 rounded-3xl transform -rotate-2"></div>
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
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">The "Textbook Gap" is Real.</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                You know the theory. You've memorized the pharmacology. But when you walk into that exam room, do you freeze? We call it the "Textbook Gap".
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Imposter Syndrome</h3>
                    <p className="text-slate-600">Feeling like you're "faking it" because you lack structured interview techniques.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Documentation Dread</h3>
                    <p className="text-slate-600">Staring at a blank screen, terrified of missing critical details in your notes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-200 text-slate-700 rounded-lg">
                    <Flag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Safety Blindspots</h3>
                    <p className="text-slate-600">Worrying you'll miss a subtle sign of suicide risk or mania.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Section 1: Clinical Scripting */}
      <section id="clinical-ai" className="py-24 bg-white relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-bold tracking-widest uppercase text-sm mb-2 block">AI Clinical Assistant</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Never Be at a Loss for Words</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Instant, empathetic scripts for difficult clinical encounters.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">The Script Doctor</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Whether it's de-escalating an angry patient or asking sensitive questions about trauma, The Script Doctor provides you with the exact words to use (and explains the clinical reasoning behind them).
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-2" /> <span>Trauma-informed phrasing</span></li>
                <li className="flex items-center text-slate-700"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-2" /> <span>De-escalation techniques</span></li>
                <li className="flex items-center text-slate-700"><CheckCircle2 className="w-5 h-5 text-teal-500 mr-2" /> <span>Motivational Interviewing cues</span></li>
              </ul>
            </div>
            <div>
              <ScriptDoctor />
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Section 2: Documentation */}
      <section className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="lg:order-2">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">The SOAP Architect</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Don't let documentation burnout steal your evening. Paste your rough notes, brain dump, or dictation snippets, and watch them transform into a structured, professional note instantly.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" /> <span>Standard Psychiatric Assessment format</span></li>
                <li className="flex items-center text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" /> <span>Identifies missing safety risks</span></li>
                <li className="flex items-center text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-500 mr-2" /> <span>MSE vocabulary enhancement</span></li>
              </ul>
            </div>
            <div className="lg:order-1">
              <SoapArchitect />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Inside the Workbook</h2>
            <p className="text-slate-600 text-lg">More than just reading. It's a toolkit you'll use every single day.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Quote, title: "Phrase Banks", desc: "Exact scripts for trauma, substance use, and redirecting chatty patients." },
              { icon: Flag, title: "Preceptor Red Flags", desc: "A guide to common mistakes preceptors hate (and how to avoid them)." },
              { icon: PenTool, title: "SOAP Templates", desc: "Fill-in-the-blank frameworks for HPI, MSE, and Assessment sections." },
              { icon: CheckSquare, title: "Capstone Toolkit", desc: "The 'One-Page Workflow' and self-checklists." }
            ].map((feature, i) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={i}
                className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-teal-400 transition duration-300"
              >
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-teal-600 mb-6 shadow-sm">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Visual Break */}
          <div className="mt-24 relative h-64 md:h-96 rounded-3xl overflow-hidden shadow-2xl">
            <Image src="/psych-cover.png" alt="Workbook Spread" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent flex items-center p-8 md:p-16">
              <div className="max-w-lg">
                <h3 className="text-white text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Stop Guessing.<br />Start Assessing.</h3>
                <p className="text-slate-200 mb-8 text-lg">Join thousands of students who have mastered their clinical rotations with PAM.</p>
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-teal-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-teal-600 transition shadow-lg transform hover:-translate-y-1">Get Your Copy</button>
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
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Mastery Bundle</h3>
                <p className="text-sm text-slate-500">Physical + Digital + Bonus</p>
              </div>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-slate-900">$49.99</span>
                <span className="ml-2 text-slate-400">USD</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start"><CheckCircle2 className="text-amber-500 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm"><strong>Everything</strong> in Physical & Digital</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-amber-500 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Instant Access while you wait</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-amber-500 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Save vs buying separately</span></li>
              </ul>
              <button
                onClick={() => handleBuy('BUNDLE')}
                disabled={loadingProduct === 'BUNDLE'}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-1"
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
                <span className="text-4xl font-bold text-slate-900">$29.99</span>
                <span className="ml-2 text-slate-400">USD</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start"><CheckCircle2 className="text-teal-500 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Write-in Worksheets</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-teal-500 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Desk Reference</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-teal-500 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Standard Shipping</span></li>
              </ul>
              <button
                onClick={() => handleBuy('PHYSICAL')}
                disabled={loadingProduct === 'PHYSICAL'}
                className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 transition shadow-lg flex items-center justify-center gap-2"
              >
                {loadingProduct === 'PHYSICAL' ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
                Ship to Me
              </button>
            </div>

            {/* Digital Edition */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-xl relative flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Digital Edition</h3>
                <p className="text-sm text-slate-500">Kindle / PDF / eBook</p>
              </div>
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold text-slate-900">$9.99</span>
                <span className="ml-2 text-slate-400">USD</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start"><CheckCircle2 className="text-slate-400 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Instant Download</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-slate-400 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Searchable Text</span></li>
                <li className="flex items-start"><CheckCircle2 className="text-slate-400 mr-2 w-5 h-5 flex-shrink-0" /> <span className="text-slate-700 text-sm">Printable Pages</span></li>
              </ul>
              <button
                onClick={() => handleBuy('DIGITAL')}
                disabled={loadingProduct === 'DIGITAL'}
                className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                {loadingProduct === 'DIGITAL' ? <Loader2 className="animate-spin" /> : <Download />}
                Download Now
              </button>
            </div>
          </div>

          <LeadMagnet />

        </div>
      </section>

      <footer className="bg-slate-900 text-slate-500 py-12 text-center border-t border-slate-800 mt-auto">
        <p>&copy; 2026 Tonia Ojomo. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}
