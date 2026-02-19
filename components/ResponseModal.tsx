"use client";

import { X, Copy, Download, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";
import { useState } from "react";

interface ResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialContent: string;
    accentColor?: "teal" | "blue";
}

export function ResponseModal({
    isOpen,
    onClose,
    title,
    initialContent,
    accentColor = "teal"
}: ResponseModalProps) {
    const [copied, setCopied] = useState(false);

    const colors = {
        teal: {
            bg: "bg-[#041f50]",
            hover: "hover:bg-[#052647]",
            text: "text-[#041f50]"
        },
        blue: {
            bg: "bg-[#041f50]",
            hover: "hover:bg-[#052647]",
            text: "text-[#041f50]"
        },
    };

    const colorScheme = colors[accentColor];

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(initialContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([initialContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className={`${colorScheme.bg} text-white px-6 py-4 flex items-center justify-between`}>
                        <h2 className="text-xl font-bold">{title}</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                title="Download as text"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div
                            className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-ul:my-4 prose-li:my-2 prose-code:text-sm prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-strong:text-[#041f50] dark:prose-strong:text-white"
                            dangerouslySetInnerHTML={{ __html: marked.parse(initialContent) }}
                        />
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800">
                        <button
                            onClick={onClose}
                            className={`w-full ${colorScheme.bg} ${colorScheme.hover} text-white px-6 py-3 rounded-lg font-semibold transition`}
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
