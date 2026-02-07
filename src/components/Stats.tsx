"use client";

import { useCounter } from "@/lib/motion";

function CounterStat({
  target,
  label,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  target: number;
  label: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const { count, ref } = useCounter(target, duration);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span
        ref={ref}
        className="font-[family-name:var(--font-heading)] text-3xl font-bold text-accent sm:text-4xl"
      >
        {prefix}{count}{suffix}
      </span>
      <span className="text-[0.65rem] font-medium uppercase tracking-wider text-text-secondary sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="border-y border-border bg-bg-elevated py-8 sm:py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* 2x2 grid on mobile, single row on sm+ */}
        <div className="grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-10 md:gap-14">
          <CounterStat target={2022} label="Founded" duration={2000} />
          <CounterStat target={500} label="Youth & Families" suffix="+" duration={1800} />
          <CounterStat target={300} label="Fun Day Attendees" suffix="+" duration={1500} />
          <CounterStat target={5} label="Flagship Programmes" duration={1200} />
        </div>
      </div>
    </section>
  );
}
