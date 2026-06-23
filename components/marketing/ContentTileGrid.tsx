"use client";

import { type LucideIcon } from "lucide-react";
import {
  Brain,
  ClipboardList,
  Search,
  Stethoscope,
  ShieldAlert,
  BookOpen,
  MessageSquareQuote,
  Pill,
  PenLine,
  Languages,
  FlagTriangleRight,
  Workflow,
  FileText,
  ClipboardCheck,
  ScrollText,
  BookOpenCheck,
  Volume2,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { ScrollReveal } from "./ScrollReveal";
import { Badge } from "@/components/ui/badge";

export const ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  ClipboardList,
  Search,
  Stethoscope,
  ShieldAlert,
  BookOpen,
  MessageSquareQuote,
  Pill,
  PenLine,
  Languages,
  FlagTriangleRight,
  Workflow,
  FileText,
  ClipboardCheck,
  ScrollText,
  BookOpenCheck,
  Volume2,
  ListChecks,
  Sparkles,
};

interface ContentTile {
  icon: string;
  label: string;
  description: string;
  tag: string;
}

interface ContentTileGridProps {
  items: ContentTile[];
  /** Layout — `3col` (default) or `2col`. */
  layout?: "3col" | "2col";
}

/**
 * Renders a responsive grid of ContentTile cards.
 * Each card has a lucide icon, a tag pill, a title, and a description.
 * Used on content listing surfaces.
 */
export function ContentTileGrid({ items, layout = "3col" }: ContentTileGridProps) {
  const gridClass =
    layout === "3col"
      ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      : "grid md:grid-cols-2 gap-8 max-w-4xl mx-auto";

  return (
    <div className={gridClass}>
      {items.map((item, i) => {
        const Icon = ICON_MAP[item.icon] ?? Sparkles;
        return (
          <ScrollReveal
            key={item.label}
            direction="up"
            delay={i * 0.07}
            duration={0.55}
          >
            <article className="group relative bg-white rounded-3xl border border-slate-200 p-8 h-full hover:border-psych-purple hover:shadow-xl hover:shadow-psych-purple/10 transition-all duration-300 cursor-default">
              {/* Subtle gradient halo on hover */}
              <div
                className="absolute -inset-px rounded-3xl bg-gradient-psych opacity-0 group-hover:opacity-10 transition-opacity -z-10"
                aria-hidden="true"
              />
              <div className="flex items-center justify-center size-14 rounded-2xl bg-psych-navy/5 text-psych-purple mb-5 group-hover:bg-psych-purple/10 group-hover:text-psych-purple transition-colors">
                <Icon className="size-7" />
              </div>
              <Badge variant="soft" className="mb-4">
                {item.tag}
              </Badge>
              <h3 className="font-extrabold text-2xl mb-3 text-psych-navy tracking-tight">
                {item.label}
              </h3>
              <p className="text-slate-600 leading-relaxed text-base">
                {item.description}
              </p>
            </article>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
