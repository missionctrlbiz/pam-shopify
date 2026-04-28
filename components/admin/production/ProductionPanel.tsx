/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionIcon } from "motion-icons-react";
import {
  LayoutList,
  Upload,
  Zap,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Archive,
  BarChart3,
  FileUp,
  Download,
  Layers,
  CheckCircle2,
  Send,
  RefreshCw,
} from "lucide-react";
import type {
  CalendarEntryRow,
  CalendarListResponse,
  PublishStatus,
  Platform,
  GenerateCycleResponse,
} from "./types";
import { CalendarTable, STATUS_META, PLATFORM_META } from "./CalendarTable";
import DayPanel from "./DayPanel";
import { RenderJobsTab } from "./RenderJobsTab";

// ─── Same BRAND as AdminDashboardClient ───────────────────────────────────────
const BRAND = {
  red: "#ed415b",
  pink: "#ec5185",
  purple: "#af5ce9",
  navy: "#041f50",
  gradient: "linear-gradient(135deg, #ed415b, #ec5185, #af5ce9)",
  gradientSoft:
    "linear-gradient(135deg, rgba(237,65,91,0.1), rgba(236,81,133,0.1), rgba(175,92,233,0.1))",
  glow: "0 8px 24px rgba(175, 92, 233, 0.25)",
};

type ProdView = "overview" | "table" | "import" | "renderjobs";

const VIEWS: {
  key: ProdView;
  label: string;
  iconName: string;
  Icon: React.ElementType;
}[] = [
  {
    key: "overview",
    label: "Overview",
    iconName: "LayoutDashboard",
    Icon: BarChart3,
  },
  { key: "table", label: "Data Table", iconName: "Table", Icon: LayoutList },
  {
    key: "import",
    label: "Import & Generate",
    iconName: "Upload",
    Icon: Upload,
  },
  {
    key: "renderjobs",
    label: "Assets Queue",
    iconName: "Layers",
    Icon: Layers,
  },
];

// ─── Post Type Config Types ───────────────────────────────────────────────────

export type ToneOption =
  | "educational"
  | "professional"
  | "conversational"
  | "inspiring";
export type RatioOption = "1:1" | "4:5" | "9:16";
export type PostTypeKey = "CAROUSEL" | "TEXT_POST" | "EMAIL_LESSON";

export interface PostTypeSelection {
  enabled: boolean;
  count: number; // how many to generate (1-5)
  slides?: number; // carousel only (1-10)
  ratios?: RatioOption[]; // carousel only
  tone?: ToneOption;
  platform?: string; // caption only
}

export const POST_TYPE_CONFIGS: Record<
  PostTypeKey,
  {
    label: string;
    description: string;
    emoji: string;
    color: string;
    hasSlides?: boolean;
    hasRatios?: boolean;
    hasPlatform?: boolean;
  }
> = {
  CAROUSEL: {
    label: "Carousel",
    description: "Multi-slide visual post for Instagram & LinkedIn",
    emoji: "🖼️",
    color: "#af5ce9",
    hasSlides: true,
    hasRatios: true,
  },
  TEXT_POST: {
    label: "Text Post / Caption",
    description: "Engaging short post with hook and CTA",
    emoji: "✍️",
    color: "#E1306C",
    hasPlatform: true,
  },
  EMAIL_LESSON: {
    label: "Email Lesson",
    description: "Educational email for your subscriber list",
    emoji: "📧",
    color: "#3B82F6",
  },
};

export const TONES: { key: ToneOption; label: string }[] = [
  { key: "educational", label: "Educational" },
  { key: "professional", label: "Professional" },
  { key: "conversational", label: "Conversational" },
  { key: "inspiring", label: "Inspiring" },
];

export const RATIO_OPTIONS: {
  key: RatioOption;
  label: string;
  desc: string;
}[] = [
  { key: "1:1", label: "1:1", desc: "Square" },
  { key: "4:5", label: "4:5", desc: "Portrait" },
  { key: "9:16", label: "9:16", desc: "Vertical" },
];

function defaultSelections(): Record<PostTypeKey, PostTypeSelection> {
  return {
    CAROUSEL: {
      enabled: false,
      count: 1,
      slides: 5,
      ratios: ["1:1", "4:5", "9:16"],
      tone: "educational",
    },
    TEXT_POST: {
      enabled: false,
      count: 1,
      tone: "conversational",
      platform: "IG",
    },
    EMAIL_LESSON: { enabled: false, count: 1, tone: "educational" },
  };
}

// ─── Stat Card (exact same pattern as admin overview) ─────────────────────────
function StatCard({
  label,
  value,
  color,
  sublabel,
  iconName,
}: {
  label: string;
  value: number | string;
  color: string;
  sublabel?: string;
  iconName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden flex-1 min-w-[140px]"
    >
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-bl-full opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent)`,
        }}
      />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-inner"
          style={{ background: `${color}22`, color }}
        >
          <MotionIcon name={iconName as any} size={20} animation="pulse" />
        </div>
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">
            {label}
          </p>
          <motion.p
            key={String(value)}
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: BRAND.navy }}
          >
            {value}
          </motion.p>
          {sublabel && (
            <p className="text-slate-400 text-xs mt-1 font-medium">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sub-tab pill bar ─────────────────────────────────────────────────────────
function ViewTabs({
  active,
  onChange,
}: {
  active: ProdView;
  onChange: (v: ProdView) => void;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 flex-wrap">
      {VIEWS.map((v) => {
        const isActive = v.key === active;
        return (
          <button
            key={v.key}
            onClick={() => onChange(v.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${isActive ? "text-white shadow-md" : "text-slate-500 hover:text-slate-700 hover:bg-white/60"}`}
            style={isActive ? { background: BRAND.gradient } : {}}
          >
            <v.Icon size={15} />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Generate Modal (Full Wizard) ─────────────────────────────────────────────
function GenerateModal({
  open,
  onClose,
  onConfirm,
  running,
  result,
  progress,
  onViewTable,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    selections: Record<PostTypeKey, PostTypeSelection>,
  ) => Promise<void>;
  running: boolean;
  result: GenerateCycleResponse | null;
  progress: number;
  onViewTable: () => void;
}) {
  const [selections, setSelections] =
    React.useState<Record<PostTypeKey, PostTypeSelection>>(defaultSelections);

  // Reset when modal opens
  React.useEffect(() => {
    if (open) setSelections(defaultSelections());
  }, [open]);

  const enabledCount = Object.values(selections).filter(
    (s) => s.enabled,
  ).length;
  const isComplete = result && !running;

  const toggleType = (key: PostTypeKey) => {
    setSelections((prev) => {
      const next = { ...prev };
      const wasEnabled = next[key].enabled;
      // Max 5 types check
      if (!wasEnabled && enabledCount >= 5) return prev;
      next[key] = { ...next[key], enabled: !wasEnabled };
      return next;
    });
  };

  const updateField = (key: PostTypeKey, field: string, value: unknown) => {
    setSelections((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const toggleRatio = (key: PostTypeKey, ratio: RatioOption) => {
    setSelections((prev) => {
      const current = prev[key].ratios ?? [];
      const next = current.includes(ratio)
        ? current.filter((r) => r !== ratio)
        : [...current, ratio];
      return { ...prev, [key]: { ...prev[key], ratios: next } };
    });
  };

  const canGenerate = enabledCount > 0 && !running;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 bg-black/50 backdrop-blur-sm z-50"
            style={{ width: "100vw", height: "100vh", minHeight: "100dvh" }}
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl z-[60] flex flex-col overflow-hidden border border-slate-100 mx-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-7 pb-5 border-b border-slate-100">
              <div>
                <h3
                  className="text-xl font-extrabold tracking-tight mb-1"
                  style={{ color: BRAND.navy }}
                >
                  {isComplete ? "✅ Content Generated" : "Generate Content"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {isComplete
                    ? "Your content is ready in the Data Table. Review each post and approve when ready to render."
                    : `Choose up to 5 post formats — ${5 - enabledCount} remaining`}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label={running ? "Hide (generation continues in background)" : "Close"}
                title={running ? "Hide — generation continues in background" : "Close"}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition ml-4 flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-7 pt-5 space-y-4">
              {/* COMPLETION STATE */}
              {isComplete ? (
                <>
                  <div className="flex gap-3">
                    {(result!.generated ?? 0) > 0 && (
                      <div className="flex-1 bg-emerald-50 rounded-2xl p-5 text-center border border-emerald-100">
                        <p className="text-4xl font-extrabold text-emerald-600">
                          {result!.generated}
                        </p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2">
                          Posts Generated
                        </p>
                      </div>
                    )}
                    {(result!.failed ?? 0) > 0 && (
                      <div className="flex-1 bg-red-50 rounded-2xl p-5 text-center border border-red-100">
                        <p className="text-4xl font-extrabold text-red-500">
                          {result!.failed}
                        </p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-2">
                          Failed
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Your content is now in the Data Table with{" "}
                      <strong className="text-purple-600">DRAFT</strong> status. Review each post, make
                      edits as needed, and mark them as{" "}
                      <strong className="text-emerald-600">Approved</strong> when ready.
                    </p>
                  </div>

                  {/* Errors display */}
                  {result.errors && result.errors.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2">
                        Failure reasons ({result.errors.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {result.errors.map((err, i) => (
                          <div key={i} className="flex gap-2 p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                            <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-red-700 leading-tight font-medium">
                              {err}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        onViewTable();
                      }}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition"
                      style={{
                        background: BRAND.gradient,
                        boxShadow: BRAND.glow,
                      }}
                    >
                      View Data Table
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : running ? (
                /* PROGRESS STATE */
                <div className="space-y-5 py-4">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: `${BRAND.purple}15` }}
                    >
                      <Loader2
                        size={28}
                        className="animate-spin"
                        style={{ color: BRAND.purple }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700">
                        Generating your content…
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        You can close this window — generation will continue in the background and each card shows its own progress.
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 font-bold mb-2">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: BRAND.gradient }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* SELECTION STATE */
                <>
                  {/* Warning banner */}
                  <div className="flex gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                    <AlertCircle
                      size={14}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Approved and published entries will <strong>not</strong>{" "}
                      be overwritten. Only draft and empty slots are updated.
                    </p>
                  </div>

                  {/* Post type toggles */}
                  {(
                    Object.entries(POST_TYPE_CONFIGS) as [
                      PostTypeKey,
                      (typeof POST_TYPE_CONFIGS)[PostTypeKey],
                    ][]
                  ).map(([key, cfg]) => {
                    const sel = selections[key];
                    const isEnabled = sel.enabled;

                    return (
                      <div
                        key={key}
                        className={`rounded-2xl border-2 transition-all overflow-hidden ${
                          isEnabled
                            ? "border-[#af5ce9] shadow-lg"
                            : "border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {/* Toggle header row */}
                        <div
                          className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                            isEnabled
                              ? "bg-purple-50"
                              : "bg-white hover:bg-slate-50"
                          }`}
                          onClick={() => toggleType(key)}
                        >
                          <span className="text-2xl">{cfg.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm">
                              {cfg.label}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {cfg.description}
                            </p>
                          </div>

                          {/* Count input (only when enabled) */}
                          {isEnabled && (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <label className="text-xs text-slate-500 font-bold whitespace-nowrap">
                                Qty:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={sel.count}
                                onChange={(e) =>
                                  updateField(
                                    key,
                                    "count",
                                    Math.min(
                                      5,
                                      Math.max(
                                        1,
                                        parseInt(e.target.value) || 1,
                                      ),
                                    ),
                                  )
                                }
                                className="w-14 px-2 py-1.5 text-sm font-bold text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                                style={{ color: BRAND.navy }}
                              />
                            </div>
                          )}

                          {/* Toggle pill */}
                          <div
                            className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${
                              isEnabled
                                ? "justify-end"
                                : "justify-start bg-slate-200"
                            }`}
                            style={
                              isEnabled ? { background: BRAND.gradient } : {}
                            }
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>

                        {/* Expanded config */}
                        <AnimatePresence>
                          {isEnabled && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3 border-t border-purple-100">
                                <div className="pt-3" />

                                {/* Carousel-specific: slides + ratios */}
                                {cfg.hasSlides && (
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <label className="text-xs font-bold text-slate-500">
                                        Slides per carousel:
                                      </label>
                                      <input
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={sel.slides ?? 5}
                                        onChange={(e) =>
                                          updateField(
                                            key,
                                            "slides",
                                            Math.min(
                                              10,
                                              Math.max(
                                                2,
                                                parseInt(e.target.value) || 5,
                                              ),
                                            ),
                                          )
                                        }
                                        className="w-16 px-2 py-1.5 text-sm font-bold text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Aspect ratios (carousel) */}
                                {cfg.hasRatios && (
                                  <div>
                                    <p className="text-xs font-bold text-slate-500 mb-2">
                                      Output ratios (select all that apply):
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                      {RATIO_OPTIONS.map((r) => {
                                        const isSelected = (
                                          sel.ratios ?? []
                                        ).includes(r.key);
                                        return (
                                          <button
                                            key={r.key}
                                            onClick={() =>
                                              toggleRatio(key, r.key)
                                            }
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                              isSelected
                                                ? "border-[#af5ce9] bg-purple-50 text-[#af5ce9]"
                                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                                            }`}
                                          >
                                            {r.label}{" "}
                                            <span className="text-[10px] opacity-60">
                                              {r.desc}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Platform (captions) */}
                                {cfg.hasPlatform && (
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-slate-500">
                                      Primary platform:
                                    </label>
                                    <select
                                      value={sel.platform ?? "IG"}
                                      onChange={(e) =>
                                        updateField(
                                          key,
                                          "platform",
                                          e.target.value,
                                        )
                                      }
                                      className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300"
                                    >
                                      <option value="IG">Instagram</option>
                                      <option value="FB">Facebook</option>
                                      <option value="LINKEDIN">LinkedIn</option>
                                    </select>
                                  </div>
                                )}

                                {/* Tone selector (all types) */}
                                <div>
                                  <p className="text-xs font-bold text-slate-500 mb-1.5">
                                    Tone:
                                  </p>
                                  <div className="flex gap-2 flex-wrap">
                                    {TONES.map((t) => (
                                      <button
                                        key={t.key}
                                        onClick={() =>
                                          updateField(key, "tone", t.key)
                                        }
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                          sel.tone === t.key
                                            ? "border-[#af5ce9] bg-purple-50 text-[#af5ce9]"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                                        }`}
                                      >
                                        {t.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {enabledCount === 0 && (
                    <p className="text-center text-xs text-slate-400 py-2">
                      Toggle at least one post type above to enable generation
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!isComplete && !running && (
              <div className="flex justify-end gap-3 p-7 pt-5 border-t border-slate-100">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(selections)}
                  disabled={!canGenerate}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-40 shadow-lg transition"
                  style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
                >
                  <Zap size={14} />
                  Generate{" "}
                  {enabledCount > 0
                    ? `${enabledCount} Type${enabledCount !== 1 ? "s" : ""}`
                    : ""}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Reusable Confirm Modal ───────────────────────────────────────────────────
function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  desc,
  actionLabel,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  desc: string;
  actionLabel: string;
  loading?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 bg-black/40 z-50"
            style={{ width: "100vw", height: "100vh", minHeight: "100dvh" }}
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 z-[60] border border-slate-100 mx-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  className="text-xl font-extrabold tracking-tight mb-1"
                  style={{ color: BRAND.navy }}
                >
                  {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition ml-4"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 shadow-lg"
                style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {actionLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Import & Generate Tab ────────────────────────────────────────────────────
function ImportTab({
  onGenerate,
  generating,
  onDone,
}: {
  onGenerate: () => void;
  generating: boolean;
  onDone: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [fieldsCount, setFieldsCount] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Fetch field count on mount ──────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/seed-fields")
      .then((r) => r.json())
      .then((d: { count: number }) => setFieldsCount(d.count))
      .catch(() => setFieldsCount(0));
  }, []);

  useEffect(() => {
    const preventWindowDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };

    window.addEventListener("dragover", preventWindowDrop);
    window.addEventListener("drop", preventWindowDrop);

    return () => {
      window.removeEventListener("dragover", preventWindowDrop);
      window.removeEventListener("drop", preventWindowDrop);
    };
  }, []);

  const handleSeedFields = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const res = await fetch("/api/admin/seed-fields", { method: "POST" });
      const d = (await res.json()) as {
        upserted: number;
        total: number;
        errors?: string[];
      };
      if (res.ok) {
        setFieldsCount(d.total);
        setSeedMsg({
          ok: true,
          text: `✅ ${d.total} topics ready — you can now generate content.`,
        });
      } else {
        setSeedMsg({
          ok: false,
          text: "❌ Setup failed. Please try again.",
        });
      }
    } catch {
      setSeedMsg({ ok: false, text: "❌ Network error during setup." });
    }
    setSeeding(false);
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadMsg({ ok: false, text: "File must be a .csv" });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    const text = await file.text();
    try {
      const res = await fetch("/api/production/calendar/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMsg({
          ok: true,
          text: `✅ Imported ${data.imported} entries${data.skipped ? ` (${data.skipped} skipped)` : ""}`,
        });
        onDone();
      } else {
        setUploadMsg({
          ok: false,
          text: `❌ ${data.error || "Import failed"}`,
        });
      }
    } catch {
      setUploadMsg({ ok: false, text: "❌ Network error" });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Step 0: Load Topics ── */}
      <div
        className={`bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border relative overflow-hidden ${fieldsCount === 0 ? "border-red-200" : "border-slate-100"}`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-lg ${fieldsCount === 0 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}
            >
              {fieldsCount === 0 ? "⚠️" : "✅"}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-700">
                Topic Library
                {fieldsCount !== null && (
                  <span
                    className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${fieldsCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                  >
                    {fieldsCount} topics
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {fieldsCount === 0
                  ? "⚠️ No topics found yet. Load topics before generating content."
                  : "Topics are ready."}
              </p>
            </div>
          </div>
          <button
            onClick={handleSeedFields}
            disabled={seeding}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 shrink-0"
            style={{ background: fieldsCount === 0 ? "#EF4444" : "#10B981" }}
          >
            {seeding ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Loading…
              </>
            ) : fieldsCount === 0 ? (
              "⚡ Load Topics"
            ) : (
              "↺ Refresh Topics"
            )}
          </button>
        </div>
        {seedMsg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-medium ${seedMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          >
            {seedMsg.text}
          </div>
        )}
      </div>

      {/* Generate Content card */}
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-bl-full opacity-10"
          style={{
            background: `radial-gradient(circle at top right, ${BRAND.purple}, transparent)`,
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
            style={{ background: `${BRAND.purple}20`, color: BRAND.purple }}
          >
            <Zap size={28} />
          </div>
          <div className="flex-1">
            <h3
              className="text-xl font-extrabold tracking-tight mb-1"
              style={{ color: BRAND.navy }}
            >
              Build Content Cycle
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Create a fresh set of content from your topic library. Approved
              and published entries are never overwritten.
            </p>
          </div>
          <button
            onClick={onGenerate}
            disabled={generating || fieldsCount === 0}
            title={fieldsCount === 0 ? "Load topics first" : undefined}
            className="px-7 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 shadow-xl shrink-0"
            style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Zap size={16} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* CSV Import card */}
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
        <h3
          className="text-xl font-extrabold tracking-tight mb-1"
          style={{ color: BRAND.navy }}
        >
          Import from CSV
        </h3>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Upload a CSV file to add entries in bulk. Required columns:
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono ml-1">
            day_number, entry_date, platform, post_type, topic, content_goal
          </code>
        </p>

        {/* Drop zone */}
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) {
              handleFile(f);
              // Reset so same file can be dropped again
              if (fileRef.current) fileRef.current.value = "";
            }
          }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-[#af5ce9] bg-purple-50 scale-[1.01]" : "border-slate-200 hover:border-slate-400 bg-slate-50/50"}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            aria-label="Upload CSV calendar file"
            title="Upload CSV"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                handleFile(f);
                // Reset so same file can be re-selected
                e.target.value = "";
              }
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={32}
                className="animate-spin"
                style={{ color: BRAND.purple }}
              />
              <p className="text-slate-500 font-medium">Importing…</p>
            </div>
          ) : uploadMsg?.ok ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <p className="text-emerald-700 font-bold">Upload complete!</p>
              <p className="text-xs text-slate-400">
                Drop another CSV to import more
              </p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileUp size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-700 font-bold mb-1">
                Drop CSV here or click to browse
              </p>
              <p className="text-slate-400 text-sm">
                Supports .csv files with the required columns
              </p>
            </>
          )}
        </div>

        <AnimatePresence>
          {uploadMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 p-4 rounded-2xl text-sm font-medium ${uploadMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}
            >
              {uploadMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSV template download */}
        <a
          href="data:text/csv;charset=utf-8,day_number,entry_date,platform,post_type,topic,content_goal%0A1,2026-04-01,IG,CAROUSEL,Topic here,Goal here"
          download="pam-calendar-template.csv"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition"
        >
          <Download size={14} /> Download CSV template
        </a>
      </div>

      {/* Formats reference */}
      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
        <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wide">
          Valid CSV values
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-bold text-slate-500 mb-1">Platform</p>
            <p className="text-slate-400 font-mono">
              IG · FB · LINKEDIN · EMAIL
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-500 mb-1">Post Type</p>
            <p className="text-slate-400 font-mono">
              CAROUSEL · TEXT_POST · EMAIL_LESSON
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-500 mb-1">entry_date</p>
            <p className="text-slate-400 font-mono">YYYY-MM-DD</p>
          </div>
          <div>
            <p className="font-bold text-slate-500 mb-1">day_number</p>
            <p className="text-slate-400 font-mono">1–30 (integer)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ProductionPanel ─────────────────────────────────────────────────────
export function ProductionPanel() {
  const [view, setView] = useState<ProdView>("overview");
  const [entries, setEntries] = useState<CalendarEntryRow[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<PublishStatus | "">("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "">("");
  const [sortOrder, setSortOrder] = useState<
    "latest" | "oldest" | "day_desc" | "day_asc" | "status_asc" | "status_desc"
  >("latest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] =
    useState<GenerateCycleResponse | null>(null);
  const [generateProgress, setGenerateProgress] = useState(0);
  const generationPollRef = useRef<number | null>(null);

  // Multi-select state
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Generic confirming state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    desc: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const showToast = (
    msg: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = React.useMemo(
    () => ({
      total: pagination.total,
      draft: entries.filter((e) => e.publishStatus === "DRAFT").length,
      pending: entries.filter((e) => e.publishStatus === "PENDING_APPROVAL")
        .length,
      approved: entries.filter((e) => e.publishStatus === "APPROVED").length,
      generating: entries.filter((e) => e.publishStatus === "GENERATING")
        .length,
      published: entries.filter((e) => e.publishStatus === "PUBLISHED").length,
    }),
    [entries, pagination.total],
  );

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchCalendar = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const p = new URLSearchParams();
        if (statusFilter) p.set("status", statusFilter);
        if (platformFilter) p.set("platform", platformFilter);
        p.set("sort", sortOrder);
        p.set("page", String(page));
        p.set("limit", "10");
        const res = await fetch(`/api/production/calendar?${p}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as CalendarListResponse;
        const safeEntries = Array.isArray(data.entries) ? data.entries : [];
        setEntries(safeEntries);
        const pag = data.pagination ?? {
          total: safeEntries.length,
          page,
          limit: safeEntries.length,
          totalPages: 1,
        };
        setPagination({
          total: pag.total ?? safeEntries.length,
          page: pag.page ?? page,
          totalPages: pag.totalPages ?? 1,
        });
      } catch {
        /* silent */
      }

      setLoading(false);
      setRefreshing(false);
    },
    [statusFilter, platformFilter, sortOrder],
  );

  useEffect(() => {
    setBulkSelectedIds(new Set()); // Clear selection on filter change
    void fetchCalendar(1);
  }, [fetchCalendar]);

  // NO auto-polling — user clicks Sync manually to refresh

  const handleEntryUpdated = useCallback((id: string, newStatus: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, publishStatus: newStatus as PublishStatus } : e,
      ),
    );
  }, []);

  // Track how many entries have already been generated (to compute offset)
  const [generatedSoFar, setGeneratedSoFar] = useState(0);

  useEffect(() => {
    return () => {
      if (generationPollRef.current !== null) {
        window.clearInterval(generationPollRef.current);
      }
    };
  }, []);

  const handleGenerateCycle = async (
    selections: Record<PostTypeKey, PostTypeSelection>,
  ) => {
    setGenerating(true);
    setGenerateProgress(0);
    setGenerateResult(null);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(9, 0, 0, 0);
    const startDateStr = startDate.toISOString();

    const offset = generatedSoFar;
    let handedOffToPoller = false;

    try {
      const snapshotRes = await fetch(
        "/api/production/calendar?page=1&limit=500",
      );
      const snapshotData = snapshotRes.ok
        ? ((await snapshotRes.json()) as CalendarListResponse)
        : null;
      const baselineTotal = snapshotData?.pagination?.total ?? pagination.total;
      const baselineIds = new Set(
        (snapshotData?.entries ?? []).map((e) => e.id),
      );
      const overwriteRun = offset === 0;
      const requestedCount =
        Object.values(selections).reduce(
          (sum, selection) => sum + (selection.enabled ? selection.count : 0),
          0,
        ) || 0;

      const res = await fetch("/api/production/calendar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections,
          offset,
          startDate: startDateStr,
          overwrite: overwriteRun,
        }),
      });

      const data = (await res.json()) as GenerateCycleResponse;
      setGenerateResult(data);

      if (data.queued) {
        handedOffToPoller = true;
        showToast(data.message ?? "Generation started.", "info");

        const expectedMinimumTotal = overwriteRun
          ? baselineTotal
          : baselineTotal + (requestedCount || data.requestedDays || 0);

        let polls = 0;
        let stableHits = 0;
        let lastSignature = "";

        generationPollRef.current = window.setInterval(() => {
          polls += 1;
          setGenerateProgress((prev) => Math.min(95, Math.max(prev + 6, 12)));

          void (async () => {
            try {
              const pollRes = await fetch(
                "/api/production/calendar?page=1&limit=500",
              );
              if (!pollRes.ok) return;

              const pollData = (await pollRes.json()) as CalendarListResponse;
              const pollEntries = pollData.entries ?? [];
              const pollTotal = pollData.pagination?.total ?? 0;

              setEntries(pollEntries);
              setPagination({
                total: pollTotal,
                page: pollData.pagination?.page ?? 1,
                totalPages: pollData.pagination?.totalPages ?? 1,
              });
              setRefreshing(false);
              setLoading(false);

              const newIds = pollEntries.filter(
                (entry) => !baselineIds.has(entry.id),
              ).length;
              const signature = pollEntries
                .map((entry) => `${entry.id}:${entry.publishStatus}`)
                .join("|");

              const reachedExpectedTotal = pollTotal >= expectedMinimumTotal;
              const overwriteLooksUpdated =
                overwriteRun &&
                lastSignature !== "" &&
                (signature !== lastSignature || newIds > 0);
              const additiveLooksUpdated =
                !overwriteRun &&
                (pollTotal > baselineTotal || newIds >= requestedCount);

              if (
                signature === lastSignature &&
                (reachedExpectedTotal ||
                  overwriteLooksUpdated ||
                  additiveLooksUpdated)
              ) {
                stableHits += 1;
              } else if (
                reachedExpectedTotal ||
                overwriteLooksUpdated ||
                additiveLooksUpdated
              ) {
                stableHits = 1;
              } else {
                stableHits = 0;
              }

              lastSignature = signature;

              if (stableHits >= 2 || polls >= 30) {
                if (generationPollRef.current !== null) {
                  window.clearInterval(generationPollRef.current);
                  generationPollRef.current = null;
                }

                const generatedCount = Math.max(
                  data.generated ?? 0,
                  overwriteRun
                    ? requestedCount || data.requestedDays || 0
                    : pollTotal - baselineTotal,
                );

                setGenerateResult({
                  generated: generatedCount,
                  failed: data.failed ?? 0,
                  entries: data.entries ?? [],
                  queued: false,
                  message: data.message,
                });
                setGeneratedSoFar((prev) => prev + generatedCount);
                setGenerateProgress(100);
                setGenerating(false);

                if ((data.failed ?? 0) > 0) {
                  showToast(
                    `Generated ${generatedCount} entries. ${data.failed ?? 0} failed.`,
                    "error",
                  );
                } else {
                  showToast(
                    `Successfully generated ${generatedCount} new entries!`,
                    "success",
                  );
                }
              }
            } catch {
              if (polls >= 30) {
                if (generationPollRef.current !== null) {
                  window.clearInterval(generationPollRef.current);
                  generationPollRef.current = null;
                }
                setGenerateResult({
                  generated:
                    requestedCount || data.requestedDays || data.generated || 0,
                  failed: data.failed ?? 0,
                  entries: data.entries ?? [],
                  queued: false,
                  message: data.message,
                });
                setGenerateProgress(100);
                setGenerating(false);
              }
            }
          })();
        }, 4000);

        return;
      }

      setGenerateProgress(100);
      setGeneratedSoFar((prev) => prev + (data.generated ?? 0));
      if ((data.failed ?? 0) > 0) {
        showToast(
          `Generated ${data.generated ?? 0} entries. ${data.failed ?? 0} failed.`,
          "error",
        );
      } else {
        showToast(
          `Successfully generated ${data.generated ?? 0} new entries!`,
          "success",
        );
      }
      await fetchCalendar(1);
    } catch {
      showToast("Content generation failed.", "error");
    } finally {
      if (!handedOffToPoller) {
        setGenerating(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelectedIds.size === 0) return;

    setConfirmModal({
      title: "Delete Entries",
      desc: `Are you sure you want to permanently delete these ${bulkSelectedIds.size} calendar entries? This action cannot be undone.`,
      actionLabel: deletingBulk ? "Deleting…" : "Delete",
      onConfirm: async () => {
        setConfirmModal(null);
        setDeletingBulk(true);
        try {
          const res = await fetch("/api/production/calendar/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(bulkSelectedIds) }),
          });
          const data = await res.json();
          if (res.ok) {
            showToast(
              `Deleted ${data.deleted} entries successfully`,
              "success",
            );
            setBulkSelectedIds(new Set());
            await fetchCalendar(pagination.page);
          } else {
            showToast(data.error ?? "Failed to delete entries", "error");
          }
        } catch {
          showToast("Network error deleting entries", "error");
        }
        setDeletingBulk(false);
      },
    });
  };

  const statCards = [
    {
      label: "Total Entries",
      value: stats.total,
      color: BRAND.navy,
      iconName: "CalendarDays",
      sublabel: "All records",
    },
    {
      label: "Draft",
      value: stats.draft,
      color: "#6B7280",
      iconName: "FileText",
      sublabel: "Awaiting review",
    },
    {
      label: "Pending",
      value: stats.pending,
      color: "#F59E0B",
      iconName: "Clock",
      sublabel: "Needs approval",
    },
    {
      label: "Approved",
      value: stats.approved,
      color: "#10B981",
      iconName: "CheckCircle",
      sublabel: "Ready to render",
    },
    {
      label: "Published",
      value: stats.published,
      color: BRAND.purple,
      iconName: "Send",
      sublabel: "Live content",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 size={32} style={{ color: BRAND.purple }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              background:
                toast.type === "success"
                  ? BRAND.purple
                  : toast.type === "error"
                    ? BRAND.red
                    : BRAND.navy,
              color: "white",
              padding: "12px 24px",
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              zIndex: 9999,
              fontFamily: "var(--font-montserrat)",
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-tab bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ViewTabs active={view} onChange={setView} />

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGenerateResult(null);
              setGenerateModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2 text-white rounded-xl text-sm font-bold shadow-lg font-montserrat tracking-wide"
            style={{ background: BRAND.gradient, boxShadow: BRAND.glow }}
          >
            <Zap size={14} /> Generate 5
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── OVERVIEW ── */}
        {view === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Stat cards */}
            <div className="flex flex-wrap gap-4">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex-1 min-w-[140px]"
                >
                  <StatCard {...s} />
                </motion.div>
              ))}
            </div>

            {/* Status breakdown */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3
                className="text-lg font-extrabold tracking-tight mb-5"
                style={{ color: BRAND.navy }}
              >
                Status Breakdown
              </h3>
              <div className="flex flex-col gap-3">
                {(Object.keys(STATUS_META) as PublishStatus[]).map((s) => {
                  const count = entries.filter(
                    (e) => e.publishStatus === s,
                  ).length;
                  const pct =
                    stats.total > 0
                      ? Math.round((count / stats.total) * 100)
                      : 0;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">
                        {STATUS_META[s].label}
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.2,
                          }}
                          className="h-full rounded-full"
                          style={{
                            background: count > 0 ? BRAND.gradient : "#E5E7EB",
                          }}
                        />
                      </div>
                      <div className="w-8 text-xs font-extrabold text-slate-600 text-right shrink-0">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shortcuts */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3
                className="text-lg font-extrabold tracking-tight mb-5 font-montserrat"
                style={{ color: BRAND.navy }}
              >
                Shortcuts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    view: "table" as ProdView,
                    iconName: "Table",
                    Icon: LayoutList,
                    label: "View Table",
                    desc: "Browse all entries",
                    color: BRAND.red,
                  },
                  {
                    view: "import" as ProdView,
                    iconName: "Upload",
                    Icon: Upload,
                    label: "Import / Generate",
                    desc: "Add new entries",
                    color: BRAND.purple,
                  },
                ].map((action) => (
                  <button
                    key={action.view}
                    onClick={() => setView(action.view)}
                    className="p-5 border border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl text-left transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 transition-colors group-hover:text-[#af5ce9]">
                      <action.Icon
                        size={20}
                        className="text-slate-600 group-hover:text-[#af5ce9]"
                      />
                    </div>
                    <p
                      className="text-sm font-bold font-montserrat"
                      style={{ color: BRAND.navy }}
                    >
                      {action.label}
                    </p>
                    <p className="text-slate-500 text-xs mt-1 font-medium font-sans">
                      {action.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TABLE ── */}
        {view === "table" && (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Filters row */}
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100 flex flex-wrap items-center gap-3">
              <Filter size={14} className="text-slate-400 shrink-0" />
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PublishStatus | "");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#af5ce9]/40"
              >
                <option value="">All Statuses</option>
                {(Object.keys(STATUS_META) as PublishStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by platform"
                value={platformFilter}
                onChange={(e) => {
                  setPlatformFilter(e.target.value as Platform | "");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#af5ce9]/40"
              >
                <option value="">All Platforms</option>
                {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_META[p].label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Sort table rows"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(
                    e.target.value as
                      | "latest"
                      | "oldest"
                      | "day_desc"
                      | "day_asc"
                      | "status_asc"
                      | "status_desc",
                  );
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#af5ce9]/40"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="day_desc">Day Number ↓</option>
                <option value="day_asc">Day Number ↑</option>
                <option value="status_asc">Status A → Z</option>
                <option value="status_desc">Status Z → A</option>
              </select>

              {/* Bulk Delete Feature */}
              <AnimatePresence>
                {bulkSelectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <button
                      onClick={handleBulkDelete}
                      disabled={deletingBulk}
                      className="px-3 py-1.5 flex items-center gap-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      <Archive size={14} />
                      {deletingBulk
                        ? "Deleting…"
                        : `Delete ${bulkSelectedIds.size}`}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1" />

              <button
                onClick={() => fetchCalendar(1, true)}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-sm text-xs font-bold"
              >
                <RefreshCw
                  size={12}
                  className={refreshing ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>

              <a
                href="/api/production/export/canva"
                download
                className="flex items-center gap-2 px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-sm text-xs font-bold"
              >
                <Download size={12} /> Export CSV
              </a>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    aria-label="Previous page"
                    onClick={() => fetchCalendar(pagination.page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-bold text-slate-500">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    aria-label="Next page"
                    onClick={() => fetchCalendar(pagination.page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <CalendarTable
                entries={entries}
                selectedId={selectedId}
                onSelect={(entry) => setSelectedId(entry.id)}
                loading={refreshing}
                bulkSelectedIds={bulkSelectedIds}
                onToggleSelect={(id) => {
                  setBulkSelectedIds((prev) => {
                    const n = new Set(prev);
                    if (n.has(id)) n.delete(id);
                    else n.add(id);
                    return n;
                  });
                }}
                onToggleSelectAll={(allIds) => {
                  if (
                    bulkSelectedIds.size === entries.length &&
                    entries.length > 0
                  ) {
                    setBulkSelectedIds(new Set()); // unselect all
                  } else {
                    setBulkSelectedIds(new Set(allIds)); // select all currently visible
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {/* ── IMPORT / GENERATE ── */}
        {view === "import" && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ImportTab
              onGenerate={() => {
                setGenerateResult(null);
                setGenerateModalOpen(true);
              }}
              generating={generating}
              onDone={() => fetchCalendar(1, true)}
            />
          </motion.div>
        )}

        {/* ── STORY BANK — REMOVED FROM PRODUCTION ── */}
        {/* view === "storybank" && (
                    <motion.div key="storybank" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <StoryBankTab
                            entries={entries}
                            onRefresh={() => fetchCalendar(pagination.page)}
                        />
                    </motion.div>
                ) */}

        {/* ── RENDER QUEUE ── */}
        {view === "renderjobs" && (
          <motion.div
            key="renderjobs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <RenderJobsTab />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Day detail slide-out */}
      <DayPanel
        entryId={selectedId}
        onClose={() => setSelectedId(null)}
        onEntryUpdated={handleEntryUpdated}
      />

      {/* Generate cycle modal */}
      <GenerateModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onConfirm={handleGenerateCycle}
        running={generating}
        result={generateResult}
        progress={generateProgress}
        onViewTable={() => setView("table")}
      />

      {/* Confirmation modal */}
      <ConfirmModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title ?? ""}
        desc={confirmModal?.desc ?? ""}
        actionLabel={confirmModal?.actionLabel ?? ""}
        onConfirm={confirmModal?.onConfirm ?? (() => {})}
        loading={deletingBulk}
      />
    </div>
  );
}
