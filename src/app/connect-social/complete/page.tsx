import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSocialPlatformDisplayName } from "@/lib/composio-social";

export const metadata: Metadata = {
  title: "Social Account Connected | Hold It Down CIC",
  description: "Social account connection confirmation for Hold It Down CIC.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{
    platform?: string;
  }>;
};

export default async function ConnectSocialCompletePage({ searchParams }: PageProps) {
  const { platform = "" } = await searchParams;
  const platformName = getSocialPlatformDisplayName(platform);

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Navbar />
      <main className="px-5 py-28 sm:px-6 sm:py-32">
        <section className="mx-auto max-w-[720px] rounded-2xl border border-border bg-bg-card p-8 text-center shadow-sm sm:p-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Connection request received
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight sm:text-4xl">
            {platformName} is connected
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-base leading-relaxed text-text-secondary">
            You can close this page. The Hold It Down Telegram agent can now use this account once the
            requested action is confirmed.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Return to website
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
