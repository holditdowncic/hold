"use client";

import { useCounter } from "@/lib/motion";
import type { Stat } from "@/lib/types";

const defaultStats: Stat[] = [
  { id: "1", label: "Incorporated", value: 2022, suffix: "", prefix: "", duration: 2000, sort_order: 1 },
  { id: "2", label: "Years of Roots & Wings", value: 3, suffix: "rd", prefix: "", duration: 1200, sort_order: 2 },
  { id: "3", label: "Flagship Programmes", value: 5, suffix: "", prefix: "", duration: 1200, sort_order: 3 },
  { id: "4", label: "South London Boroughs", value: 4, suffix: "", prefix: "", duration: 1000, sort_order: 4 },
];

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

interface StatsProps {
  stats: Stat[];
}

export default function Stats({ stats }: StatsProps) {
  const statsData = stats.length > 0 ? stats : defaultStats;

  return (
    <section className="border-y border-border bg-bg-elevated py-8 sm:py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-10 md:gap-14">
          {statsData.map((stat) => (
            <CounterStat
              key={stat.id}
              target={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              prefix={stat.prefix}
              duration={stat.duration}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
