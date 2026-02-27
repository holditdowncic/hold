"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = [
  { key: "community_father", title: "Community Father Figure" },
  { key: "everyday_hero", title: "Everyday Hero" },
  { key: "mentor_year", title: "Mentor of the Year" },
  { key: "resilient_man", title: "Resilient Man" },
  { key: "always_there", title: "The Man Who's Always There" },
  { key: "young_role_model", title: "Young Male Role Model" },
];

const VOTING_DEADLINE = new Date("2026-05-16T23:59:59");

export default function VotePage() {
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    const now = new Date();
    setIsDeadlinePassed(now > VOTING_DEADLINE);
    const voted = localStorage.getItem("rootswings_voted");
    if (voted) setAlreadyVoted(true);
  }, []);

  const handleVoteChange = (categoryKey: string, value: string) => {
    setVotes((prev) => ({ ...prev, [categoryKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDeadlinePassed) {
      setMessage("Voting has closed. The deadline was May 16th, 2026.");
      setStatus("error");
      return;
    }

    if (alreadyVoted) {
      setMessage("You have already submitted your votes.");
      setStatus("error");
      return;
    }

    const missingCategories = categories.filter((cat) => !votes[cat.key]?.trim());
    if (missingCategories.length > 0) {
      setMessage(`Please enter a nominee for: ${missingCategories.map(c => c.title).join(", ")}`);
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
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes, email, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Thank you! Your votes have been submitted.");
        localStorage.setItem("rootswings_voted", "true");
        setAlreadyVoted(true);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to submit votes. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden px-5 pt-28 pb-12 sm:px-6 sm:pt-32">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[800px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Roots & Wings 2026
            </span>
            <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight tracking-tight mb-4">
              <span className="text-gradient">Community Awards</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg mb-6">
              Vote for the individuals who make a difference in our community. 
              Recognise the fathers, mentors, and role models who inspire us all.
            </p>

            <div className="inline-block bg-yellow-400 text-blue-900 px-6 py-3 rounded-full font-bold">
              Voting closes: 16th May 2026
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-6">
        <div className="mx-auto max-w-[700px]">
          {isDeadlinePassed ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-2">Voting Closed</h2>
              <p className="text-text-secondary">The voting period has ended. Thank you to everyone who participated!</p>
            </div>
          ) : alreadyVoted ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-green-500 mb-2">Thank You!</h2>
              <p className="text-text-secondary">You have already submitted your votes. Results will be announced at the event.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-6">Cast Your Votes</h2>
                <p className="text-sm text-text-secondary mb-6">
                  Enter the name of one person for each category. You must vote in all categories.
                </p>

                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category.key} className="border-b border-border last:border-0 pb-6 last:pb-0">
                      <label 
                        htmlFor={category.key}
                        className="block text-sm font-medium text-text-primary mb-2"
                      >
                        {category.title} *
                      </label>
                      <input
                        type="text"
                        id={category.key}
                        value={votes[category.key] || ""}
                        onChange={(e) => handleVoteChange(category.key, e.target.value)}
                        placeholder={`Enter nominee for ${category.title}`}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-bg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-4">Your Details</h2>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-bg focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    required
                  />
                  <p className="text-xs text-text-secondary mt-2">
                    Your email is used to prevent duplicate voting. We will not share it with third parties.
                  </p>
                </div>
              </div>

              <div className="bg-bg-card border border-border rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-4">Tell Us Why (Optional)</h2>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-text-primary mb-2">
                    Why did you choose these individuals?
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Share 2-3 sentences about why these people deserve recognition. What impact have they made in your community?"
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-bg focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-text-secondary mt-2">
                    Optional — but your words help us celebrate these community heroes at the event.
                  </p>
                </div>
              </div>

              {status === "error" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500">
                  {message}
                </div>
              )}

              {status === "success" ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-500 text-center">
                  <h3 className="font-semibold text-lg mb-1">Thank You!</h3>
                  <p>{message}</p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full bg-accent hover:bg-accent-warm text-white font-bold py-4 px-6 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Submitting..." : "Submit Votes"}
                </button>
              )}
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
