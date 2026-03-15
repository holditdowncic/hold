"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const DEFAULT_AMOUNTS = [10, 25, 50, 100];

type DonatePageProps = {
  suggestedAmounts?: number[];
  minimumAmount?: number;
  paymentLinkUrl?: string | null;
};

export default function DonatePage({
  suggestedAmounts = DEFAULT_AMOUNTS,
  minimumAmount = 5,
  paymentLinkUrl = null,
}: DonatePageProps) {
  const sortedAmounts = useMemo(
    () => [...new Set(suggestedAmounts.filter((value) => value >= minimumAmount))].sort((a, b) => a - b),
    [minimumAmount, suggestedAmounts]
  );
  const initialAmount = sortedAmounts[1] || sortedAmounts[0] || minimumAmount;

  const [selectedAmount, setSelectedAmount] = useState<number>(initialAmount);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const effectiveAmount = customAmount.trim() ? Number(customAmount) : selectedAmount;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (paymentLinkUrl) {
      window.location.assign(paymentLinkUrl);
      return;
    }

    const amount = Math.round(Number(effectiveAmount) * 100);
    if (!Number.isFinite(amount) || amount < minimumAmount * 100) {
      setSubmitting(false);
      setError(`Enter at least £${minimumAmount}.`);
      return;
    }

    try {
      const response = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          donorName,
          donorEmail,
          message,
        }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to start Stripe checkout.");
      }

      window.location.assign(payload.url);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Unable to start Stripe checkout.");
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-5 pt-28 pb-12 sm:px-6 sm:pt-32 md:pb-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,var(--color-accent-glow),transparent)]" />
          <div className="relative mx-auto max-w-[1200px]">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div>
                <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                  Donate
                </span>
                <h1 className="max-w-[720px] font-[family-name:var(--font-heading)] text-[clamp(2.2rem,5vw,4rem)] font-bold leading-tight tracking-tight">
                  Back youth mentoring, family support, and community work in South London.
                </h1>
                <p className="mt-5 max-w-[640px] text-base leading-relaxed text-text-secondary md:text-lg">
                  Your donation helps Hold It Down CIC fund safe spaces, workshops, mentoring, fatherhood support,
                  intergenerational activities, and practical resources for young people and families.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    "Mentoring sessions and facilitator time",
                    "Programme materials, food, and venue costs",
                    "Community events and family support activity",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-text-secondary">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-bg-card p-6 shadow-sm sm:p-8">
                <div className="mb-6">
                  <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold">Secure Stripe donation</h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {paymentLinkUrl
                      ? "You already have a live Stripe payment page. We&apos;ll send donors there directly."
                      : `Choose an amount and we&apos;ll send you to Stripe Checkout. Minimum donation is £${minimumAmount}.`}
                  </p>
                </div>

                {paymentLinkUrl ? (
                  <div className="rounded-2xl border border-border bg-bg p-5">
                    <p className="text-sm leading-relaxed text-text-secondary">
                      Stripe will let donors choose their own amount on the hosted payment page. You already configured
                      that link inside Stripe, so the website just needs to send people there.
                    </p>
                  </div>
                ) : (
                  <>
                    <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                      Choose an amount
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {sortedAmounts.map((amount) => {
                        const isActive = !customAmount.trim() && selectedAmount === amount;
                        return (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => {
                              setSelectedAmount(amount);
                              setCustomAmount("");
                            }}
                            className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                              isActive
                                ? "border-accent bg-accent/10 text-text-primary"
                                : "border-border bg-bg transition-colors hover:border-border-hover hover:bg-bg-card-hover"
                            }`}
                          >
                            <span className="block text-xs uppercase tracking-[0.14em] text-text-tertiary">Donate</span>
                            <span className="mt-1 block text-2xl font-semibold text-text-primary">£{amount}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <label htmlFor="custom-amount" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                        Or enter a custom amount
                      </label>
                      <div className="flex items-center rounded-2xl border border-border bg-bg px-4 focus-within:border-accent/30">
                        <span className="text-lg font-semibold text-text-primary">£</span>
                        <input
                          id="custom-amount"
                          inputMode="decimal"
                          value={customAmount}
                          onChange={(event) => setCustomAmount(event.target.value)}
                          placeholder={`${minimumAmount}.00`}
                          className="w-full bg-transparent px-3 py-3.5 text-base text-text-primary outline-none placeholder:text-text-tertiary"
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="donor-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                          Name
                        </label>
                        <input
                          id="donor-name"
                          value={donorName}
                          onChange={(event) => setDonorName(event.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-2xl border border-border bg-bg px-4 py-3.5 text-sm text-text-primary outline-none transition-all focus:border-accent/30"
                        />
                      </div>
                      <div>
                        <label htmlFor="donor-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                          Email
                        </label>
                        <input
                          id="donor-email"
                          type="email"
                          value={donorEmail}
                          onChange={(event) => setDonorEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-2xl border border-border bg-bg px-4 py-3.5 text-sm text-text-primary outline-none transition-all focus:border-accent/30"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="donor-message" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                        Message
                      </label>
                      <textarea
                        id="donor-message"
                        rows={4}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Optional note for your records"
                        className="w-full resize-none rounded-2xl border border-border bg-bg px-4 py-3.5 text-sm text-text-primary outline-none transition-all focus:border-accent/30"
                      />
                    </div>
                  </>
                )}

                {error ? (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Redirecting to Stripe..."
                    : paymentLinkUrl
                      ? "Continue to Stripe donation page"
                      : `Donate £${Number(effectiveAmount || selectedAmount).toFixed(2)}`}
                </button>

                <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
                  Payments are processed securely by Stripe. By donating, you agree to the terms on the{" "}
                  <Link href="/refund-policy" className="text-accent hover:text-accent-warm">
                    refund policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="text-accent hover:text-accent-warm">
                    website terms
                  </Link>
                  .
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
