"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/lib/motion";
import { categories } from "@/data/categories";

const categoryIcons: Record<string, string> = {
    community_father: "👨‍👧‍👦",
    mentor_year: "👨‍🏫",
    everyday_hero: "🦸",
    resilient_man: "💪",
    always_there: "🤝",
    young_role_model: "⭐",
};

export default function AwardCategories() {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    return (
        <section className="px-5 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-[900px]">
                <Reveal>
                    <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-text-primary mb-12 text-center tracking-tight">
                        Award <span className="text-gradient">Categories</span>
                    </h2>
                </Reveal>

                <div className="grid gap-4 sm:grid-cols-2">
                    {categories.map((category, index) => (
                        <Reveal key={category.key} delay={index * 0.06}>
                            <button
                                onClick={() =>
                                    setExpandedCategory(
                                        expandedCategory === category.key ? null : category.key
                                    )
                                }
                                className={`w-full rounded-2xl border p-5 text-left transition-all ${expandedCategory === category.key
                                        ? "border-accent/40 bg-accent/5 shadow-lg shadow-accent/5"
                                        : "border-border bg-bg-card hover:border-accent/20 hover:bg-bg-card-hover hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/5"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl flex-shrink-0">
                                        {categoryIcons[category.key] || "🏆"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-text-primary truncate">
                                            {category.title}
                                        </h3>
                                    </div>
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className={`flex-shrink-0 text-text-tertiary transition-transform duration-300 ${expandedCategory === category.key ? "rotate-180" : ""
                                            }`}
                                    >
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>

                                <AnimatePresence>
                                    {expandedCategory === category.key && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <p className="mt-4 pt-4 border-t border-border text-sm leading-relaxed text-text-secondary">
                                                {category.description}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
