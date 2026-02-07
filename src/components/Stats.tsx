"use client";

import { Reveal, useCounter } from "@/lib/motion";

function CounterStat() {
  const { count, ref } = useCounter(2022, 2000);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span
        ref={ref}
        className="font-[family-name:var(--font-heading)] text-4xl font-bold text-accent"
      >
        {count}
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        Founded
      </span>
    </div>
  );
}

function IconStat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-accent">{children}</span>
      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-12 w-px bg-border sm:block" />;
}

export default function Stats() {
  return (
    <section className="border-y border-border bg-bg-elevated py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12">
            <CounterStat />
            <Divider />
            <IconStat label="Youth & Families">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </IconStat>
            <Divider />
            <IconStat label="Community Led">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </IconStat>
            <Divider />
            <IconStat label="Croydon, UK">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </IconStat>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
