"use client";

import { X, Copy, Download, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";
import { useState } from "react";

interface ResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    accentColor?: "teal" | "blue";
}

export function ResponseModal({
    isOpen,
    onClose,
    title,
    content,
    accentColor = "teal"
}: ResponseModalProps) {
    const [copied, setCopied] = useState(false);

    const colors = {
        teal: {
            bg: "bg-teal-600 dark:bg-teal-500",
            hover: "hover:bg-teal-700 dark:hover:bg-teal-600",
            border: "border-teal-600 dark:border-teal-500",
            text: "text-teal-600 dark:text-teal-400",
        },
        blue: {
            bg: "bg-blue-600 dark:bg-blue-500",
            hover: "hover:bg-blue-700 dark:hover:bg-blue-600",
            border: "border-blue-600 dark:border-blue-500",
            text: "text-blue-600 dark:text-blue-400",
        },
    };

    const colorScheme = colors[accentColor];

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className={`flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 ${colorScheme.bg}`}>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <span>{title}</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                        title="Download as text"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                                <div
                                    className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-li:text-base prose-strong:font-bold prose-strong:text-slate-900 dark:prose-strong:text-white"
                                    dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
