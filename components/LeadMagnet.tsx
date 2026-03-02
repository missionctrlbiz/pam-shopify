
"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "form" | "submitting" | "download";

export function LeadMagnet() {
    const [email, setEmail] = useState("");
    const [stage, setStage] = useState<Stage>("form");
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        setStage("submitting");

        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), source: "lead-magnet-workflow" }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong.");
            }
            setStage("download");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save your email. Please try again.");
            setStage("form");
        }
    }

    return (
        <div className="mt-20 bg-[#041f50] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {(stage === "form" || stage === "submitting") && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="relative z-10 max-w-2xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-bold tracking-widest uppercase mb-5 text-blue-200">
                            <FileText className="w-3.5 h-3.5" /> Free Download
                        </div>
                        <h3 className="text-3xl font-bold mb-3 text-white">Not Ready to Buy?</h3>
                        <p className="text-blue-200 mb-2 text-lg">
                            Get your free <strong className="text-white">One-Page Workflow</strong> — a clinical reference you can keep at your desk.
                        </p>
                        <p className="text-blue-300 text-sm mb-8">Enter your email and we&apos;ll send it to you instantly.</p>

                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                placeholder="Enter your best email..."
                                required
                                className="flex-grow px-6 py-4 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-400 shadow-md text-base"
                            />
                            <button
                                type="submit"
                                disabled={stage === "submitting"}
                                className="bg-yellow-400 text-[#041f50] font-bold px-8 py-4 rounded-xl hover:bg-yellow-300 transition shadow-lg transform hover:-translate-y-0.5 text-base whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {stage === "submitting" ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                ) : (
                                    "Send It to Me"
                                )}
                            </button>
                        </form>

                        {error && (
                            <p className="text-red-300 text-sm mt-3 font-semibold">{error}</p>
                        )}

                        <p className="text-sm text-blue-400 mt-5 flex justify-center items-center gap-2 opacity-80">
                            <span>🔒</span> Your email is safe. No spam. Unsubscribe anytime.
                        </p>
                    </motion.div>
                )}

                {stage === "download" && (
                    <motion.div
                        key="download"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 max-w-lg mx-auto"
                    >
                        <div className="w-16 h-16 bg-green-400/20 border border-green-300/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 className="w-8 h-8 text-green-300" />
                        </div>
                        <h3 className="text-3xl font-bold mb-3 text-white">You&apos;re in! 🎉</h3>
                        <p className="text-blue-200 mb-8 text-lg">
                            Your free <strong className="text-white">One-Page Workflow</strong> is ready to download.
                        </p>

                        {/* Download Placeholder — replace href with real PDF path once uploaded */}
                        <a
                            href="/one-page-workflow.pdf"
                            download
                            className="inline-flex items-center gap-3 bg-yellow-400 text-[#041f50] font-bold px-10 py-4 rounded-xl hover:bg-yellow-300 transition shadow-xl transform hover:-translate-y-0.5 text-lg"
                        >
                            <Download className="w-5 h-5" />
                            Download One-Page Workflow (PDF)
                        </a>

                        <p className="text-blue-400 text-xs mt-6 opacity-70">
                            File will be available once uploaded. Check your email if the download doesn&apos;t start.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
