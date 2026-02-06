"use client";

import { useState, useEffect } from "react";

export default function Preloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`preloader ${hidden ? "hidden" : ""}`}>
      <div className="text-center">
        <div className="preloader-text font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[0.15em]">
          {"HOLD IT DOWN".split("").map((char, i) => (
            <span key={i}>{char === " " ? "\u00A0" : char}</span>
          ))}
        </div>
        <div className="mx-auto mt-8 h-[2px] w-[200px] overflow-hidden rounded-full bg-border">
          <div className="preloader-bar-fill h-full rounded-full bg-gradient-to-r from-accent to-accent-warm" />
        </div>
      </div>
    </div>
  );
}
