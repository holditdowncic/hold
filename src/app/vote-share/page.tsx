import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Share | Roots & Wings Community Awards 2026",
  description: "Share the voting link. Vote for Community Father Figure, Everyday Hero, Mentor of the Year, and more.",
};

export default function SharePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf1] to-[#f4ead8] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#21180d] p-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-accent-warm mb-2">
            Roots & Wings 2026
          </h1>
          <p className="text-white text-lg">
            Community Awards
          </p>
          <div className="mt-3 inline-block bg-accent-warm text-[#21180d] px-4 py-1 rounded-full text-sm font-bold">
            Vote Now
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recognise Our Community Heroes
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-gray-600">
            <div className="bg-accent/10 p-2 rounded">🏆 Community Father Figure</div>
            <div className="bg-accent/10 p-2 rounded">🦸 Everyday Hero</div>
            <div className="bg-accent/10 p-2 rounded">👨‍🏫 Mentor of the Year</div>
            <div className="bg-accent/10 p-2 rounded">💪 Resilient Man</div>
            <div className="bg-accent/10 p-2 rounded">🤝 Always There</div>
            <div className="bg-accent/10 p-2 rounded">⭐ Young Role Model</div>
          </div>

          {/* QR Code */}
          <div className="mb-6">
            <div className="bg-white p-4 rounded-xl inline-block shadow-lg border-2 border-accent-warm">
              <Image
                src="/vote-qr.png"
                alt="Scan to vote"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Scan to vote</p>
          </div>

          {/* Short Link */}
          <div className="bg-accent/10 p-4 rounded-xl mb-6">
            <p className="text-sm text-gray-600 mb-1">Or visit:</p>
            <Link
              href="/vote"
              className="text-xl md:text-2xl font-bold text-accent hover:underline"
            >
              www.holditdown.uk/vote
            </Link>
          </div>

          {/* Deadline */}
          <div className="bg-accent-warm/15 border-2 border-accent-warm rounded-xl p-4">
            <p className="font-semibold text-[#21180d]">
              Voting Closes: 17th June 2026
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Free to vote • One vote per person
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Organised by Hold It Down CIC
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Roots & Wings Fun Day • 20th June 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
