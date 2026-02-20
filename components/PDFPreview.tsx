"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { pdfjs } from "react-pdf";

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
    () => import("react-pdf").then((mod) => mod.Document),
    { ssr: false }
);
const Page = dynamic(
    () => import("react-pdf").then((mod) => mod.Page),
    { ssr: false }
);

// Configure PDF.js worker - use CDN for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    maxPreviewPages?: number;
}

export function PDFPreview({ isOpen, onClose, maxPreviewPages = 10 }: PDFPreviewProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [isLoading, setIsLoading] = useState(true);

    const isRedactedPage = pageNumber > maxPreviewPages;

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    function changePage(offset: number) {
        setPageNumber((prevPageNumber) => {
            const newPage = prevPageNumber + offset;
            if (newPage < 1) return 1;
            if (newPage > numPages) return numPages;
            return newPage;
        });
    }

    function changeZoom(delta: number) {
        setScale((prevScale) => {
            const newScale = prevScale + delta;
            if (newScale < 0.5) return 0.5;
            if (newScale > 2.0) return 2.0;
            return newScale;
        });
    }

    useEffect(() => {
        if (!isOpen) {
            setPageNumber(1);
            setScale(1.0);
            setIsLoading(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-6xl max-h-[95vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-[#041f50] text-white px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Workbook Preview</h2>
                            <p className="text-sm text-white/80">
                                Viewing pages 1-{maxPreviewPages} of {numPages}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                            title="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* PDF Viewer */}
                    <div className="flex-1 overflow-auto bg-slate-800 flex items-center justify-center relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
                                <div className="relative mb-6">
                                    {/* Spinner */}
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-[#041f50] rounded-full animate-spin"></div>
                                </div>
                                <div className="text-white text-xl font-semibold mb-2">Loading Preview</div>
                                <div className="text-white/60 text-sm">Please wait while we load the workbook...</div>
                            </div>
                        )}

                        <div className="relative">
                            <Document
                                file="/pam-workbook-sample.pdf"
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center justify-center p-12">
                                        <div className="w-12 h-12 border-4 border-white/20 border-t-[#041f50] rounded-full animate-spin mb-4"></div>
                                        <div className="text-white text-lg">Loading PDF...</div>
                                    </div>
                                }
                                error={
                                    <div className="flex flex-col items-center justify-center p-12">
                                        <div className="text-red-400 text-lg mb-2">Failed to load PDF</div>
                                        <div className="text-white/60 text-sm">Please try again later</div>
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="shadow-2xl"
                                    loading={
                                        <div className="flex items-center justify-center p-12">
                                            <div className="w-8 h-8 border-4 border-white/20 border-t-[#041f50] rounded-full animate-spin"></div>
                                        </div>
                                    }
                                />
                            </Document>

                            {/* Redacted Overlay */}
                            {isRedactedPage && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center"
                                >
                                    <div className="text-center px-8">
                                        <div className="text-6xl font-bold text-white/20 mb-4">SAMPLE</div>
                                        <p className="text-white text-xl font-semibold mb-2">
                                            Preview pages only
                                        </p>
                                        <p className="text-white/60 mb-6">
                                            Purchase the full workbook to access all {numPages} pages
                                        </p>
                                        <button
                                            onClick={() => {
                                                onClose();
                                                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="bg-[#041f50] text-white px-8 py-3 rounded-full font-bold hover:bg-[#052647] transition shadow-lg"
                                        >
                                            Get Full Access
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-slate-900 border-t border-slate-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Page Navigation */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => changePage(-1)}
                                    disabled={pageNumber <= 1}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition text-white"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-white font-medium">
                                    Page {pageNumber} of {numPages}
                                    {isRedactedPage && <span className="text-yellow-400 ml-2">(SAMPLE)</span>}
                                </span>
                                <button
                                    onClick={() => changePage(1)}
                                    disabled={pageNumber >= numPages}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition text-white"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Zoom Controls */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => changeZoom(-0.25)}
                                    disabled={scale <= 0.5}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition text-white"
                                >
                                    <ZoomOut className="w-5 h-5" />
                                </button>
                                <span className="text-white font-medium">
                                    {Math.round(scale * 100)}%
                                </span>
                                <button
                                    onClick={() => changeZoom(0.25)}
                                    disabled={scale >= 2.0}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition text-white"
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
