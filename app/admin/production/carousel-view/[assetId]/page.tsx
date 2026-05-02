"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Layout,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CarouselAsset {
  id: string;
  assetType: string;
  storageUrl: string;
  fileName: string | null;
  metadata: {
    slideUrls?: string[];
    zipUrl?: string;
    ratioVariants?: Record<string, string[]>;
    topic?: string;
  } | null;
  contentIdea?: {
    id: string;
    calendarEntry?: {
      id: string;
      topic: string;
      dayNumber: number;
      platform: string;
    };
  };
}

// ── Ratio config (Clinical Premium) ──────────────────────────────────────────

const RATIO_CONFIG = [
  {
    key: "1:1",
    label: "Square Feed",
    platform: "Instagram / LinkedIn",
    aspectClass: "aspect-square",
    icon: <Smartphone size={14} />,
    width: "320px",
  },
  {
    key: "4:5",
    label: "Portrait Feed",
    platform: "Instagram Premium",
    aspectClass: "aspect-[4/5]",
    icon: <Smartphone size={14} />,
    showControls: true,
    width: "280px",
  },
  {
    key: "9:16",
    label: "Vertical Story",
    platform: "Reels / TikTok",
    aspectClass: "aspect-[9/16]",
    icon: <Smartphone size={14} />,
    width: "240px",
  },
];

const BRAND = {
  navy: "#041f50",
  purple: "#af5ce9",
  green: "#10b981",
  slate: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  gradient: "linear-gradient(135deg, #041f50 0%, #af5ce9 100%)",
};

// ── Page component ────────────────────────────────────────────────────────────

export default function CarouselViewPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<CarouselAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/production/assets/${assetId}`);
        if (!res.ok) throw new Error("Failed to fetch asset details");
        const data = await res.json();
        setAsset(data.asset);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Internal Error");
      } finally {
        setLoading(false);
      }
    };
    void fetchAsset();
  }, [assetId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const slideUrls = asset?.metadata?.slideUrls || [];
  const zipUrl = asset?.metadata?.zipUrl;
  const topic = asset?.contentIdea?.calendarEntry?.topic || asset?.metadata?.topic || "Clinical Carousel Preview";
  const entry = asset?.contentIdea?.calendarEntry;

  const getProxyUrl = (url: string) => `/api/production/assets/proxy?url=${encodeURIComponent(url)}`;

  const handleDownloadBatch = () => {
    if (!zipUrl) {
      alert("Full batch download is still processing or unavailable for this asset.");
      return;
    }
    const filename = `${(asset?.fileName || "carousel").replace(".png", "")}_batch.zip`;
    const dlUrl = `/api/production/assets/proxy?url=${encodeURIComponent(zipUrl)}&filename=${encodeURIComponent(filename)}`;
    window.open(dlUrl, "_blank");
  };

  const prevSlide = () => setCurrentSlide((prev) => Math.max(0, prev - 1));
  const nextSlide = () => setCurrentSlide((prev) => Math.min(slideUrls.length - 1, prev + 1));

  // ── Loading & Error States ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="animate-spin text-[#af5ce9] opacity-30" />
        <p className="text-sm font-bold text-[#041f50]/40 tracking-widest uppercase">Initializing Canvas</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Layout size={64} className="text-slate-200 mb-6" />
        <h1 className="text-2xl font-black text-[#041f50] mb-2 font-montserrat">Asset Initialization Failed</h1>
        <p className="text-slate-500 max-w-sm text-sm mb-8">{error || "This specific clinical distribution asset could not be resolved."}</p>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-[#041f50] text-white rounded-2xl font-bold text-sm hover:translate-y-[-2px] transition-all shadow-xl shadow-[#041f50]/20"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#041f50] font-sans selection:bg-[#af5ce9]/20">
      {/* ── Fixed Header ────────────────────────────────────────────────── */}
      <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-[100]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#041f50] transition-all group"
          >
            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <span className="bg-[#041f50] text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-tighter">
                ASSET {asset.id.slice(0, 5).toUpperCase()}
              </span>
              <h1 className="text-lg font-black tracking-tight leading-none">
                {topic}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>D{entry?.dayNumber ?? "00"} Master</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{slideUrls.length} Sequence Slides</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>Clinical Grade</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            disabled={!zipUrl}
            onClick={handleDownloadBatch}
            className="h-12 px-6 rounded-2xl bg-white border-2 border-slate-200 text-[#041f50] font-bold text-sm hover:border-[#af5ce9] hover:text-[#af5ce9] transition-all flex items-center gap-2 group disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-[#041f50]"
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
            Download Batch (ZIP)
          </button>
          <button 
            className="h-12 px-8 rounded-2xl bg-[#041f50] text-white font-bold text-sm hover:shadow-2xl hover:shadow-[#041f50]/40 transition-all flex items-center gap-2"
            style={{ background: BRAND.gradient }}
          >
            <ExternalLink size={18} />
            Publish Now
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-10 pb-32">
        {/* Viewport Label */}
        <div className="flex items-center justify-between mb-10 border-b border-slate-200 pb-6">
           <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Multi-Ratio Simulation</h2>
              <p className="text-sm text-slate-500 font-medium">Verify visual integrity across standard social distributions.</p>
           </div>
           <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Sequence</span>
                <span className="text-xl font-black tabular-nums">{currentSlide + 1} / {slideUrls.length}</span>
              </div>
           </div>
        </div>

        {/* ── The Great Simulation Grid ──────────────────────────────────── */}
        <div className="flex items-start justify-center gap-12 flex-wrap">
          {RATIO_CONFIG.map((ratio) => (
            <div key={ratio.key} className="flex flex-col items-center gap-4 group" style={{ width: ratio.width }}>
              {/* Ratio Label Tab */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-t-2xl bg-white border border-slate-200 border-b-0 shadow-sm">
                <span className="text-[#af5ce9]">{ratio.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#041f50]">{ratio.label}</span>
              </div>

               {/* The Frame */}
              <div className={`w-full ${ratio.aspectClass} relative rounded-[2.5rem] p-3 bg-[#041f50] shadow-[0_30px_60px_-12px_rgba(4,31,80,0.3)] ring-1 ring-white/10 overflow-hidden`}>
                {/* Screen container */}
                <div className="w-full h-full rounded-[2rem] bg-white overflow-hidden relative border border-white/20">
                   <AnimatePresence mode="wait">
                      <motion.img
                        key={`${ratio.key}-${currentSlide}`}
                        src={getProxyUrl(asset.metadata?.ratioVariants?.[ratio.key]?.[currentSlide] || slideUrls[currentSlide])}
                        className="w-full h-full object-contain pointer-events-none"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      />
                   </AnimatePresence>

                   {/* Overlay controls - mainly for central interaction */}
                   {ratio.showControls && (
                      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                         <button 
                           onClick={(e) => { e.stopPropagation(); prevSlide() }}
                           disabled={currentSlide === 0}
                           className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-[#041f50] pointer-events-auto hover:bg-white disabled:opacity-0 transition-all -translate-x-2 group-hover:translate-x-0"
                         >
                            <ChevronLeft size={24} />
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); nextSlide() }}
                           disabled={currentSlide === slideUrls.length - 1}
                           className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-[#041f50] pointer-events-auto hover:bg-white disabled:opacity-0 transition-all translate-x-2 group-hover:translate-x-0"
                         >
                            <ChevronRight size={24} />
                         </button>
                      </div>
                   )}
                </div>
              </div>

              {/* Platform Metadata Footer */}
              <div className="text-center mt-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ratio.platform}</p>
                 <p className="text-[10px] text-slate-300 font-bold">{ratio.key} Ratio</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Navigation Strip ───────────────────────────────────────────── */}
        <div className="mt-20 flex flex-col items-center gap-10">
            {/* Dots */}
            <div className="flex gap-2">
              {slideUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 transition-all rounded-full ${
                    currentSlide === i ? "w-10 bg-[#af5ce9] shadow-[0_0_15px_rgba(175,92,233,0.5)]" : "w-2 bg-slate-200 hover:bg-slate-300"
                  }`}
                />
              ))}
            </div>

            {/* Filmstrip */}
            <div className="w-full bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Slide Sequence Strip</h3>
               <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-none justify-center">
                  {slideUrls.map((url, i) => (
                    <button
                      key={url}
                      onClick={() => setCurrentSlide(i)}
                      className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden transition-all duration-300 ${
                        currentSlide === i 
                          ? "ring-4 ring-[#af5ce9] ring-offset-4 scale-110 z-10 shadow-2xl" 
                          : "opacity-40 hover:opacity-80 grayscale hover:grayscale-0 hover:scale-105"
                      }`}
                    >
                      <img src={getProxyUrl(url)} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm">
                        {i + 1}
                      </div>
                    </button>
                  ))}
               </div>
            </div>
        </div>
      </main>

      {/* ── Global Styles for a cleaner view ────────────────────────────── */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
