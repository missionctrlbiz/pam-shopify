"use client";

import Link from "next/link";
import { Facebook, Instagram, Music, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { MotionGrid } from "./MotionGrid";
import { ViewTransitionLink } from "./ViewTransitionLink";

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
}

interface FooterProps {
  brandName: string;
  copyright: string;
  disclaimer: string;
  socialLinks?: SocialLinks;
  /** Optional navigation links rendered in the footer card. */
  footerNav?: { label: string; href: string }[];
  className?: string;
}

/**
 * Marketing footer with **motion-grid animated background** and
 * glassmorphic content card per the brief.
 *
 * Layout:
 * - Outer wrapper: dark psych-navy with animated dot lattice (MotionGrid)
 *   + radial gradient orbs for ambient lighting
 * - Inner card: frosted glass surface holding brand, nav, socials,
 *   copyright, disclaimer
 * - Bottom strip: small Admin Login pill
 */
export function Footer({
  brandName,
  copyright,
  disclaimer,
  socialLinks,
  footerNav,
  className,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const renderedCopyright = copyright.includes(String(currentYear))
    ? copyright
    : copyright.replace(/\d{4}/, String(currentYear));

  return (
    <footer
      id="contact"
      className={cn(
        "relative bg-psych-navy text-slate-300 overflow-hidden",
        className
      )}
    >
      {/* Animated motion-grid backdrop */}
      <MotionGrid variant="light" fade />

      {/* Ambient colour orbs */}
      <div
        className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-psych-purple/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full bg-psych-blue/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Glassmorphic content card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-dark rounded-3xl px-8 py-12 md:px-12 md:py-16 text-center"
        >
          {/* Brand */}
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
            {brandName}
          </h2>
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-8">
            Practice-ready clinical learning
          </p>

          {/* Footer nav (if provided) */}
          {footerNav && footerNav.length > 0 && (
            <nav
              aria-label="Footer"
              className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-10"
            >
              {footerNav.map((item) => (
                <ViewTransitionLink
                  key={item.label}
                  href={item.href}
                  className="text-blue-100 hover:text-white font-semibold text-sm transition"
                >
                  {item.label}
                </ViewTransitionLink>
              ))}
            </nav>
          )}

          {/* Socials */}
          {socialLinks && (
            <div className="flex justify-center gap-3 mb-10">
              {socialLinks.facebook && (
                <SocialIcon href={socialLinks.facebook} label="Facebook">
                  <Facebook className="w-5 h-5" />
                </SocialIcon>
              )}
              {socialLinks.instagram && (
                <SocialIcon href={socialLinks.instagram} label="Instagram">
                  <Instagram className="w-5 h-5" />
                </SocialIcon>
              )}
              {socialLinks.tiktok && (
                <SocialIcon href={socialLinks.tiktok} label="TikTok">
                  <Music className="w-5 h-5" />
                </SocialIcon>
              )}
              {socialLinks.linkedin && (
                <SocialIcon href={socialLinks.linkedin} label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </SocialIcon>
              )}
            </div>
          )}

          {/* Copyright */}
          <p className="text-blue-100 text-sm mb-4">{renderedCopyright}</p>

          {/* Disclaimer */}
          <p className="max-w-2xl mx-auto text-xs leading-relaxed text-blue-300/80">
            {disclaimer}
          </p>
        </motion.div>

        {/* Admin Login pill — kept subtle, low-key placement per original design */}
        <div className="flex justify-center mt-10">
          <Link
            href="/admin/login"
            className="text-xs text-blue-300/60 hover:text-blue-200 transition px-4 py-1.5 rounded-full border border-white/10 hover:border-white/30"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

interface SocialIconProps {
  href: string;
  label: string;
  children: React.ReactNode;
}

function SocialIcon({ href, label, children }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="size-11 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm flex items-center justify-center text-blue-100 hover:text-white hover:bg-psych-purple/30 hover:border-psych-purple/60 transition-all hover:scale-110"
    >
      {children}
    </a>
  );
}
