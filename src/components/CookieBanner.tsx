"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BannerContent {
    message: string;
    accept_text: string;
    decline_text: string;
    policy_link: string | null;
    enabled: boolean;
}

const STORAGE_KEY = "hold-cookie-consent";

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [content, setContent] = useState<BannerContent | null>(null);

    useEffect(() => {
        // Already consented? Don't load anything
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return;

        // Fetch content from API (so Telegram CMS can control it)
        fetch("/api/cookie-banner")
            .then((r) => r.json())
            .then((data: BannerContent) => {
                if (!data.enabled) return;
                setContent(data);
                // Small delay so it doesn't compete with page load animations
                setTimeout(() => setVisible(true), 1500);
            })
            .catch(() => {
                // Fallback to defaults if API fails
                setContent({
                    message:
                        "We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.",
                    accept_text: "Accept All",
                    decline_text: "Decline",
                    policy_link: null,
                    enabled: true,
                });
                setTimeout(() => setVisible(true), 1500);
            });
    }, []);

    function handleAccept() {
        localStorage.setItem(STORAGE_KEY, "accepted");
        setVisible(false);
    }

    function handleDecline() {
        localStorage.setItem(STORAGE_KEY, "declined");
        setVisible(false);
    }

    if (!content) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
                >
                    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-xl">
                        {/* Accent top border */}
                        <div className="h-[2px] w-full bg-gradient-to-r from-accent via-accent-warm to-accent" />

                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                            {/* Cookie icon + message */}
                            <div className="flex flex-1 items-start gap-3 sm:items-center">
                                <span className="mt-0.5 text-2xl sm:mt-0">🍪</span>
                                <p className="text-sm leading-relaxed text-text-secondary sm:text-[0.925rem]">
                                    {content.message}
                                    {content.policy_link && (
                                        <>
                                            {" "}
                                            <a
                                                href={content.policy_link}
                                                className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-warm"
                                            >
                                                Learn more
                                            </a>
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex shrink-0 gap-3">
                                <button
                                    onClick={handleDecline}
                                    className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-white/20 hover:bg-white/5 hover:text-text-primary"
                                >
                                    {content.decline_text}
                                </button>
                                <button
                                    onClick={handleAccept}
                                    className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-warm hover:shadow-accent-warm/25"
                                >
                                    {content.accept_text}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
