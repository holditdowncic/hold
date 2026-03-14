import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  businessDetails,
  entityStatement,
  type LegalCallout,
  type LegalPageContent,
} from "@/data/legal";

function CalloutCard({ callout }: { callout: LegalCallout }) {
  return (
    <div className="card-shadow rounded-2xl border border-border bg-bg-card p-6">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
        {callout.title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {callout.description}
      </p>
      {callout.href ? (
        <Link
          href={callout.href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-warm"
        >
          <span>{callout.cta || "Open page"}</span>
          <span aria-hidden="true">-&gt;</span>
        </Link>
      ) : null}
    </div>
  );
}

export default function PolicyPage({ content }: { content: LegalPageContent }) {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden px-5 pt-28 pb-12 sm:px-6 sm:pt-32 md:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_-10%,var(--color-accent-glow),transparent)]" />
        <div className="relative mx-auto max-w-[920px]">
          <span className="inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
            {content.eyebrow}
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-tight tracking-tight text-text-primary">
            {content.title}
          </h1>
          <p className="mt-5 max-w-[760px] text-base leading-relaxed text-text-secondary md:text-lg">
            {content.description}
          </p>
          <p className="mt-4 text-sm text-text-tertiary">
            Last updated: {content.lastUpdated}
          </p>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-6 md:pb-24">
        <div className="mx-auto max-w-[920px] space-y-6">
          {content.callouts?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {content.callouts.map((callout) => (
                <CalloutCard key={callout.title} callout={callout} />
              ))}
            </div>
          ) : null}

          <div className="card-shadow rounded-2xl border border-border bg-bg-card p-6 sm:p-8">
            <div className="grid gap-4 text-sm text-text-secondary sm:grid-cols-2">
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  Organisation
                </p>
                <p className="mt-2 text-text-primary">{businessDetails.legalName}</p>
                <p className="mt-1">{entityStatement}</p>
                <p className="mt-1">Company No. {businessDetails.companyNumber}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  Support
                </p>
                <p className="mt-2">
                  <a
                    href={`mailto:${businessDetails.email}`}
                    className="text-accent transition-colors hover:text-accent-warm"
                  >
                    {businessDetails.email}
                  </a>
                </p>
                <p className="mt-1">{businessDetails.registeredOffice}</p>
              </div>
            </div>
          </div>

          {content.sections.map((section) => (
            <section
              key={section.title}
              className="card-shadow rounded-2xl border border-border bg-bg-card p-6 sm:p-8"
            >
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
                {section.title}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets?.length ? (
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary sm:text-base">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-gradient-to-r from-accent to-accent-warm" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
