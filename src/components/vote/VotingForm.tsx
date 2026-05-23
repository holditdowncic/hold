"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/lib/motion";
import { categories } from "@/data/categories";
import type { UseVoteFormReturn } from "@/lib/useVoteForm";

const categoryIcons: Record<string, string> = {
    community_father: "👨‍👧‍👦",
    mentor_year: "👨‍🏫",
    everyday_hero: "🦸",
    resilient_man: "💪",
    always_there: "🤝",
    young_role_model: "⭐",
};

interface VotingFormProps {
    form: UseVoteFormReturn;
}

export default function VotingForm({ form }: VotingFormProps) {
    const {
        votes,
        companies,
        categoryReasons,
        email,
        reason,
        status,
        message,
        isDeadlinePassed,
        alreadyVoted,
        handleVoteChange,
        handleCompanyChange,
        handleCategoryReasonChange,
        setEmail,
        setReason,
        handleSubmit,
    } = form;

    const inputClass =
        "w-full px-4 py-3 rounded-xl border border-border bg-bg-elevated text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all text-sm font-medium";
    const labelClass = "block text-sm font-semibold text-text-primary mb-2";
    const hintClass = "text-xs text-text-tertiary mt-1.5";

    return (
        <section className="px-5 pb-16 sm:px-6">
            <div className="mx-auto max-w-[800px]">
                {isDeadlinePassed ? (
                    <Reveal>
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
                            <div className="text-4xl mb-4">🕐</div>
                            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-red-400 mb-2">
                                Voting Closed
                            </h2>
                            <p className="text-text-secondary text-sm">
                                The voting period has ended. Thank you to everyone who
                                participated!
                            </p>
                        </div>
                    </Reveal>
                ) : alreadyVoted ? (
                    <Reveal>
                        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
                            <div className="text-4xl mb-4">🎉</div>
                            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-green-400 mb-2">
                                Thank You!
                            </h2>
                            <p className="text-text-secondary text-sm">
                                You have already submitted your votes. Results will be announced
                                at the event.
                            </p>
                        </div>
                    </Reveal>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Nominees Card */}
                        <Reveal>
                            <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8">
                                <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-text-primary mb-2 tracking-tight">
                                    Who Do You Nominate?
                                </h3>
                                <p className="text-sm text-text-tertiary mb-8">
                                    Enter the name of one person for each category. You must vote
                                    in all categories.
                                </p>

                                <div className="space-y-8">
                                    {categories.map((category, index) => (
                                        <Reveal key={category.key} delay={index * 0.04}>
                                            <div className="border-b border-border last:border-0 pb-8 last:pb-0">
                                                <div className="flex items-center gap-2.5 mb-5">
                                                    <span className="text-xl">
                                                        {categoryIcons[category.key] || "🏆"}
                                                    </span>
                                                    <h4 className="text-base font-bold text-text-primary">
                                                        {category.title}
                                                    </h4>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label
                                                            htmlFor={`${category.key}_name`}
                                                            className={labelClass}
                                                        >
                                                            Nominee Name{" "}
                                                            <span className="text-accent">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id={`${category.key}_name`}
                                                            value={votes[category.key] || ""}
                                                            onChange={(e) =>
                                                                handleVoteChange(category.key, e.target.value)
                                                            }
                                                            placeholder={`Enter name for ${category.title}`}
                                                            className={inputClass}
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor={`${category.key}_company`}
                                                            className={labelClass}
                                                        >
                                                            Company / Organisation
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id={`${category.key}_company`}
                                                            value={companies[category.key] || ""}
                                                            onChange={(e) =>
                                                                handleCompanyChange(
                                                                    category.key,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Where do they work?"
                                                            className={inputClass}
                                                        />
                                                        <p className={hintClass}>
                                                            Optional — helps us understand their context
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor={`${category.key}_reason`}
                                                            className={labelClass}
                                                        >
                                                            Why are you nominating them?
                                                        </label>
                                                        <textarea
                                                            id={`${category.key}_reason`}
                                                            value={categoryReasons[category.key] || ""}
                                                            onChange={(e) =>
                                                                handleCategoryReasonChange(
                                                                    category.key,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Tell us 2-3 lines about why they deserve this award..."
                                                            rows={3}
                                                            className={`${inputClass} resize-none`}
                                                        />
                                                        <p className={hintClass}>
                                                            Optional but encouraged — helps us celebrate them
                                                            at the event
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        </Reveal>

                        {/* Your Details Card */}
                        <Reveal delay={0.1}>
                            <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8">
                                <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-text-primary mb-6 tracking-tight">
                                    Your Details
                                </h3>
                                <div>
                                    <label htmlFor="email" className={labelClass}>
                                        Email Address <span className="text-accent">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className={inputClass}
                                        required
                                    />
                                    <p className={hintClass}>
                                        Your email is used to prevent duplicate voting. We will not
                                        share it with third parties.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        {/* Tell Us Why Card */}
                        <Reveal delay={0.15}>
                            <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8">
                                <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-text-primary mb-6 tracking-tight">
                                    Tell Us Why{" "}
                                    <span className="text-text-tertiary font-normal text-sm">
                                        (Optional)
                                    </span>
                                </h3>
                                <div>
                                    <label htmlFor="reason" className={labelClass}>
                                        Why did you choose these individuals?
                                    </label>
                                    <textarea
                                        id="reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Share 2-3 sentences about why these people deserve recognition..."
                                        rows={4}
                                        className={`${inputClass} resize-none`}
                                    />
                                    <p className={hintClass}>
                                        Your words help us celebrate these community heroes at the
                                        event.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        {/* Status Messages */}
                        <AnimatePresence>
                            {status === "error" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400"
                                >
                                    {message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {status === "success" ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center"
                            >
                                <div className="text-4xl mb-3">🎉</div>
                                <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-green-400 mb-2">
                                    Thank You!
                                </h3>
                                <p className="text-green-400/80 text-sm">{message}</p>
                            </motion.div>
                        ) : (
                            <Reveal delay={0.2}>
                                <button
                                    type="submit"
                                    disabled={status === "submitting"}
                                    className="group w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-8 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {status === "submitting" ? (
                                        <>
                                            <svg
                                                className="animate-spin h-5 w-5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                />
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit My Votes
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                            >
                                                <path d="M7 17L17 7M17 7H7M17 7V17" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </Reveal>
                        )}
                    </form>
                )}
            </div>

            {/* Voting Deadline */}
            {!isDeadlinePassed && !alreadyVoted && (
                <Reveal delay={0.25}>
                    <div className="text-center mt-8 mx-auto max-w-[800px]">
                        <div className="inline-flex items-center gap-2 rounded-full border border-accent-warm/20 bg-accent-warm/5 px-5 py-2.5 text-sm font-medium text-accent-warm">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Voting closes on 17 June 2026
                        </div>
                    </div>
                </Reveal>
            )}
        </section>
    );
}
