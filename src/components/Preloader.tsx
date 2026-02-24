"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Preloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`preloader ${hidden ? "hidden" : ""}`}>
      <div className="text-center">
        <div className="mx-auto mb-5 h-16 w-16 animate-[fadeIn_0.6s_ease-out] sm:mb-6 sm:h-20 sm:w-20">
          <Image
            src="/logos/holdlogo.png"
            alt="Hold It Down"
            width={80}
            height={80}
            className="h-full w-full object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            priority
          />
        </div>
        <div className="preloader-text font-[family-name:var(--font-heading)] text-[clamp(1.5rem,6vw,3.5rem)] font-bold tracking-[0.1em] sm:tracking-[0.15em]">
          {"HOLD IT DOWN".split("").map((char, i) => (
            <span key={i}>{char === " " ? "\u00A0" : char}</span>
          ))}
        </div>
        <div className="mx-auto mt-6 h-[2px] w-[min(200px,60vw)] overflow-hidden rounded-full bg-border sm:mt-8">
          <div className="preloader-bar-fill h-full rounded-full bg-gradient-to-r from-accent to-accent-warm" />
        </div>
      </div>
    </div>
  );
}
