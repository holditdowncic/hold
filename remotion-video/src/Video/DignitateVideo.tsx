import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
} from "remotion";
import { VideoInputProps } from "./types";
import { Scene } from "./Scene";
import { Subtitles } from "./Subtitles";
import { Branding } from "./Branding";

export const DignitateVideo: React.FC<VideoInputProps> = ({
  clipUrls,
  audioUrl,
  scenes,
  audioDurationInSeconds,
  fps,
  includeClipAudio = false,
}) => {
  const { durationInFrames } = useVideoConfig();
  const safeScenes = Array.isArray(scenes) ? scenes : [];

  // Prefer explicit scene durations (in seconds) coming from n8n.
  // This keeps the video length stable (e.g. 2 x 15s = 30s) and prevents
  // stretching short AI clips to match an overestimated audio duration.
  const sceneFrames = safeScenes.map((s: VideoInputProps["scenes"][number]) => {
    const sec = Number((s as any)?.duration);
    const durSec = Number.isFinite(sec) && sec > 0 ? sec : 0;
    return Math.max(1, Math.round(durSec * fps));
  });

  const hasSceneDurations = sceneFrames.some((f) => f > 1);

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      {/* Layer 1: Video clips in sequence */}
      {safeScenes.map((scene: VideoInputProps["scenes"][number], i: number) => {
        const clipUrl = clipUrls[i] || clipUrls[clipUrls.length - 1] || "";
        const from = hasSceneDurations
          ? sceneFrames.slice(0, i).reduce((a, b) => a + b, 0)
          : Math.floor((durationInFrames / Math.max(safeScenes.length, 1)) * i);

        const desired =
          hasSceneDurations && sceneFrames[i]
            ? sceneFrames[i]
            : Math.floor(durationInFrames / Math.max(safeScenes.length, 1));

        const duration = Math.max(
          1,
          Math.min(desired, Math.max(1, durationInFrames - from))
        );

        return (
          <Sequence
            key={`scene-${i}`}
            from={from}
            durationInFrames={duration}
            name={`${scene.type}: ${scene.narration.substring(0, 30)}...`}
          >
            <Scene clipUrl={clipUrl} sceneIndex={i} playAudio={includeClipAudio} />
          </Sequence>
        );
      })}

      {/* Layer 2: Voiceover audio */}
      {audioUrl && !includeClipAudio ? <Audio src={audioUrl} volume={1} /> : null}

      {/* Layer 3: Word-by-word subtitles */}
      <Subtitles
        scenes={safeScenes}
        audioDurationInSeconds={audioDurationInSeconds}
        fps={fps}
      />

      {/* Layer 4: Branding (logo + accent bars) */}
      <Branding />
    </AbsoluteFill>
  );
};
