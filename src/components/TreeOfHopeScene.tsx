"use client";

import Image from "next/image";
import type { MouseEvent, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  containsTreeProfanity,
  treeSubmissionErrors,
  validateTreeSubmissionText,
  type TreeSubmissionErrorType,
} from "@/lib/tree-of-hope-moderation";

type TreeZone = {
  id: string;
  label: string;
  part: string;
  prompt: string;
  x: number;
  y: number;
};

type TreeContribution = {
  id: string;
  zoneId: string;
  author: string;
  message: string;
  audioDataUrl?: string;
  audioUrl?: string;
  audioType?: string;
  audioDurationSeconds?: number;
  createdAt: string;
  x: number;
  y: number;
  consentAccepted?: boolean;
};

type SeasonId = "spring" | "summer" | "autumn" | "winter";

const storageKey = "hold-tree-of-hope-approved-contributions-v1";
const offlineQueueKey = "hold-tree-of-hope-offline-queue-v1";
const submissionRateLimitKey = "hid_tree_submissions";
const submissionLimit = 3;
const submissionWindowMs = 24 * 60 * 60 * 1000;

const seasons: Array<{
  id: SeasonId;
  label: string;
  tint: string;
  marker: string;
  leaf: string;
  particle: string;
}> = [
  {
    id: "spring",
    label: "Spring",
    tint: "bg-[linear-gradient(180deg,rgba(249,244,222,0.05),rgba(188,215,144,0.28)_62%,rgba(48,93,45,0.36))]",
    marker: "bg-[#f6b6c7]",
    leaf: "bg-[#8fbd4a]",
    particle: "bg-[#f6b6c7]",
  },
  {
    id: "summer",
    label: "Summer",
    tint: "bg-[linear-gradient(180deg,rgba(255,230,140,0.12),rgba(84,142,58,0.2)_62%,rgba(30,68,34,0.38))]",
    marker: "bg-[#f2c94c]",
    leaf: "bg-[#7fb33f]",
    particle: "bg-[#f2c94c]",
  },
  {
    id: "autumn",
    label: "Autumn",
    tint: "bg-[linear-gradient(180deg,rgba(255,180,74,0.14),rgba(176,83,36,0.24)_62%,rgba(75,42,22,0.45))]",
    marker: "bg-[#d7792f]",
    leaf: "bg-[#c8642b]",
    particle: "bg-[#d7792f]",
  },
  {
    id: "winter",
    label: "Winter",
    tint: "bg-[linear-gradient(180deg,rgba(237,247,255,0.3),rgba(154,187,197,0.16)_62%,rgba(34,50,58,0.48))]",
    marker: "bg-[#d9edf2]",
    leaf: "bg-[#6c9aa3]",
    particle: "bg-white",
  },
];

const zones: TreeZone[] = [
  {
    id: "roots",
    label: "Roots",
    part: "What shaped us",
    prompt: "Add a memory, value, lesson, or person that helped shape you.",
    x: 46,
    y: 82,
  },
  {
    id: "trunk",
    label: "Trunk",
    part: "What keeps us strong",
    prompt: "Share a message about strength, support, and what keeps families steady.",
    x: 49,
    y: 60,
  },
  {
    id: "left-branch",
    label: "Left branch",
    part: "Messages to others",
    prompt: "Leave a message, reflection, or encouragement for someone else.",
    x: 33,
    y: 42,
  },
  {
    id: "canopy",
    label: "Leaves",
    part: "Community hopes",
    prompt: "Add a hope, promise, or short voice note to the living canopy.",
    x: 51,
    y: 25,
  },
  {
    id: "right-branch",
    label: "Right branch",
    part: "Wings and future",
    prompt: "Share what you want the next generation to grow into.",
    x: 68,
    y: 43,
  },
];

const cloudSlots = [
  { left: 12, top: 16, delay: 0 },
  { left: 64, top: 13, delay: 1.4 },
  { left: 37, top: 8, delay: 2.8 },
  { left: 78, top: 24, delay: 4.2 },
];

function naturalSeason(date = new Date()): SeasonId {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function readFileAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function makeContributionPosition(zone: TreeZone, index: number) {
  const angle = index * 2.399963229728653;
  const radius = Math.min(14, 4 + index * 0.75);
  return {
    x: Math.min(92, Math.max(8, zone.x + Math.cos(angle) * radius)),
    y: Math.min(90, Math.max(10, zone.y + Math.sin(angle) * radius * 0.58)),
  };
}

function projectTreePoint(x: number, y: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  const centeredX = x - 50;
  const depth = Math.sin(radians) * centeredX;
  const projectedX = 50 + centeredX * Math.cos(radians) * 0.72;
  const projectedY = y + depth * 0.055;
  const scale = Math.max(0.72, Math.min(1.18, 0.95 + depth / 180));

  return {
    x: Math.min(96, Math.max(4, projectedX)),
    y: Math.min(94, Math.max(6, projectedY)),
    scale,
    opacity: Math.max(0.52, Math.min(1, 0.88 + depth / 140)),
    zIndex: depth >= 0 ? 28 : 12,
  };
}

function recentSubmissionTimestamps() {
  const cutoff = Date.now() - submissionWindowMs;
  const raw = window.localStorage.getItem(submissionRateLimitKey);
  if (!raw) return [];

  try {
    const timestamps = (JSON.parse(raw) as unknown[])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      .filter((value) => value >= cutoff);
    window.localStorage.setItem(submissionRateLimitKey, JSON.stringify(timestamps));
    return timestamps;
  } catch {
    window.localStorage.removeItem(submissionRateLimitKey);
    return [];
  }
}

function hasReachedSubmissionLimit() {
  return recentSubmissionTimestamps().length >= submissionLimit;
}

function recordSubmissionTimestamp() {
  const timestamps = recentSubmissionTimestamps();
  timestamps.push(Date.now());
  window.localStorage.setItem(submissionRateLimitKey, JSON.stringify(timestamps));
}

function Icon({ name }: { name: "mic" | "stop" | "play" | "download" }) {
  if (name === "mic") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <path d="M12 19v3" />
      </svg>
    );
  }

  if (name === "stop") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
      </svg>
    );
  }

  if (name === "play") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.5v13l10-6.5-10-6.5Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export default function TreeOfHopeScene() {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[3].id);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [contributions, setContributions] = useState<TreeContribution[]>([]);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [submissionError, setSubmissionError] = useState<TreeSubmissionErrorType | null>(null);
  const [audioDraft, setAudioDraft] = useState<{ dataUrl: string; type: string; durationSeconds: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Be one of the first to leave something for the tree.");
  const [isSaving, setIsSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [soundscapeActive, setSoundscapeActive] = useState(false);
  const [viewAngle, setViewAngle] = useState(0);
  const [seasonId, setSeasonId] = useState<SeasonId>(() => naturalSeason());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimeoutRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; angle: number; moved: boolean } | null>(null);
  const soundscapeIndexRef = useRef(0);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[3];
  const selectedZoneContributions = contributions.filter((item) => item.zoneId === selectedZone.id);
  const recorderSupported = typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices;
  const voiceContributions = contributions.filter((item) => item.audioDataUrl || item.audioUrl);
  const canSave = (message.trim().length > 0 || audioDraft !== null) && selectedPoint !== null && consentAccepted && !isSaving;
  const currentSeason = seasons.find((season) => season.id === seasonId) ?? seasons[1];
  const cloudContributions = useMemo(() => contributions.slice(0, cloudSlots.length), [contributions]);
  const showPublicCount = contributions.length >= 15;

  const zoneCounts = useMemo(() => {
    return zones.reduce<Record<string, number>>((counts, zone) => {
      counts[zone.id] = contributions.filter((item) => item.zoneId === zone.id).length;
      return counts;
    }, {});
  }, [contributions]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(contributions));
  }, [contributions]);

  useEffect(() => {
    let cancelled = false;

    const loadContributions = async () => {
      try {
        const response = await fetch("/api/tree-of-hope", { cache: "no-store" });
        if (!response.ok) throw new Error("Archive request failed");
        const data = (await response.json()) as { contributions?: TreeContribution[] };
        if (cancelled) return;

        const remoteContributions = Array.isArray(data.contributions) ? data.contributions : [];
        setContributions(
          remoteContributions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
        setSyncStatus(
          remoteContributions.length > 0
            ? "Choose a leaf or cloud to read what has been passed on."
            : "Be one of the first to leave something for the tree.",
        );
      } catch {
        if (!cancelled) setSyncStatus("Archive unavailable; try again shortly");
      }
    };

    void loadContributions();
    const interval = window.setInterval(loadContributions, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateSeason = () => setSeasonId(naturalSeason());
    updateSeason();
    const interval = window.setInterval(updateSeason, 3_600_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/tree-sw.js").catch(() => undefined);
    }
  }, []);

  const flushOfflineQueue = async () => {
    const raw = window.localStorage.getItem(offlineQueueKey);
    if (!raw) return;

    let queued: TreeContribution[] = [];
    try {
      queued = JSON.parse(raw) as TreeContribution[];
    } catch {
      window.localStorage.removeItem(offlineQueueKey);
      return;
    }

    if (!queued.length) return;

    const remaining: TreeContribution[] = [];
    for (const item of queued) {
      try {
        const response = await fetch("/api/tree-of-hope", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!response.ok && response.status >= 500) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      window.localStorage.setItem(offlineQueueKey, JSON.stringify(remaining));
      setSyncStatus(`${remaining.length} saved offline; will sync when online`);
    } else {
      window.localStorage.removeItem(offlineQueueKey);
      setSyncStatus("Offline submissions synced for approval");
    }
  };

  useEffect(() => {
    void flushOfflineQueue();
    window.addEventListener("online", flushOfflineQueue);
    return () => window.removeEventListener("online", flushOfflineQueue);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioRef.current?.pause();
      if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    };
  }, []);

  const startRecording = async () => {
    setRecordingError("");
    if (!recorderSupported) {
      setRecordingError("Voice recording needs a modern browser with microphone access.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (blob.size > 0) {
          const dataUrl = await readFileAsDataUrl(blob);
          const audioDurationSeconds = Math.min(60, Math.ceil((Date.now() - recordingStartedAtRef.current) / 1000));
          setAudioDraft({ dataUrl, type: blob.type, durationSeconds: audioDurationSeconds });
          setSyncStatus(`Voice note ready (${audioDurationSeconds}s).`);
        }
      };

      recorder.start();
      setIsRecording(true);
      recordingTimeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, 60_000);
    } catch {
      setRecordingError("Microphone access was blocked or unavailable.");
    }
  };

  const stopRecording = () => {
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  const selectTreePoint = (x: number, y: number) => {
    const nearestZone = zones.reduce((best, zone) => {
      const bestDistance = Math.hypot(best.x - x, best.y - y);
      const nextDistance = Math.hypot(zone.x - x, zone.y - y);
      return nextDistance < bestDistance ? zone : best;
    }, zones[0]);

    setSelectedZoneId(nearestZone.id);
    setSelectedPoint({
      x: Math.min(96, Math.max(4, x)),
      y: Math.min(94, Math.max(6, y)),
    });
  };

  const handleTreeClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,a,input,textarea,label")) return;
    if (dragStartRef.current?.moved) {
      dragStartRef.current = null;
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    selectTreePoint(
      ((event.clientX - rect.left) / rect.width) * 100,
      ((event.clientY - rect.top) / rect.height) * 100,
    );
  };

  const handleTreePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,a,input,textarea,label")) return;
    event.preventDefault();
    dragStartRef.current = { x: event.clientX, angle: viewAngle, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTreePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag) return;
    event.preventDefault();
    const delta = event.clientX - drag.x;
    if (Math.abs(delta) < 6) return;
    drag.moved = true;
    setViewAngle((drag.angle + delta * 0.7 + 360) % 360);
  };

  const handleTreePointerEnd = () => {
    if (!dragStartRef.current?.moved) return;
    window.setTimeout(() => {
      dragStartRef.current = null;
    }, 0);
  };

  const playSoundscape = () => {
    if (voiceContributions.length === 0) return;
    audioRef.current?.pause();

    const item = voiceContributions[soundscapeIndexRef.current % voiceContributions.length];
    const source = item.audioUrl || item.audioDataUrl;
    if (!source) return;
    soundscapeIndexRef.current += 1;

    const audio = new Audio(source);
    audioRef.current = audio;
    setPlayingId(item.id);
    audio.onended = () => {
      setPlayingId(null);
      if (soundscapeActive) window.setTimeout(playSoundscape, 900);
    };
    void audio.play();
  };

  const saveContribution = async () => {
    if (!canSave) return;

    const messageInput = message.trim();
    const nameInput = author.trim();
    const validationError = messageInput
      ? validateTreeSubmissionText(messageInput, nameInput)
      : containsTreeProfanity("", nameInput)
        ? "profanity"
        : null;

    if (validationError) {
      setSubmissionError(validationError);
      return;
    }

    if (hasReachedSubmissionLimit()) {
      setSubmissionError("rate-limit");
      return;
    }

    setSubmissionError(null);

    const position = selectedPoint ?? makeContributionPosition(selectedZone, selectedZoneContributions.length);
    const nextContribution: TreeContribution = {
      id: crypto.randomUUID(),
      zoneId: selectedZone.id,
      author: nameInput || "Community voice",
      message: messageInput,
      audioDataUrl: audioDraft?.dataUrl,
      audioType: audioDraft?.type,
      audioDurationSeconds: audioDraft?.durationSeconds,
      createdAt: new Date().toISOString(),
      x: position.x,
      y: position.y,
      consentAccepted,
    };

    setIsSaving(true);
    setSyncStatus("Saving to the tree...");

    try {
      const response = await fetch("/api/tree-of-hope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextContribution),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string; errorType?: TreeSubmissionErrorType } | null;
        if (data?.errorType && data.errorType in treeSubmissionErrors) {
          setSubmissionError(data.errorType);
          return;
        }
        if (response.status < 500) {
          setSyncStatus(data?.error || "This leaf could not be sent. Please check it and try again.");
          return;
        }
        throw new Error("Archive save failed");
      }
      await response.json();
      recordSubmissionTimestamp();
      setSyncStatus("Sent for approval. It will appear after admin review.");
      setMessage("");
      setAudioDraft(null);
      setConsentAccepted(false);
      setSelectedPoint(null);
    } catch {
      const raw = window.localStorage.getItem(offlineQueueKey);
      const queued = raw ? (JSON.parse(raw) as TreeContribution[]) : [];
      queued.push(nextContribution);
      window.localStorage.setItem(offlineQueueKey, JSON.stringify(queued));
      recordSubmissionTimestamp();
      setSyncStatus("Saved offline. It will send for approval when connection returns.");
      setMessage("");
      setAudioDraft(null);
      setConsentAccepted(false);
      setSelectedPoint(null);
    } finally {
      setIsSaving(false);
    }
  };

  const playAudio = (item: TreeContribution) => {
    const source = item.audioUrl || item.audioDataUrl;
    if (!source) return;
    audioRef.current?.pause();
    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(source);
    audioRef.current = audio;
    setPlayingId(item.id);
    setSoundscapeActive(false);
    audio.onended = () => setPlayingId(null);
    void audio.play();
  };

  useEffect(() => {
    if (soundscapeActive) {
      playSoundscape();
    } else {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundscapeActive]);

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-[#f5f1e5] shadow-xl shadow-black/5 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div
        className="relative min-h-[500px] cursor-grab touch-none overflow-hidden bg-[#bcd790] active:cursor-grabbing sm:min-h-[620px]"
        style={{ touchAction: "none" }}
        onClick={handleTreeClick}
        onPointerDown={handleTreePointerDown}
        onPointerMove={handleTreePointerMove}
        onPointerUp={handleTreePointerEnd}
        onPointerCancel={handleTreePointerEnd}
        onPointerLeave={handleTreePointerEnd}
        role="application"
        aria-label="Interactive Tree of Hope placement and turning area"
      >
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `perspective(1200px) rotateY(${Math.sin((viewAngle * Math.PI) / 180) * 8}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src="/media/tree-of-hope-field.jpg"
            alt="Large tree in a green field for the Tree of Hope"
            fill
            priority={false}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 760px"
          />
        </div>
        <div className={`absolute inset-0 transition-colors duration-500 ${currentSeason.tint}`} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(30,22,12,0.16)_64%,rgba(20,16,9,0.38))]" />

        <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
          {Array.from({ length: currentSeason.id === "winter" ? 16 : 12 }).map((_, index) => (
            <span
              key={`${currentSeason.id}-${index}`}
              className={`absolute h-2 w-2 rounded-full ${currentSeason.particle} shadow-sm opacity-70 transition-colors duration-500`}
              style={{
                left: `${8 + ((index * 17 + viewAngle / 4) % 84)}%`,
                top: `${10 + ((index * 23 + viewAngle / 8) % 74)}%`,
                transform: `translateY(${Math.sin((viewAngle + index * 33) * Math.PI / 180) * 9}px)`,
              }}
            />
          ))}
        </div>

        <div className="absolute left-4 right-4 top-4 z-10 rounded-lg bg-white/86 p-4 text-[#21180f] shadow-xl shadow-black/15 backdrop-blur-md sm:left-5 sm:right-auto sm:max-w-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#79522d]">A living community tree</p>
          <h3 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight">
            What was given to you that you want to pass on?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#4b3827]">
            Tap a glowing part of the tree, or swipe the branches to see it move.
          </p>
        </div>

        {cloudContributions.length > 0 && cloudSlots.map((slot, index) => {
          const item = cloudContributions[index];
          const hasAudio = !!(item?.audioUrl || item?.audioDataUrl);
          if (!item) return null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedZoneId(item.zoneId);
                if (hasAudio) playAudio(item);
              }}
              className="absolute z-20 max-w-[14rem] rounded-[40px] border border-white/70 bg-white/82 px-5 py-3 text-left text-xs font-bold leading-snug text-[#3b2a1c] shadow-lg shadow-black/12 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white"
              style={{
                left: `${slot.left}%`,
                top: `${slot.top}%`,
                animation: `tree-cloud-drift ${7 + index}s ease-in-out ${slot.delay}s infinite alternate`,
              }}
            >
              <span className="absolute -bottom-2 left-8 h-5 w-5 rounded-full bg-white/82" aria-hidden="true" />
              <span className="absolute -top-3 right-8 h-8 w-12 rounded-full bg-white/72" aria-hidden="true" />
              <span className="block text-[0.66rem] uppercase tracking-[0.14em] text-[#79522d]">
                {hasAudio ? "Voice cloud" : "Message cloud"}
              </span>
              <span className="mt-1 block line-clamp-3">
                {item.message || `A voice note from ${item.author || "the community"}`}
              </span>
            </button>
          );
        })}

        {zones.map((zone) => (
          (() => {
            const point = projectTreePoint(zone.x, zone.y, viewAngle);
            return (
              <button
                key={zone.id}
                type="button"
                aria-pressed={selectedZone.id === zone.id}
                onClick={(event) => {
                  event.stopPropagation();
                  selectTreePoint(zone.x, zone.y);
                }}
                className={`absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 shadow-xl shadow-black/20 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#f2c94c] focus:ring-offset-2 ${
                  selectedZone.id === zone.id
                    ? `border-white ${currentSeason.marker} text-[#20170f]`
                    : "border-white/80 bg-[#214d27] text-white"
                }`}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  opacity: point.opacity,
                  zIndex: point.zIndex,
                  transform: `translate(-50%, -50%) scale(${point.scale})`,
                }}
                title={`${zone.label}: ${zone.part}`}
              >
                <span className="text-sm font-black">{zoneCounts[zone.id] > 0 ? "Leaf" : "+"}</span>
              </button>
            );
          })()
        ))}

        {selectedPoint ? (
          (() => {
            const point = projectTreePoint(selectedPoint.x, selectedPoint.y, viewAngle);
            return (
          <div
            className="pointer-events-none absolute z-30 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#f2c94c]/30 shadow-[0_0_0_12px_rgba(242,201,76,0.16)]"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: `translate(-50%, -50%) scale(${point.scale})`,
            }}
            aria-hidden="true"
          >
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f2c94c]" />
          </div>
            );
          })()
        ) : null}

        {contributions.map((item) => (
          (() => {
            const point = projectTreePoint(item.x, item.y, viewAngle);
            return (
              <button
                key={item.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedZoneId(item.zoneId);
                }}
                className={`absolute min-h-8 min-w-8 rounded-full border border-white/80 px-2 text-xs font-black text-white shadow-lg shadow-black/20 transition hover:scale-110 ${currentSeason.leaf}`}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  opacity: point.opacity,
                  zIndex: point.zIndex - 2,
                  transform: `translate(-50%, -50%) scale(${point.scale})`,
                }}
                title={item.message || "Voice note"}
              >
                {item.audioUrl || item.audioDataUrl ? "A" : "M"}
              </button>
            );
          })()
        ))}
      </div>

      <aside className="flex min-h-[500px] flex-col bg-[#20170f] p-5 text-white sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d7b56d]">{selectedZone.label}</p>
          <h3 className="mt-1 text-2xl font-bold">What was given to you that you want to pass on?</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/74">{selectedZone.prompt}</p>
          <p className="mt-3 rounded-lg border border-[#f2c94c]/24 bg-[#f2c94c]/10 p-3 text-xs leading-relaxed text-[#f9e7a9]">
            {selectedPoint
              ? `Your leaf will sit with the ${selectedZone.label.toLowerCase()}.`
              : "Choose a glowing part of the tree, then write or record what you want to pass on."}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <input
            value={author}
            onChange={(event) => {
              setAuthor(event.target.value);
              setSubmissionError(null);
            }}
            placeholder="Name or initials"
            className="h-11 rounded-lg border border-white/12 bg-white/10 px-3 text-sm text-white outline-none transition placeholder:text-white/48 focus:border-[#f2c94c]"
          />
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setSubmissionError(null);
            }}
            placeholder="What was given to you that you want to pass on?"
            rows={4}
            className="min-h-28 resize-none rounded-lg border border-white/12 bg-white/10 px-3 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/48 focus:border-[#f2c94c]"
          />
          {submissionError ? (
            <p className="submission-error mt-2 text-[0.85rem] leading-relaxed text-[#E8A838]">
              {treeSubmissionErrors[submissionError]}
            </p>
          ) : null}

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
              isRecording
                ? "bg-[#c84630] text-white hover:bg-[#a93423]"
                : "bg-white/12 text-white hover:bg-white/18"
            }`}
          >
            <span className="h-4 w-4">
              <Icon name={isRecording ? "stop" : "mic"} />
            </span>
            {isRecording ? "Stop recording" : audioDraft ? "Record again" : "Record a voice note"}
          </button>

          {audioDraft ? (
            <div className="rounded-lg border border-[#f2c94c]/30 bg-[#f2c94c]/12 p-3 text-sm text-[#f9e7a9]">
              Voice note ready. You can send it with or without a written message.
            </div>
          ) : null}

          {recordingError ? (
            <div className="rounded-lg border border-[#ff8a7a]/30 bg-[#ff8a7a]/12 p-3 text-sm text-[#ffd2cc]">
              {recordingError}
            </div>
          ) : null}

          <label className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-3 text-xs leading-relaxed text-white/70">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#f2c94c]"
            />
            <span>
              I understand this message or voice note may become public on the Tree of Hope after admin approval.
            </span>
          </label>

          <button
            type="button"
            onClick={saveContribution}
            disabled={!canSave}
            className="h-11 rounded-lg bg-[#f2c94c] px-4 text-sm font-black text-[#20170f] transition hover:bg-[#ffe071] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSaving ? "Sending" : "Add my leaf"}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          <div>
            {showPublicCount ? <p className="text-sm font-bold">{contributions.length} voices growing</p> : null}
            <p className="text-xs text-white/56">{syncStatus}</p>
          </div>
        </div>

        {voiceContributions.length > 0 ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setSoundscapeActive((active) => !active)}
              className="h-10 w-full rounded-lg bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/16"
            >
              {soundscapeActive ? "Stop voices" : "Play voices"}
            </button>
          </div>
        ) : null}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-3">
            {selectedZoneContributions.length > 0 ? (
              selectedZoneContributions.map((item) => (
                <article key={item.id} className="rounded-lg border border-white/10 bg-white/[0.07] p-3">
                  <div>
                    <p className="text-sm font-bold">{item.author}</p>
                    <p className="text-xs text-white/50">{formatDate(item.createdAt)}</p>
                  </div>
                  {item.message ? <p className="mt-2 text-sm leading-relaxed text-white/78">{item.message}</p> : null}
                  {item.audioUrl || item.audioDataUrl ? (
                    <button
                      type="button"
                      onClick={() => playAudio(item)}
                      className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#f2c94c] px-3 text-xs font-black text-[#20170f] transition hover:bg-[#ffe071]"
                    >
                      <span className="h-3.5 w-3.5">
                        <Icon name={playingId === item.id ? "stop" : "play"} />
                      </span>
                      {playingId === item.id ? "Stop voice" : "Play voice"}
                    </button>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-white/18 p-4 text-sm leading-relaxed text-white/62">
                {contributions.length > 0
                  ? "The latest leaves are moving around the tree. Tap a leaf or cloud to open it here."
                  : "The first approved leaves will appear here soon. Your message can be the one that starts it."}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
