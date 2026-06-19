import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSocialPlatformDisplayName } from "@/lib/composio-social";

export const metadata: Metadata = {
  title: "Social Connection Link Issue | Hold It Down CIC",
  description: "Social account connection link issue for Hold It Down CIC.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{
    platform?: string;
    code?: string;
  }>;
};

const issueMessages: Record<string, string> = {
  unsupported_platform: "This social platform is not available yet.",
  invalid_invite: "This invite link is not valid. Ask for a fresh Hold It Down invite link.",
  missing_config: "This connection is not fully configured yet.",
  composio_error: "Composio could not create a fresh connection link right now.",
  invalid_composio_response: "Composio did not return a usable connection link.",
};

export default async function ConnectSocialErrorPage({ searchParams }: PageProps) {
  const { platform = "", code = "" } = await searchParams;
  const platformName = getSocialPlatformDisplayName(platform);
  const message = issueMessages[code] || "This connection link could not be opened.";

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Navbar />
      <main className="px-5 py-28 sm:px-6 sm:py-32">
        <section className="mx-auto max-w-[720px] rounded-2xl border border-border bg-bg-card p-8 text-center shadow-sm sm:p-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-warm">
            Social connection
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight sm:text-4xl">
            We could not open the {platformName} link
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-base leading-relaxed text-text-secondary">
            {message}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Contact Hold It Down
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-text-primary transition hover:border-accent/40 hover:text-accent"
            >
              Return to website
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
