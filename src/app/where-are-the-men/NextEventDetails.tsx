"use client";

import { useMemo } from "react";
import { getWhereAreTheMenEventCopy } from "@/lib/where-are-the-men-event-date";

export default function NextEventDetails() {
  const eventCopy = useMemo(() => getWhereAreTheMenEventCopy(), []);

  return (
    <>
      <h2
        suppressHydrationWarning
        className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] font-bold leading-tight"
      >
        {eventCopy.pageHeading}
      </h2>
      <p className="mt-5 max-w-[620px] text-lg leading-relaxed text-white/75">
        Join us from 6pm to 9pm at 159 London Road, Croydon CR0 2RJ as we
        continue the Where Are The Men? conversation in the community.
      </p>
    </>
  );
}
