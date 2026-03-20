export interface TimedWordEntry {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SceneData {
  narration: string;
  visualPrompt: string;
  type: "hook" | "scene" | "cta";
  duration: number;
  index: number;
  timedWords?: TimedWordEntry[];
}

export interface CarouselSlideData {
  role: "cover" | "information" | "conclusion";
  heading: string;
  subline: string;
  backgroundImageUrl?: string;
  slideIndex: number;
  totalSlides: number;
  title?: string;
}

export interface VideoInputProps {
  clipUrls: string[];
  audioUrl: string;
  scenes: SceneData[];
  title: string;
  fps: number;
  audioDurationInSeconds: number;
  includeClipAudio?: boolean;
}

export interface CarouselSlideInputProps {
  slide: CarouselSlideData;
}
