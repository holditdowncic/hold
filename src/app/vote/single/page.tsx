"use client";

import { useState, useEffect } from "react";
import { categories, VOTING_DEADLINE } from "@/data/categories";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const categoryIcons: Record<string, string> = {
  community_father: "👨‍👧‍👦",
  mentor_year: "👨‍🏫",
  everyday_hero: "🦸",
  resilient_man: "💪",
  always_there: "🤝",
  young_role_model: "⭐",
};

export default function SingleVotePage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeCompany, setNomineeCompany] = useState("");
  const [nomineeReason, setNomineeReason] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    setIsDeadlinePassed(new Date() > VOTING_DEADLINE);
    if (localStorage.getItem("rootswings_voted")) setAlreadyVoted(true);
  }, []);

  const activeCategory = categories.find((c) => c.key === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setMessage("Please select an award category.");
      setStatus("error");
      return;
    }
    if (!nomineeName.trim()) {
      setMessage("Please enter the name of your nominee.");
      setStatus("error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/vote-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryKey: selectedCategory,
          nomineeName,
          nomineeCompany,
          nomineeReason,
          email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Thank you! Your vote has been submitted.");
        localStorage.setItem("rootswings_voted", "true");
        setAlreadyVoted(true);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to submit vote. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-border bg-bg-elevated text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all text-sm font-medium";
  const labelClass = "block text-sm font-semibold text-text-primary mb-2";
  const hintClass = "text-xs text-text-tertiary mt-1.5";

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-28 pb-12 sm:px-6 sm:pt-32 md:pb-16 text-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[700px]">
          <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
            Cast Your Vote
          </span>
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3rem)] font-bold leading-tight tracking-tight mb-4">
            Hold It Down Awards
          </h1>
          <p className="text-base leading-relaxed text-text-secondary md:text-lg">
            Choose <strong>one category</strong> and nominate the person who deserves recognition. One vote per person.
          </p>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6">
        <div className="mx-auto max-w-[700px]">

          {isDeadlinePassed ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
              <div className="text-4xl mb-4">🕐</div>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-red-400 mb-2">Voting Closed</h2>
              <p className="text-text-secondary text-sm">The voting period has ended. Thank you to everyone who participated!</p>
            </div>
          ) : alreadyVoted ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-green-400 mb-2">Vote Received!</h2>
              <p className="text-text-secondary text-sm">You have already submitted your vote. Results will be announced at the event.</p>
            </div>
          ) : status === "success" ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-green-400 mb-2">Thank You!</h2>
              <p className="text-green-400/80 text-sm">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Step 1 — Pick Category */}
              <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8">
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-text-primary mb-2">
                  Step 1 — Choose a Category
                </h3>
                <p className="text-sm text-text-tertiary mb-6">Select the award category you want to vote in.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        selectedCategory === cat.key
                          ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                          : "border-border bg-bg-elevated hover:border-accent/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryIcons[cat.key] || "🏆"}</span>
                        <span className="text-sm font-bold text-text-primary">{cat.title}</span>
                      </div>
                      <p className="text-xs text-text-tertiary leading-relaxed">{cat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 — Nominee details (shown once category selected) */}
              {activeCategory && (
                <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8 space-y-5">
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-text-primary mb-1">
                      Step 2 — Your Nominee
                    </h3>
                    <p className="text-sm text-text-tertiary">
                      Nominating for: <span className="text-accent font-semibold">{activeCategory.title}</span>
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Nominee Name <span className="text-accent">*</span></label>
                    <input
                      type="text"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      placeholder="Full name of your nominee"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Company / Organisation</label>
                    <input
                      type="text"
                      value={nomineeCompany}
                      onChange={(e) => setNomineeCompany(e.target.value)}
                      placeholder="Where do they work or volunteer?"
                      className={inputClass}
                    />
                    <p className={hintClass}>Optional — helps us understand their context</p>
                  </div>

                  <div>
                    <label className={labelClass}>Why are you nominating them?</label>
                    <textarea
                      value={nomineeReason}
                      onChange={(e) => setNomineeReason(e.target.value)}
                      placeholder="Tell us 2–3 lines about why they deserve this award..."
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                    <p className={hintClass}>Optional but encouraged — helps us celebrate them at the event</p>
                  </div>
                </div>
              )}

              {/* Step 3 — Your details */}
              {activeCategory && (
                <div className="rounded-2xl border border-border bg-bg-card p-6 md:p-8">
                  <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-text-primary mb-6">
                    Step 3 — Your Details
                  </h3>
                  <div>
                    <label className={labelClass}>Email Address <span className="text-accent">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={inputClass}
                      required
                    />
                    <p className={hintClass}>Used to prevent duplicate voting. We will not share it with third parties.</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {status === "error" && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                  {message}
                </div>
              )}

              {/* Submit */}
              {activeCategory && (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="group w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-8 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Submitting..." : "Submit My Vote"}
                  {status !== "submitting" && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  )}
                </button>
              )}
            </form>
          )}

          {/* Deadline notice */}
          {!isDeadlinePassed && !alreadyVoted && status !== "success" && (
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-warm/20 bg-accent-warm/5 px-5 py-2.5 text-sm font-medium text-accent-warm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                Voting closes on 16 May 2026
              </div>
            </div>
          )}

          {/* Link to org voting */}
          <div className="text-center mt-6">
            <p className="text-sm text-text-tertiary">
              Are you an organisation?{" "}
              <Link href="/vote" className="text-accent font-semibold hover:underline">
                Vote across all 6 categories →
              </Link>
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
