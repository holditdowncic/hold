import React from "react";
import { Composition } from "remotion";
import { DignitateVideo } from "./Video/DignitateVideo";
import { CarouselSlide } from "./Carousel/CarouselSlide";
import { CarouselSlideInputProps, VideoInputProps } from "./Video/types";

const defaultProps: VideoInputProps = {
  clipUrls: [],
  audioUrl: "",
  scenes: [
    {
      narration: "When they forget your name it breaks your heart",
      visualPrompt: "warm sunset silhouette",
      type: "hook",
      duration: 3,
      index: 0,
    },
    {
      narration:
        "But you show up every single day because love does not need memory",
      visualPrompt: "hands holding gently",
      type: "scene",
      duration: 6,
      index: 1,
    },
    {
      narration: "You are not alone in this journey and your feelings are valid",
      visualPrompt: "garden peaceful scene",
      type: "scene",
      duration: 6,
      index: 2,
    },
    {
      narration: "Follow Dignitate for more support and resources",
      visualPrompt: "community gathering",
      type: "cta",
      duration: 5,
      index: 3,
    },
  ],
  title: "Preview",
  fps: 30,
  audioDurationInSeconds: 20,
  includeClipAudio: false,
};

const defaultCarouselProps: CarouselSlideInputProps = {
  slide: {
    role: "cover",
    heading: "Diagnosis Delays Hit Families",
    subline:
      "When diagnosis is delayed, families are often left managing memory changes, safety concerns, and appointments without clear guidance.",
    backgroundImageUrl: "",
    slideIndex: 0,
    totalSlides: 5,
    title: "Preview",
  },
};

export const Root: React.FC = () => {
  const totalDurationFrames = Math.ceil(defaultProps.audioDurationInSeconds * defaultProps.fps);

  return (
    <>
      <Composition
        id="DignitateVideo"
        component={DignitateVideo}
        durationInFrames={totalDurationFrames}
        fps={defaultProps.fps}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={({ props }: { props: VideoInputProps }) => {
          const sceneSeconds = Array.isArray(props.scenes)
            ? props.scenes.reduce((sum: number, scene: VideoInputProps["scenes"][number]) => {
                const sec = Number(scene?.duration);
                return sum + (Number.isFinite(sec) && sec > 0 ? sec : 0);
              }, 0)
            : 0;

          // Default to scene durations (preferred), otherwise fall back to audio length.
          const durationSeconds =
            sceneSeconds > 0
              ? sceneSeconds
              : Math.max(0, Number(props.audioDurationInSeconds) || 0);

          const duration = Math.ceil(durationSeconds * props.fps);
          return {
            durationInFrames: Math.max(duration, 30),
            fps: props.fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="DignitateCarouselSlide"
        component={CarouselSlide}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
        defaultProps={defaultCarouselProps}
      />
    </>
  );
};
