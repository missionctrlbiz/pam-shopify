"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PDFPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    maxPreviewPages?: number;
}

const PDFContent = ({ onClose }: Omit<PDFPreviewProps, 'isOpen'>) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0"
            />

            {/* Modal container — no header bar, no footer bar */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2 }}
                className="relative w-[95vw] h-[95vh] rounded-2xl overflow-hidden shadow-2xl bg-white flex flex-col"
            >
                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50 rounded-2xl">
                        <div className="w-16 h-16 border-4 border-white/20 border-t-[#041f50] rounded-full animate-spin mb-6" />
                        <div className="text-white text-xl font-semibold mb-2">Loading Preview</div>
                        <div className="text-white/60 text-sm">Please wait while we load the workbook...</div>
                    </div>
                )}

                {/* Full-width, full-height PDF — object tag is more stable than iframe in dev */}
                <object
                    data="/pam-workbook-sample.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=100"
                    type="application/pdf"
                    className="w-full flex-1 border-0"
                    onLoad={() => setIsLoading(false)}
                    aria-label="Workbook Preview"
                />

                {/* Floating close button — top right */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition shadow-lg"
                    title="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Floating download button — top right, next to close */}
                <a
                    href="/pam-workbook-sample.pdf"
                    download
                    className="absolute top-4 right-16 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition shadow-lg"
                    title="Download preview"
                >
                    <Download className="w-5 h-5" />
                </a>

                {/* Floating Get Full Access CTA — bottom center */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
                    <button
                        onClick={() => {
                            onClose();
                            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-[#041f50] hover:bg-[#052e7a] text-white px-10 py-3.5 rounded-full font-bold text-base shadow-2xl transition ring-4 ring-white/30 hover:ring-white/50"
                    >
                        Get Full Access →
                    </button>
                    <span className="text-white/70 text-xs drop-shadow">Preview only · Full workbook on purchase</span>
                </div>
            </motion.div>
        </div>
    );
};

export function PDFPreview({ isOpen, onClose, maxPreviewPages = 10 }: PDFPreviewProps) {
    return (
        <AnimatePresence>
            {isOpen && <PDFContent onClose={onClose} maxPreviewPages={maxPreviewPages} />}
        </AnimatePresence>
    );
}
