"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PROD_BRAND } from "./CalendarTable"

export function CarouselPreview({ slideUrls }: { slideUrls: string[] }) {
    const [currentSlide, setCurrentSlide] = React.useState(0);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", aspectRatio: "1", position: "relative", background: "#f8f9fa", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
                <img
                    src={slideUrls[currentSlide]}
                    alt={`Slide ${currentSlide + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />

                {slideUrls.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev > 0 ? prev - 1 : slideUrls.length - 1)) }}
                            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10 }}
                        >
                            <ChevronLeft size={18} color={PROD_BRAND.navy} />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev < slideUrls.length - 1 ? prev + 1 : 0)) }}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10 }}
                        >
                            <ChevronRight size={18} color={PROD_BRAND.navy} />
                        </button>
                    </>
                )}
            </div>

            {slideUrls.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                    {slideUrls.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrentSlide(i) }}
                            style={{
                                width: 8, height: 8, borderRadius: "50%", padding: 0, border: "none", cursor: "pointer",
                                background: i === currentSlide ? "rgba(139, 92, 246, 1)" : "#d1d5db",
                                opacity: i === currentSlide ? 1 : 0.4,
                                transition: "all 0.2s ease"
                            }}
                        />
                    ))}
                </div>
            )}

            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: PROD_BRAND.gray }}>
                Slide {currentSlide + 1} of {slideUrls.length}
            </div>
        </div>
    );
}
