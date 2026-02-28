import React from "react";
import siteContent from "@/content/site-content.json";

export function PrintLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="bg-slate-300 min-h-screen print:bg-white flex flex-col items-center print:block text-slate-900"
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
            <div className="print:w-full print:h-full w-full max-w-[8.5in]">
                {children}
            </div>
        </div>
    );
}

export function PrintPage({ children, pageNumber, totalPages = 5 }: { children: React.ReactNode, pageNumber: number, totalPages?: number }) {
    return (
        <div
            className="w-[8.5in] h-[11in] bg-white shadow-2xl print:shadow-none mx-auto relative overflow-hidden break-after-page print:break-after-page flex flex-col border-b border-slate-200 print:border-none print:[@page]:margin-0"
            style={{ pageBreakAfter: "always", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
            {/* Background Watermark */}
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
                <img src="/favicon.webp" alt="" className="w-1/2 h-auto object-contain" />
            </div>

            {/* Decorative Header Border */}
            <div className="h-2 w-full bg-gradient-psych" />

            {/* Top Brand Header */}
            <div className="px-8 pt-6 flex justify-between items-center z-10 shrink-0">
                <a href="https://psychassessmentguide.com" target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
                    <img src="/logo.webp" alt="Psychiatric Assessment Guide" className="h-8 w-auto object-contain" />
                </a>
                <div className="text-[10px] font-bold text-psych-navy uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Clinical Reference Sheet
                </div>
            </div>

            {/* Page Content Container with Margins */}
            <div className="px-8 py-6 flex-grow flex flex-col z-10 relative overflow-hidden min-h-0">
                {children}
            </div>

            {/* Footer / Page Number */}
            <div className="h-12 w-full flex flex-col justify-center px-8 bg-slate-50 border-t border-slate-200 shrink-0 z-10">
                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500">
                    <span className="max-w-[80%] leading-tight text-slate-400">
                        {siteContent.global.footerDisclaimer}
                    </span>
                    <span className="font-bold text-psych-navy whitespace-nowrap text-xs">Page {pageNumber} of {totalPages}</span>
                </div>
            </div>
        </div>
    );
}
