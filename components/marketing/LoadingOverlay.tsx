"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Full-viewport loading spinner shown on first paint of every marketing page.
 *
 * Behaviour:
 * - Mounts immediately as a fixed overlay (z-index above the hidden nav).
 * - Hides once `window.load` fires so the user sees a spinner only while the
 *   page is genuinely still loading (fonts, hero video, etc.).
 * - Has a 2.5 s safety fallback in case `load` is delayed by a stalled asset,
 *   so the overlay can never trap the page.
 * - Uses the PAM brand gradient for the ring colour so it feels native.
 */
export function MarketingLoadingOverlay() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const hide = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      setHidden(true);
    };

    if (document.readyState === "complete") {
      // Page already loaded by the time we hydrated — give the spinner a
      // beat so it doesn't flash on instant navigations.
      timer = setTimeout(hide, 50);
    } else {
      window.addEventListener("load", hide, { once: true });
      timer = setTimeout(hide, 2500);
    }

    return () => {
      window.removeEventListener("load", hide);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="marketing-loading-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-white"
          role="status"
          aria-live="polite"
          aria-label="Loading page"
        >
          <div
            className="absolute inset-0 opacity-60 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(175,92,233,0.12), rgba(4,31,80,0.04) 60%, transparent 80%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2
                className="w-12 h-12 text-psych-purple animate-spin"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 blur-2xl opacity-50"
                style={{
                  background:
                    "radial-gradient(circle, rgba(175,92,233,0.55), transparent 70%)",
                }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-psych-navy/60">
              Loading
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
