"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show after a short delay so it doesn't compete with preloader
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[9000] mx-auto max-w-[520px] sm:bottom-6 sm:left-6 sm:right-auto"
        >
          <div className="card-shadow rounded-2xl border border-border bg-bg-elevated p-5 backdrop-blur-xl sm:p-6">
            <div className="mb-4">
              <h3 className="mb-1.5 font-[family-name:var(--font-heading)] text-sm font-semibold text-text-primary">
                We value your privacy
              </h3>
              <p className="text-[0.8rem] leading-relaxed text-text-secondary">
                We use cookies to enhance your browsing experience and remember
                your theme preference. No personal data is collected or shared
                with third parties.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={accept}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-5 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Accept
              </button>
              <button
                onClick={decline}
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-border-hover hover:text-text-primary"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
