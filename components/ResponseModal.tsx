"use client";

import { X, Copy, Download, Check } from "lucide-react";
import { motion } from "framer-motion";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { useState, useMemo } from "react";

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

    const html = useMemo(() => {
        try {
            const raw = typeof initialContent === "string" ? initialContent : "";
            return DOMPurify.sanitize(marked.parse(raw) as string);
        } catch (e) {
            console.error("Render error:", e);
            return '<p class="text-red-400">Unable to display formatted content.</p>';
        }
    }, [initialContent]);

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
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed inset-0 z-[60] flex flex-col bg-slate-900"
            >
                {/* Header */}
                <div className={`${colorScheme.bg} text-white px-6 py-4 flex items-center justify-between shrink-0`}>
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

                <div className="flex-1 overflow-y-auto p-8 bg-slate-900">
                    <div
                        className="prose max-w-none text-white **:text-white! prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:my-2 prose-code:text-sm prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-strong:font-bold"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 px-6 py-4 bg-slate-800 shrink-0">
                    <button
                        onClick={onClose}
                        className={`w-full ${colorScheme.bg} ${colorScheme.hover} text-white px-6 py-3 rounded-lg font-semibold transition`}
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </>
    );
}
