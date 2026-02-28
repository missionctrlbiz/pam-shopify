"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import siteContent from "@/content/site-content.json";

const content = siteContent.global.cookieBanner;

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if the user has already made a choice
        const cookieChoice = localStorage.getItem("pam_cookie_consent");
        if (!cookieChoice) {
            // Delay showing the banner slightly for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("pam_cookie_consent", "accepted");
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("pam_cookie_consent", "declined");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed bottom-0 left-0 w-full z-[100] px-4 pb-6 sm:pb-8 pointer-events-none print:hidden"
                >
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-6 justify-between relative overflow-hidden">
                            {/* Subtle background glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-psych-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                            <div className="flex items-start md:items-center gap-4 relative z-10 w-full md:w-auto">
                                <div className="bg-psych-purple/20 p-3 rounded-xl flex-shrink-0 self-start md:self-auto border border-psych-purple/30">
                                    <Cookie className="w-6 h-6 text-psych-purple" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Your Privacy Matters</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                                        {content.message}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0 justify-end md:justify-start relative z-10">
                                <button
                                    onClick={handleDecline}
                                    className="px-5 py-2.5 rounded-xl text-slate-300 font-semibold text-sm hover:text-white hover:bg-slate-800 transition"
                                >
                                    {content.decline}
                                </button>
                                <div className="relative group inline-block">
                                    <div className="absolute -inset-0.5 bg-gradient-psych rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                                    <button
                                        onClick={handleAccept}
                                        className="relative bg-gradient-psych text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl transition w-full whitespace-nowrap"
                                    >
                                        {content.accept}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
