"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PDFPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    maxPreviewPages?: number;
}

export function PDFPreview({ isOpen, onClose, maxPreviewPages = 10 }: PDFPreviewProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-6xl max-h-[95vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="bg-[#041f50] text-white px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Workbook Preview</h2>
                            <p className="text-sm text-white/80">First {maxPreviewPages} pages - Get full access below</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href="/pam-workbook-sample.pdf" download className="p-2 hover:bg-white/10 rounded-lg transition" title="Download preview">
                                <Download className="w-5 h-5" />
                            </a>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition" title="Close">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden bg-slate-800 flex items-center justify-center relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-[#041f50] rounded-full animate-spin"></div>
                                </div>
                                <div className="text-white text-xl font-semibold mb-2">Loading Preview</div>
                                <div className="text-white/60 text-sm">Please wait while we load the workbook...</div>
                            </div>
                        )}
                        <iframe src="/pam-workbook-sample.pdf#toolbar=1&navpanes=0&scrollbar=1" className="w-full h-full border-0" title="Workbook Preview" onLoad={() => setIsLoading(false)} />
                    </div>
                    <div className="border-t border-slate-700 px-6 py-4 bg-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="text-white/60 text-sm">This is a preview of the first {maxPreviewPages} pages only</div>
                            <button onClick={() => { onClose(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-[#041f50] text-white px-6 py-2 rounded-full font-bold hover:bg-[#052647] transition shadow-lg">Get Full Access</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
