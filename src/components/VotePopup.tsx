"use client";

import Link from "next/link";

export default function VoteBanner() {
    const text =
        "🏆 Roots & Wings Community Awards 2026 — Voting has now closed · Results will be announced this Saturday, 20 June 2026 · ";

    return (
        <Link
            href="/vote"
            className="group relative block w-full overflow-hidden bg-gradient-to-r from-accent to-accent-warm py-2 cursor-pointer"
        >
            <div className="flex whitespace-nowrap animate-marquee">
                {Array.from({ length: 4 }).map((_, i) => (
                    <span
                        key={i}
                        className="inline-block text-sm font-medium text-white px-4"
                    >
                        {text}
                    </span>
                ))}
            </div>
        </Link>
    );
}
