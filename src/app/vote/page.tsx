"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = [
  { 
    key: "community_father", 
    title: "Community Father Figure",
    description: "A man who consistently shows up for children and families and demonstrates leadership through care, responsibility and guidance."
  },
  { 
    key: "mentor_year", 
    title: "Mentor of the Year",
    description: "A man who supports and guides young people, helping them grow in confidence, character and direction."
  },
  { 
    key: "everyday_hero", 
    title: "Everyday Hero",
    description: "A man whose everyday actions make a meaningful difference to the lives of others."
  },
  { 
    key: "resilient_man", 
    title: "Resilient Man",
    description: "A man who has faced significant challenges and now inspires others through strength, perseverance and support."
  },
  { 
    key: "always_there", 
    title: "The Man Who's Always There",
    description: "A man who is consistently present and dependable for those around him, providing steady support and reliable friendship."
  },
  { 
    key: "young_role_model", 
    title: "Young Male Role Model",
    description: "A young man who demonstrates leadership, integrity and positive influence among his peers and community."
  },
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

      {/* HERO IMAGE - Community Gathering */}
      <section className="relative w-full h-80 sm:h-96 md:h-[450px] overflow-hidden">
        <img
          src="/media/roots/community-gathering.jpg"
          alt="Roots & Wings Community Gathering - Men and families coming together"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30"></div>
      </section>

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden px-5 pt-20 pb-12 sm:px-6 sm:pt-28">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--hero-glow-1) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, var(--hero-glow-2) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,6vw,4rem)] font-bold leading-tight tracking-tight mb-3 text-center text-text-primary">
              The Roots & Wings Community Awards 2026
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 text-center">
              Celebrating the men who show up
            </h2>
            <p className="mx-auto max-w-[800px] text-base leading-relaxed text-text-secondary md:text-lg mb-6 text-center">
              Recognising the men whose influence strengthens families and communities across South London.
            </p>
            <p className="mx-auto max-w-[800px] text-base leading-relaxed text-text-secondary md:text-lg mb-8 text-center">
              Across our communities there are men who quietly shape lives through their presence, consistency and care. They guide young people, support families and demonstrate leadership in ways that are often unseen but deeply felt.
            </p>
            <p className="mx-auto max-w-[800px] text-base leading-relaxed text-text-secondary md:text-lg text-center">
              The Roots & Wings Community Awards were created to recognise these men and celebrate the influence they carry within our communities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. CREDIBILITY LINE */}
      <section className="px-5 py-8 sm:px-6 bg-blue-900 text-white text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-[900px]"
        >
          <p className="text-base md:text-lg font-semibold">
            Last year more than 250 people attended Roots & Wings to celebrate fathers, families and community leadership.
          </p>
        </motion.div>
      </section>

      {/* 3. WHY THESE AWARDS MATTER */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-8 text-center">
              Why These Awards Matter
            </h2>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-6 text-center">
              Many men contribute to their communities without recognition. They mentor young people, support families and lead by example through their actions.
            </p>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-6 text-center">
              The Roots & Wings Community Awards shine a light on these men and celebrate the positive influence they bring to their communities.
            </p>
            <p className="text-base md:text-lg font-semibold text-text-primary text-center">
              Your vote helps ensure their impact is seen and valued.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 4. ROOTS & WINGS THEME LINE */}
      <section className="px-5 py-12 sm:px-6 bg-yellow-50">
        <div className="mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
              Roots & Wings 2026
            </h3>
            <p className="text-lg md:text-xl font-semibold text-text-primary">
              Three Generations. One Influence
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. AWARD CATEGORIES WITH DEFINITIONS */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-[900px]">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-3xl md:text-4xl font-bold text-text-primary mb-12 text-center"
          >
            Award Categories
          </motion.h2>
          
          <div className="space-y-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
              >
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.key ? null : category.key)}
                  className="w-full bg-white rounded-lg p-6 border border-border hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-blue-900">
                      {category.title}
                    </h3>
                    <span className={`text-2xl font-bold text-blue-900 transition-transform ${expandedCategory === category.key ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>
                
                {expandedCategory === category.key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-blue-50 px-6 py-4 rounded-b-lg border-l border-r border-b border-border"
                  >
                    <p className="text-text-secondary text-base leading-relaxed">
                      {category.description}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CAST YOUR VOTE SECTION (Above Form) */}
      <section className="px-5 py-12 sm:px-6 bg-blue-50">
        <div className="mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Cast Your Vote
            </h2>
            <p className="text-lg md:text-xl text-text-secondary mb-6">
              Take 30 seconds to recognise a man making a difference.
            </p>
            <p className="text-base md:text-lg text-text-secondary mb-8">
              Your vote helps celebrate the fathers, mentors and role models whose influence strengthens our communities.
            </p>
            <div className="bg-blue-900 text-white px-6 py-4 rounded-lg font-semibold inline-block">
              Join hundreds of people recognising men in our community.
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. VOTING FORM */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-[800px]">
          {isDeadlinePassed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-red-500 mb-2">Voting Closed</h2>
              <p className="text-text-secondary">The voting period has ended. Thank you to everyone who participated!</p>
            </motion.div>
          ) : alreadyVoted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-green-500 mb-2">Thank You!</h2>
              <p className="text-text-secondary">You have already submitted your votes. Results will be announced at the event.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nominees */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm"
                >
                  <h3 className="text-2xl font-bold text-text-primary mb-6">Who Do You Nominate?</h3>
                  <p className="text-sm text-text-secondary mb-8">
                    Enter the name and company/organisation of one person for each category. You must vote in all categories.
                  </p>

                  <div className="space-y-8">
                    {categories.map((category, index) => (
                      <motion.div
                        key={category.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                        className="border-b border-border last:border-0 pb-8 last:pb-0"
                      >
                        <h4 className="text-lg font-semibold text-blue-900 mb-4">
                          {category.title}
                        </h4>
                        
                        <div className="mb-4">
                          <label 
                            htmlFor={`${category.key}_name`}
                            className="block text-sm font-medium text-text-primary mb-2"
                          >
                            Nominee Name *
                          </label>
                          <input
                            type="text"
                            id={`${category.key}_name`}
                            value={votes[category.key] || ""}
                            onChange={(e) => handleVoteChange(category.key, e.target.value)}
                            placeholder={`Enter name for ${category.title}`}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label 
                            htmlFor={`${category.key}_company`}
                            className="block text-sm font-medium text-text-primary mb-2"
                          >
                            Company / Organisation
                          </label>
                          <input
                            type="text"
                            id={`${category.key}_company`}
                            placeholder="Where do they work?"
                            className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-text-secondary mt-1">
                            Optional - helps us understand their context
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Your Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm"
                >
                  <h3 className="text-2xl font-bold text-text-primary mb-6">Your Details</h3>
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
                      className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <p className="text-xs text-text-secondary mt-2">
                      Your email is used to prevent duplicate voting. We will not share it with third parties.
                    </p>
                  </div>
                </motion.div>

                {/* Why They Deserve Recognition */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm"
                >
                  <h3 className="text-2xl font-bold text-text-primary mb-6">Tell Us Why (Optional)</h3>
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
                      className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-text-secondary mt-2">
                      Optional — but your words help us celebrate these community heroes at the event.
                    </p>
                  </div>
                </motion.div>

                {/* Status Messages */}
                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500"
                  >
                    {message}
                  </motion.div>
                )}

                {status === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center"
                  >
                    <h3 className="font-bold text-lg text-green-600 mb-2">Thank You!</h3>
                    <p className="text-green-600">{message}</p>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-4 px-6 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "submitting" ? "Submitting..." : "Submit My Votes"}
                  </motion.button>
                )}
              </form>
          )}
        </div>

        {/* 8. VOTING DEADLINE (Below Form) */}
        {!isDeadlinePassed && !alreadyVoted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200"
          >
            <p className="text-lg font-semibold text-blue-900">
              Voting closes on 16 May 2026
            </p>
          </motion.div>
        )}
      </section>

      {/* 9. EVENT ANNOUNCEMENT */}
      <section className="px-5 py-16 sm:px-6 bg-blue-900 text-white">
        <div className="mx-auto max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Where Winners Will Be Announced
            </h2>
            
            <div className="bg-white/10 rounded-lg p-8 text-center backdrop-blur-sm">
              <p className="text-lg mb-8">
                Winners will be announced during the Roots & Wings Family Fun Day.
              </p>
              
              <div className="mb-8">
                <p className="text-2xl font-bold mb-4">Saturday 20 June 2026</p>
                <div className="text-base leading-relaxed space-y-1">
                  <p>Heavers Farm Primary School</p>
                  <p>58 Dinsdale Gardens</p>
                  <p>South Norwood, London SE25 6LT</p>
                </div>
              </div>

              <p className="text-base opacity-90">
                Roots & Wings brings together families, fathers and community members for a day of football, games, performances, food and celebration.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10. SHARE PROMPT */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Share the Recognition
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 max-w-[700px] mx-auto">
              Know someone who deserves recognition? Share this page and invite others to vote so we can celebrate the men whose influence strengthens our communities.
            </p>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-8 py-4 rounded-lg font-semibold transition-colors">
              Share This Page
            </button>
          </motion.div>
        </div>
      </section>

      {/* 11. NOMINATE FOR NEXT YEAR */}
      <section className="px-5 py-16 sm:px-6 bg-bg-card/50">
        <div className="mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Nominate for Next Year
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 max-w-[700px] mx-auto">
              If you know a father, mentor or male role model who deserves recognition in future Roots & Wings awards, we welcome nominations for next year.
            </p>
            <p className="text-lg font-semibold text-blue-900">
              Email: <a href="mailto:holditdownuk@hotmail.com" className="hover:underline">holditdownuk@hotmail.com</a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* 12. CLOSING STATEMENT */}
      <section className="px-5 py-16 sm:px-6">
        <div className="mx-auto max-w-[900px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="bg-white rounded-lg p-10 border-2 border-blue-900"
          >
            <p className="text-lg md:text-xl font-semibold text-text-primary leading-relaxed mb-6">
              Every vote is a chance to recognise a man who is making a difference.
            </p>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed">
              Help us celebrate the fathers, mentors and role models shaping our communities. Together we honour the influence that often goes unseen but never goes unfelt.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
