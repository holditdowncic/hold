import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SceneData } from "./types";

interface WordEntry {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface CaptionGroup {
  words: WordEntry[];
  startFrame: number;
  endFrame: number;
}

function buildWordTimeline(
  scenes: SceneData[],
  totalDurationSec: number,
  fps: number
): WordEntry[] {
  const hasTimedWords = scenes.some(
    (scene) => Array.isArray(scene?.timedWords) && scene.timedWords.length > 0
  );

  if (hasTimedWords) {
    const timeline: WordEntry[] = [];
    let sceneOffsetSec = 0;

    for (const scene of scenes) {
      const sceneDuration =
        Number.isFinite(Number(scene?.duration)) && Number(scene.duration) > 0
          ? Number(scene.duration)
          : 0;
      const timedWords = Array.isArray(scene?.timedWords) ? scene.timedWords : [];

      if (timedWords.length) {
        for (const timed of timedWords) {
          const word = normalizeWord(String(timed?.word || ""));
          if (!word) continue;
          const startSec = Math.max(0, Number(timed?.startSec) || 0);
          const endSec = Math.max(startSec + 0.06, Number(timed?.endSec) || 0);
          const startFrame = Math.max(0, Math.round((sceneOffsetSec + startSec) * fps));
          const endFrame = Math.max(startFrame + 1, Math.round((sceneOffsetSec + endSec) * fps));
          timeline.push({ word, startFrame, endFrame });
        }
      } else if (scene.narration) {
        const words = scene.narration.split(/\s+/).filter(Boolean);
        const fallbackDuration =
          sceneDuration > 0
            ? sceneDuration
            : Math.max(
                0.6,
                totalDurationSec / Math.max(1, scenes.length)
              );
        const perWord = fallbackDuration / Math.max(1, words.length);
        words.forEach((word: string, idx: number) => {
          const startFrame = Math.round((sceneOffsetSec + idx * perWord) * fps);
          const endFrame = Math.max(
            startFrame + 1,
            Math.round((sceneOffsetSec + (idx + 1) * perWord) * fps)
          );
          timeline.push({ word: normalizeWord(word), startFrame, endFrame });
        });
      }

      if (sceneDuration > 0) {
        sceneOffsetSec += sceneDuration;
        continue;
      }

      if (timedWords.length) {
        const timedMax = timedWords.reduce((max: number, word: SceneWord) => {
          const endSec = Number(word?.endSec) || 0;
          return endSec > max ? endSec : max;
        }, 0);
        sceneOffsetSec += Math.max(0, timedMax);
      }
    }

    if (timeline.length > 0) {
      return timeline;
    }
  }

  const allWords: string[] = [];
  for (const scene of scenes) {
    const words = scene.narration.split(/\s+/).filter(Boolean);
    allWords.push(...words);
  }

  if (allWords.length === 0) return [];

  // Distribute timing by (approximate) spoken rhythm, not character count.
  // Character-based timing makes long words appear too slow and short words too fast.
  // This is still an approximation (no true phoneme alignment), but feels closer to TTS pace.
  const weights = allWords.map((w) => {
    const word = String(w || "");
    const endsWithStrongPause = /[.!?]$/.test(word);
    const endsWithSoftPause = /[,;:]$/.test(word);
    const isLong = word.replace(/[^a-z0-9]/gi, "").length >= 9;
    return (
      1 +
      (endsWithSoftPause ? 0.35 : 0) +
      (endsWithStrongPause ? 0.8 : 0) +
      (isLong ? 0.15 : 0)
    );
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let currentTime = 0;

  return allWords.map((word, idx) => {
    const weight = weights[idx] || 1;
    const wordDuration =
      totalWeight > 0 ? (weight / totalWeight) * totalDurationSec : 0;
    const entry: WordEntry = {
      word,
      startFrame: Math.round(currentTime * fps),
      endFrame: Math.round((currentTime + wordDuration) * fps),
    };
    currentTime += wordDuration;
    return entry;
  });
}

function normalizeWord(word: string): string {
  const w = String(word || "").trim();
  // Keep punctuation, but avoid rendering weird whitespace/newlines.
  return w.replace(/\s+/g, " ");
}

function estimateLineLen(words: string[]): number {
  // Roughly count visible chars. It's not perfect, but good enough for chunking.
  return words.join(" ").replace(/\s+/g, " ").trim().length;
}

function buildCaptionGroups(
  timeline: WordEntry[],
  opts: { maxWords: number; maxChars: number }
): CaptionGroup[] {
  const maxWords = Math.max(1, Math.floor(opts.maxWords));
  const maxChars = Math.max(10, Math.floor(opts.maxChars));

  const groups: CaptionGroup[] = [];
  let cur: WordEntry[] = [];

  const flush = () => {
    if (!cur.length) return;
    groups.push({
      words: cur,
      startFrame: cur[0].startFrame,
      endFrame: cur[cur.length - 1].endFrame,
    });
    cur = [];
  };

  for (const entry of timeline) {
    const word = normalizeWord(entry.word);
    const testWords = [...cur.map((w) => normalizeWord(w.word)), word];
    const wouldExceedWords = cur.length + 1 > maxWords;
    const wouldExceedChars = estimateLineLen(testWords) > maxChars;

    if (cur.length && (wouldExceedWords || wouldExceedChars)) {
      flush();
    }

    cur.push({ ...entry, word });

    const strongPause = /[.!?]$/.test(word);
    const softPause = /[,;:]$/.test(word);

    // Prefer cutting on punctuation so captions feel phrase-based.
    if (strongPause) {
      flush();
      continue;
    }
    if (softPause && cur.length >= Math.max(3, Math.floor(maxWords * 0.6))) {
      flush();
      continue;
    }
  }
  flush();

  return groups;
}

interface SubtitlesProps {
  scenes: SceneData[];
  audioDurationInSeconds: number;
  fps: number;
}

type SceneWord = NonNullable<SceneData["timedWords"]>[number];

export const Subtitles: React.FC<SubtitlesProps> = ({
  scenes,
  audioDurationInSeconds,
  fps,
}) => {
  const frame = useCurrentFrame();

  const timeline = useMemo(
    () => buildWordTimeline(scenes, audioDurationInSeconds, fps),
    [scenes, audioDurationInSeconds, fps]
  );

  if (timeline.length === 0) return null;

  const groups = useMemo(() => {
    // Keep phrases short and readable enough to wrap into one or two lines.
    return buildCaptionGroups(timeline, { maxWords: 5, maxChars: 34 });
  }, [timeline]);

  // Find current word index
  let currentWordIndex = timeline.findIndex(
    (w) => frame >= w.startFrame && frame < w.endFrame
  );

  // If between words or past end, find closest
  if (currentWordIndex === -1) {
    currentWordIndex = timeline.findIndex((w) => frame < w.endFrame);
    if (currentWordIndex === -1) currentWordIndex = timeline.length - 1;
  }

  // Find active group
  let groupIndex = groups.findIndex(
    (g) => frame >= g.startFrame && frame < g.endFrame
  );
  if (groupIndex === -1) {
    // Fallback: choose the next group that ends after now.
    groupIndex = groups.findIndex((g) => frame < g.endFrame);
    if (groupIndex === -1) groupIndex = Math.max(0, groups.length - 1);
  }

  const activeGroup = groups[groupIndex] || { words: [], startFrame: 0, endFrame: 1 };
  const visibleWords = activeGroup.words;

  let activeWordInGroup = visibleWords.findIndex(
    (w) => frame >= w.startFrame && frame < w.endFrame
  );
  if (activeWordInGroup === -1) {
    activeWordInGroup = visibleWords.findIndex((w) => frame < w.endFrame);
    if (activeWordInGroup === -1) activeWordInGroup = Math.max(0, visibleWords.length - 1);
  }

  // Fade in the entire subtitle block
  const blockOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fontFamily =
    '"Inter Tight", "Avenir Next Condensed", "Helvetica Neue", Arial, sans-serif';
  const textShadow = "0 3px 14px rgba(0,0,0,0.5)";
  const activeFill = "#facc15";
  const activeText = "#111827";
  const wordBg = "rgba(255,255,255,0.04)";

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 56px 130px 56px",
        opacity: blockOpacity,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "transparent",
          border: "none",
          borderRadius: 0,
          padding: "8px 6px 10px 6px",
          backdropFilter: "none",
          boxShadow: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px 8px",
            textAlign: "center",
          }}
        >
          {visibleWords.map((w, i) => {
            const isActive = i === activeWordInGroup;
            const isPast = i < activeWordInGroup;

            const pop = isActive
              ? (() => {
                  const startFrame = w.startFrame;
                  const endFrame = Math.max(startFrame + 1, w.endFrame);
                  const peakFrame = Math.min(endFrame - 1, startFrame + 4);

                  if (peakFrame <= startFrame) {
                    return interpolate(
                      frame,
                      [startFrame, endFrame],
                      [0.94, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    );
                  }

                  return interpolate(
                    frame,
                    [startFrame, peakFrame, endFrame],
                    [0.94, 1.06, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  );
                })()
              : 1;

            return (
              <span
                key={`${groupIndex}-${i}-${w.startFrame}`}
                style={{
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 58,
                  letterSpacing: "-0.8px",
                  lineHeight: 1,
                  color: isActive ? activeText : "#f8fafc",
                  background: isActive ? activeFill : wordBg,
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.35)"
                    : "1px solid rgba(255,255,255,0.03)",
                  borderRadius: 16,
                  padding: "8px 12px 10px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isActive
                    ? "0 10px 24px rgba(250,204,21,0.26)"
                    : "none",
                  textShadow: isActive ? "none" : textShadow,
                  transform: `translateY(${isActive ? -2 : 0}px) scale(${pop})`,
                  opacity: isPast ? 0.95 : 1,
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
