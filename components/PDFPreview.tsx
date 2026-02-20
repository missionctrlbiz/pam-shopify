"use client";

import { useState, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PDFPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    maxPreviewPages?: number;
}

const PDFContent = ({ onClose, maxPreviewPages }: Omit<PDFPreviewProps, 'isOpen'>) => {
    const [isLoading, setIsLoading] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(100);

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 25, 200));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 25, 50));
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
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
                className="relative w-[95vw] h-[95vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="bg-[#041f50] text-white px-6 py-4 flex items-center justify-between z-10 relative">
                    <div>
                        <h2 className="text-xl font-bold">Workbook Preview</h2>
                        <p className="text-sm text-white/80">First {maxPreviewPages} pages - Get full access below</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 mr-2">
                            <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-lg transition disabled:opacity-50" title="Zoom Out" disabled={zoomLevel <= 50}>
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-mono w-12 text-center select-none">{zoomLevel}%</span>
                            <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-lg transition disabled:opacity-50" title="Zoom In" disabled={zoomLevel >= 200}>
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                        <a href="/pam-workbook-sample.pdf" download className="p-2 hover:bg-white/10 rounded-lg transition" title="Download preview">
                            <Download className="w-5 h-5" />
                        </a>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition" title="Close">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-slate-800 relative p-8">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 border-4 border-white/20 border-t-[#041f50] rounded-full animate-spin"></div>
                            </div>
                            <div className="text-white text-xl font-semibold mb-2">Loading Preview</div>
                            <div className="text-white/60 text-sm">Please wait while we load the workbook...</div>
                        </div>
                    )}
                    <motion.div 
                        animate={{ 
                            width: `${zoomLevel}%`,
                            height: `${(zoomLevel >= 100 ? zoomLevel : 100)}%` 
                        }}
                        className="shadow-2xl transition-all duration-200 ease-in-out mx-auto"
                        style={{ minHeight: '100%' }}
                    >
                        <iframe
                            src="/pam-workbook-sample.pdf#toolbar=1&navpanes=0&scrollbar=1&view=FitH"
                            className="w-full h-full border-0 rounded-lg bg-white"
                            title="Workbook Preview"
                            onLoad={() => setIsLoading(false)}
                        />
                    </motion.div>
                </div>
                <div className="border-t border-slate-700 px-6 py-4 bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="text-white/60 text-sm">This is a preview of the first {maxPreviewPages} pages only</div>
                        <button onClick={() => { onClose(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-[#041f50] text-white px-6 py-2 rounded-full font-bold hover:bg-[#052647] transition shadow-lg">Get Full Access</button>
                    </div>
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
