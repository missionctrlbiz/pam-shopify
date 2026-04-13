"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  ChevronDown,
  Users,
} from "lucide-react";
import { PROD_BRAND } from "./CalendarTable";
import type {
  PublishState,
  PublishPayload,
  PublishResponse,
  PublishJob,
  AudienceSource,
  ContentAsset,
} from "./types";

const CHANNEL_META: Record<
  string,
  { label: string; color: string; Icon: React.ElementType }
> = {
  EMAIL: { label: "Email", color: "#3B82F6", Icon: Mail },
};

export function StatusPill({ status }: { status: PublishJob["status"] }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING: {
      label: "Pending",
      bg: PROD_BRAND.amberFaint,
      color: PROD_BRAND.amber,
    },
    RUNNING: {
      label: "Sending",
      bg: PROD_BRAND.blueFaint,
      color: PROD_BRAND.blue,
    },
    COMPLETE: {
      label: "Sent",
      bg: PROD_BRAND.greenFaint,
      color: PROD_BRAND.green,
    },
    FAILED: { label: "Failed", bg: PROD_BRAND.redFaint, color: PROD_BRAND.red },
  };
  const meta = map[status] ?? {
    label: status,
    bg: PROD_BRAND.grayFaint,
    color: PROD_BRAND.gray,
  };

  return (
    <span
      style={{ background: meta.bg, color: meta.color }}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide"
    >
      {meta.label}
    </span>
  );
}

function QuotaBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? used / limit : 0;
  const color =
    pct >= 0.9
      ? PROD_BRAND.red
      : pct >= 0.7
        ? PROD_BRAND.amber
        : PROD_BRAND.green;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500 font-medium">
        <span>{used} sent today</span>
        <span>{Math.max(0, limit - used)} remaining</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct * 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <p className="text-xs text-slate-400">Daily email sending limit</p>
    </div>
  );
}

function RecentJobs({ jobs }: { jobs: PublishJob[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? jobs : jobs.slice(0, 5);

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">
        No email activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((job) => {
        const meta = CHANNEL_META[job.channel] ?? CHANNEL_META.EMAIL;
        const Icon = meta.Icon;

        return (
          <div
            key={job.id}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm"
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${meta.color}15` }}
            >
              <Icon size={14} style={{ color: meta.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-semibold text-slate-700">Email send</span>
              {job.recipientCount !== null && (
                <span className="ml-2 text-slate-400 text-xs">
                  {job.recipientCount} recipients
                </span>
              )}
              {job.errorMessage && (
                <p className="text-xs text-red-500 mt-0.5 truncate">
                  {job.errorMessage}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <StatusPill status={job.status} />
            </div>
          </div>
        );
      })}

      {jobs.length > 5 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 flex items-center justify-center gap-1 transition-colors"
        >
          <ChevronDown
            size={14}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Show less" : `Show ${jobs.length - 5} more`}
        </button>
      )}
    </div>
  );
}

export function PublishTab() {
  const [pipelineState, setPipelineState] = useState<PublishState | null>(null);
  const [stateLoading, setStateLoading] = useState(true);
  const [stateError, setStateError] = useState<string | null>(null);

  const [audienceSource, setAudienceSource] =
    useState<AudienceSource>("buyers");
  const [emailAssetId, setEmailAssetId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailMaxRecipients] = useState(90);
  const [emailAssets, setEmailAssets] = useState<ContentAsset[]>([]);
  const [emailAssetsLoading, setEmailAssetsLoading] = useState(false);
  const [fetchingEmailBody, setFetchingEmailBody] = useState(false);

  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<PublishResponse | null>(
    null,
  );
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setStateLoading(true);
    setStateError(null);

    try {
      const res = await fetch("/api/production/publish");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as PublishState;
      setPipelineState(data);
    } catch (err) {
      setStateError((err as Error).message);
    } finally {
      setStateLoading(false);
    }
  }, []);

  const loadEmailAssets = useCallback(async () => {
    setEmailAssetsLoading(true);
    try {
      const res = await fetch(
        "/api/production/assets?assetType=EMAIL_HTML&status=COMPLETE&limit=50",
      );
      if (!res.ok) return;
      const data = (await res.json()) as { assets?: ContentAsset[] };
      setEmailAssets(data.assets ?? []);
    } catch {
      // silent
    } finally {
      setEmailAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
    loadEmailAssets();
  }, [loadState, loadEmailAssets]);

  useEffect(() => {
    if (!emailAssetId) {
      setEmailContent("");
      return;
    }

    const asset = emailAssets.find((a) => a.id === emailAssetId);
    if (!asset?.storageUrl) return;
    const storageUrl: string = asset.storageUrl;

    const fetchBody = async () => {
      setFetchingEmailBody(true);
      try {
        const res = await fetch(storageUrl);
        if (res.ok) {
          const html = await res.text();
          setEmailContent(html);
        }
      } catch {
        // silent
      } finally {
        setFetchingEmailBody(false);
      }
    };

    void fetchBody();
  }, [emailAssetId, emailAssets]);

  const handleEmailBlast = async () => {
    if (!emailAssetId || !emailSubject.trim()) {
      setDispatchError("Please choose an email and add a subject line.");
      return;
    }

    setDispatching(true);
    setDispatchResult(null);
    setDispatchError(null);

    try {
      const payload: PublishPayload = {
        mode: "email",
        email: {
          audienceSource,
          assetId: emailAssetId,
          subject: emailSubject.trim(),
          maxRecipients: emailMaxRecipients,
          htmlOverride: emailContent,
        },
      };

      const res = await fetch("/api/production/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as PublishResponse;

      if (!res.ok) {
        setDispatchError(data.error ?? `Server error ${res.status}`);
      } else {
        setDispatchResult(data);
        await loadState();
      }
    } catch (err) {
      setDispatchError((err as Error).message);
    } finally {
      setDispatching(false);
    }
  };

  const emailQuotaOk =
    (pipelineState?.emailDailyLimit ?? 0) >
    (pipelineState?.emailSentToday ?? 0);
  const emailReady = emailQuotaOk && !!emailAssetId && !!emailSubject.trim();
  const emailJobs = (pipelineState?.recentJobs ?? []).filter(
    (job) => job.channel === "EMAIL",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Email Campaign
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Choose your audience, review the message, and send your email
            update.
          </p>
        </div>

        <button
          onClick={() => {
            loadState();
            loadEmailAssets();
          }}
          disabled={stateLoading || dispatching}
          className="flex items-center justify-center w-9 h-9 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={stateLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {stateError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <AlertCircle size={16} />
          <span>Could not load email settings: {stateError}</span>
        </div>
      )}

      <AnimatePresence>
        {(dispatchResult || dispatchError) && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-2xl border text-sm space-y-1 ${
              dispatchError
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {dispatchError ? (
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span className="font-semibold">{dispatchError}</span>
              </div>
            ) : (
              dispatchResult && (
                <>
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 size={15} />
                    <span>
                      {dispatchResult.message ?? "Email sent successfully."}
                    </span>
                  </div>

                  {dispatchResult.emailCount !== undefined && (
                    <p className="pl-5 text-xs">
                      📧 {dispatchResult.emailCount} emails sent
                    </p>
                  )}

                  {dispatchResult.quotaWarning && (
                    <p className="pl-5 text-xs text-amber-600">
                      ⚠️ {dispatchResult.quotaWarning}
                    </p>
                  )}

                  {(dispatchResult.errors ?? []).length > 0 && (
                    <ul className="pl-5 text-xs text-red-600 list-disc">
                      {dispatchResult.errors?.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "#EFF6FF" }}
              >
                <Mail size={18} style={{ color: "#3B82F6" }} />
              </div>

              <div>
                <h3 className="font-extrabold text-slate-800">
                  Send email update
                </h3>
                <p className="text-xs text-slate-400">
                  Select a saved email, make any final edits, and send it to
                  your audience.
                </p>
              </div>

              <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 border border-slate-100">
                <Shield size={11} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500">
                  {stateLoading
                    ? "…"
                    : `${pipelineState?.emailSentToday ?? 0}/${pipelineState?.emailDailyLimit ?? 90} today`}
                </span>
              </div>
            </div>

            {pipelineState && (
              <QuotaBar
                used={pipelineState.emailSentToday}
                limit={pipelineState.emailDailyLimit}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Audience
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(["buyers", "leads", "both"] as AudienceSource[]).map(
                      (src) => (
                        <button
                          key={src}
                          onClick={() => setAudienceSource(src)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                            audienceSource === src
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {src === "both"
                            ? "All contacts"
                            : src.charAt(0).toUpperCase() + src.slice(1)}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Saved email
                  </label>
                  <select
                    value={emailAssetId}
                    onChange={(e) => setEmailAssetId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">
                      {emailAssetsLoading
                        ? "Loading saved emails..."
                        : "Select an email"}
                    </option>
                    {emailAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fileName ?? a.id.slice(0, 12)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Subject line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Write a subject line..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-slate-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Before you send
                      </p>
                      <p className="text-xs text-slate-500">
                        Double-check the audience, subject line, and message
                        below. You can edit the email content before sending.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Email content</span>
                    {fetchingEmailBody && (
                      <Loader2
                        size={12}
                        className="animate-spin text-blue-500"
                      />
                    )}
                  </label>
                  <textarea
                    rows={12}
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="w-full px-3 py-2 text-[11px] font-mono rounded-xl border border-slate-200 bg-slate-50 min-h-[240px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <button
                  onClick={handleEmailBlast}
                  disabled={dispatching || !emailReady}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: PROD_BRAND.blue }}
                >
                  {dispatching ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending email...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send email
                    </>
                  )}
                </button>

                {!emailQuotaOk && (
                  <p className="text-xs text-amber-600">
                    You have reached today&apos;s email sending limit.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Recent email activity
            </h4>
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <RecentJobs jobs={emailJobs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
