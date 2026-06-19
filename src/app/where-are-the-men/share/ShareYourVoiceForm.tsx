"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function ShareYourVoiceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/where-are-the-men/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      window.setTimeout(() => router.push(data.redirectTo || "/"), 2200);
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  const inputClasses =
    "w-full rounded-2xl border border-[#d7c8b6] bg-white px-4 py-3 text-base text-[#21180f] outline-none transition focus:border-[#5f9b16] focus:ring-4 focus:ring-[#5f9b16]/15";

  return (
    <main className="min-h-screen bg-[#f7f1e5] px-4 py-6 text-[#21180f] sm:px-8 sm:py-10">
      <section
        className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl flex-col justify-center sm:min-h-[calc(100vh-5rem)]"
        style={{ maxWidth: "36rem" }}
      >
        <div className="rounded-[1.5rem] border border-[#dfd0bb] bg-[#fffaf1] p-5 shadow-[0_20px_70px_rgba(42,31,20,0.14)] sm:p-7">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#d8c5aa] bg-white">
              <Image
                src="/logos/holditdown-cic-tree-logo.jpg"
                alt="Hold It Down CIC"
                fill
                priority
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f9b16]">
                Hold It Down CIC
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight sm:text-3xl">
                Share your voice
              </h1>
            </div>
          </div>

          {status === "success" ? (
            <div className="rounded-2xl border border-[#5f9b16]/30 bg-[#eef8df] p-5 text-center">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
                Thank you
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#4f4437]">
                Your voice has been received. We are taking you back to the Hold It Down website.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-base leading-relaxed text-[#5f5548]">
                What would you like to share about men, boys, family, and community?
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="share-name" className="mb-2 block text-sm font-bold">
                    Name or initials
                  </label>
                  <input
                    id="share-name"
                    name="name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClasses}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="share-message" className="mb-2 block text-sm font-bold">
                    What would you like to share?
                  </label>
                  <textarea
                    id="share-message"
                    name="message"
                    required
                    maxLength={2000}
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className={`${inputClasses} min-h-[220px] resize-none sm:min-h-[160px]`}
                    placeholder="Write your thought, suggestion, or reflection..."
                  />
                  {message.length >= 1800 && (
                    <p className="mt-2 text-right text-xs text-[#7a6d5d]">
                      {message.length}/2000
                    </p>
                  )}
                </div>

                {status === "error" && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#21180f] px-6 text-base font-bold text-white transition hover:bg-[#5f9b16] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "sending" ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
