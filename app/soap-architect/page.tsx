"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { SoapArchitect } from "@/components/GeminiTools";

// Import centralized content
import siteContent from "@/content/site-content.json";

const content = siteContent.soapArchitectPage;
const global = siteContent.global;

export default function SoapArchitectPage() {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col">

      {/* Minimal Nav */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-[#041f50] font-bold hover:opacity-80 transition">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Link href="/" className="text-sm font-bold text-slate-500 tracking-widest uppercase hover:text-[#041f50] transition">
              {global.brandName}
            </Link>
            <Link
              href="/#pricing"
              className="bg-[#041f50] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#052647] transition shadow-md"
            >
              Get the Bundle
            </Link>
          </div>
        </div>
      </nav>

      {/* A. Hero Sub-Section */}
      <header className="pt-32 pb-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#041f50]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-60 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <span className="bg-amber-400 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
              {content.hero.badge}
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-5 tracking-tight leading-tight">
              {content.hero.headline}
            </h1>
            <p className="text-2xl text-[#041f50] font-semibold mb-6">
              {content.hero.subheadline}
            </p>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              {content.hero.valueProp}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold mb-8 border border-slate-200">
              {content.hero.authTrigger}
            </div>
            <div>
              <a
                href="#soap-tool"
                className="inline-block bg-[#041f50] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#052647] transition shadow-xl transform hover:-translate-y-0.5"
              >
                {content.hero.ctaLabel}
              </a>
              <p className="mt-3 text-sm text-slate-400 italic">
                {content.hero.disclaimer}
              </p>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </header>

      {/* B. "The Real Problem" Block */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-red-50 border border-red-100 rounded-3xl p-10"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              {content.problemBlock.headline}
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4 mb-8">
              {content.problemBlock.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-600 italic border-l-4 border-red-400 pl-4 text-base">
              {content.problemBlock.blockquote}
            </p>
          </motion.div>
        </div>
      </section>

      {/* C & D. What It Does + How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* C. What It Does */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                {content.whatItDoes.headline}
              </h2>
              <ul className="space-y-4 mb-8">
                {content.whatItDoes.features.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-[#041f50] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-blue-800 text-sm leading-relaxed">
                <strong>Important:</strong> {content.whatItDoes.importantNote}
              </div>
            </motion.div>

            {/* D. How It Works */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900 mb-6">{content.howItWorks.headline}</h2>
              <div className="space-y-6">
                {content.howItWorks.steps.map(({ step, label, desc }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#041f50] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{label}</p>
                      <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* E. Before & After Demo */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            {content.beforeAfterDemo.headline}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-100 rounded-2xl p-8 border border-slate-200"
            >
              <span className="inline-block mb-5 px-3 py-1 bg-slate-300 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">
                {content.beforeAfterDemo.input.label}
              </span>
              <p className="text-slate-700 font-mono text-sm leading-relaxed italic bg-white rounded-xl p-5 border border-slate-200">
                {content.beforeAfterDemo.input.text}
              </p>
            </motion.div>
            {/* Output */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-8 border-2 border-[#041f50] shadow-xl"
            >
              <span className="inline-block mb-5 px-3 py-1 bg-[#041f50] text-white rounded-full text-xs font-bold uppercase tracking-wider">
                {content.beforeAfterDemo.output.label}
              </span>
              <div className="text-sm text-slate-700 space-y-4 leading-relaxed">
                <div>
                  <p className="font-bold text-[#041f50] mb-1">Subjective:</p>
                  <p>{content.beforeAfterDemo.output.subjective}</p>
                </div>
                <div>
                  <p className="font-bold text-[#041f50] mb-1">Objective (MSE):</p>
                  <ul className="ml-4 space-y-1">
                    {content.beforeAfterDemo.output.objectiveMSE.map((mse) => (
                      <li key={mse.label}><strong>{mse.label}:</strong> {mse.value}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-[#041f50] mb-1">Assessment:</p>
                  <p>{content.beforeAfterDemo.output.assessment}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Tool */}
      <section id="soap-tool" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">{content.interactiveTool.headline}</h2>
            <p className="text-slate-500 mt-2 text-lg">
              {content.interactiveTool.subheadline}
            </p>
          </div>
          <SoapArchitect />
          <p className="text-center text-xs text-slate-400 mt-4 italic">
            {content.interactiveTool.disclaimer}
          </p>
        </div>
      </section>

      {/* CTA to Pricing */}
      <section className="py-20 bg-[#041f50] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            {content.ctaBanner.headline}
          </h2>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            {content.ctaBanner.description}
          </p>
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 bg-white text-[#041f50] px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-xl transform hover:-translate-y-0.5"
          >
            {content.ctaBanner.ctaLabel} <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-blue-300 text-sm">{content.ctaBanner.priceNote}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center border-t border-slate-800 mt-auto">
        <p className="text-slate-300 font-semibold mb-2">{global.brandName}</p>
        <p className="mb-4">{global.footerCopyright}</p>
        <p className="max-w-2xl mx-auto text-xs leading-relaxed text-slate-600 px-6">
          {global.footerDisclaimer}
        </p>
      </footer>

    </div>
  );
}
