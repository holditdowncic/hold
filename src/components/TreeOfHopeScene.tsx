"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

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
  audioType?: string;
  createdAt: string;
  x: number;
  y: number;
  consentAccepted?: boolean;
};

const storageKey = "hold-tree-of-hope-approved-contributions-v1";

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
  const [contributions, setContributions] = useState<TreeContribution[]>([]);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [audioDraft, setAudioDraft] = useState<{ dataUrl: string; type: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Loading community archive...");
  const [isSaving, setIsSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [soundscapeActive, setSoundscapeActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const soundscapeIndexRef = useRef(0);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[3];
  const selectedZoneContributions = contributions.filter((item) => item.zoneId === selectedZone.id);
  const recorderSupported = typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices;
  const voiceContributions = contributions.filter((item) => item.audioDataUrl);
  const canSave = (message.trim().length > 0 || audioDraft !== null) && consentAccepted && !isSaving;

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
            ? "Live community archive loaded"
            : "Ready to collect the first approved message",
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
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioRef.current?.pause();
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
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (blob.size > 0) {
          const dataUrl = await readFileAsDataUrl(blob);
          setAudioDraft({ dataUrl, type: blob.type });
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordingError("Microphone access was blocked or unavailable.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  const playSoundscape = () => {
    if (voiceContributions.length === 0) return;
    audioRef.current?.pause();

    const item = voiceContributions[soundscapeIndexRef.current % voiceContributions.length];
    if (!item.audioDataUrl) return;
    soundscapeIndexRef.current += 1;

    const audio = new Audio(item.audioDataUrl);
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

    const position = makeContributionPosition(selectedZone, selectedZoneContributions.length);
    const nextContribution: TreeContribution = {
      id: crypto.randomUUID(),
      zoneId: selectedZone.id,
      author: author.trim() || "Community voice",
      message: message.trim(),
      audioDataUrl: audioDraft?.dataUrl,
      audioType: audioDraft?.type,
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

      if (!response.ok) throw new Error("Archive save failed");
      await response.json();
      setSyncStatus("Sent for approval. It will appear after admin review.");
      setMessage("");
      setAudioDraft(null);
      setConsentAccepted(false);
    } catch {
      setSyncStatus("Could not send for approval. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const playAudio = (item: TreeContribution) => {
    if (!item.audioDataUrl) return;
    audioRef.current?.pause();
    if (playingId === item.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(item.audioDataUrl);
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

  const downloadArchive = () => {
    const blob = new Blob([JSON.stringify(contributions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tree-of-hope-archive.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-[#f5f1e5] shadow-xl shadow-black/5 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="relative min-h-[500px] overflow-hidden bg-[#bcd790] sm:min-h-[620px]">
        <Image
          src="/media/tree-of-hope-field.jpg"
          alt="Large tree in a green field for the Tree of Hope"
          fill
          priority={false}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 760px"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(30,22,12,0.18)_64%,rgba(20,16,9,0.42))]" />

        <div className="absolute left-4 right-4 top-4 z-10 rounded-lg bg-white/86 p-4 text-[#21180f] shadow-xl shadow-black/15 backdrop-blur-md sm:left-5 sm:right-auto sm:max-w-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#79522d]">Moderated archive</p>
          <h3 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight">
            Tree of Hope
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#4b3827]">
            Tap roots, trunk, branches, or leaves to submit a written message or short voice note for
            approval.
          </p>
        </div>

        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            aria-pressed={selectedZone.id === zone.id}
            onClick={() => setSelectedZoneId(zone.id)}
            className={`absolute z-20 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 shadow-xl shadow-black/20 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#f2c94c] focus:ring-offset-2 ${
              selectedZone.id === zone.id
                ? "border-white bg-[#f2c94c] text-[#20170f]"
                : "border-white/80 bg-[#214d27] text-white"
            }`}
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            title={`${zone.label}: ${zone.part}`}
          >
            <span className="text-sm font-black">{zoneCounts[zone.id] || "+"}</span>
          </button>
        ))}

        {contributions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedZoneId(item.zoneId)}
            className="absolute z-10 min-h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-[#7fb33f] px-2 text-xs font-black text-white shadow-lg shadow-black/20 transition hover:scale-110"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            title={item.message || "Voice note"}
          >
            {item.audioDataUrl ? "A" : "M"}
          </button>
        ))}
      </div>

      <aside className="flex min-h-[500px] flex-col bg-[#20170f] p-5 text-white sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d7b56d]">{selectedZone.label}</p>
          <h3 className="mt-1 text-2xl font-bold">{selectedZone.part}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/74">{selectedZone.prompt}</p>
        </div>

        <div className="mt-5 grid gap-3">
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Name or initials"
            className="h-11 rounded-lg border border-white/12 bg-white/10 px-3 text-sm text-white outline-none transition placeholder:text-white/48 focus:border-[#f2c94c]"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a message for this part of the tree"
            rows={4}
            className="min-h-28 resize-none rounded-lg border border-white/12 bg-white/10 px-3 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/48 focus:border-[#f2c94c]"
          />

          <div className="grid grid-cols-2 gap-2">
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
              {isRecording ? "Stop" : audioDraft ? "Record again" : "Voice"}
            </button>

            <button
              type="button"
              onClick={saveContribution}
              disabled={!canSave}
              className="h-11 rounded-lg bg-[#f2c94c] px-4 text-sm font-black text-[#20170f] transition hover:bg-[#ffe071] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSaving ? "Sending" : "Send for approval"}
            </button>
          </div>

          {audioDraft ? (
            <div className="rounded-lg border border-[#f2c94c]/30 bg-[#f2c94c]/12 p-3 text-sm text-[#f9e7a9]">
              Voice note ready. Send it for approval or record again.
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
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          <div>
            <p className="text-sm font-bold">{contributions.length} contributions</p>
            <p className="text-xs text-white/56">{syncStatus}</p>
          </div>
          <button
            type="button"
            onClick={downloadArchive}
            disabled={contributions.length === 0}
            className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-40"
            title="Download archive"
            aria-label="Download archive"
          >
            <span className="h-4 w-4">
              <Icon name="download" />
            </span>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSoundscapeActive((active) => !active)}
            disabled={voiceContributions.length === 0}
            className="h-10 rounded-lg bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {soundscapeActive ? "Stop voices" : "Play voices"}
          </button>
          <button
            type="button"
            onClick={() => {
              void fetch("/api/tree-of-hope", { cache: "no-store" })
                .then((response) => response.json())
                .then((data: { contributions?: TreeContribution[] }) => {
                  const remoteContributions = Array.isArray(data.contributions) ? data.contributions : [];
                  setContributions(
                    remoteContributions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                  );
                  setSyncStatus("Archive refreshed");
                })
                .catch(() => setSyncStatus("Refresh unavailable; try again shortly"));
            }}
            className="h-10 rounded-lg bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/16"
          >
            Refresh tree
          </button>
        </div>

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
                  {item.audioDataUrl ? (
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
                Nothing approved here yet. Choose this part of the tree, write a message, record a
                voice note, and send it for approval.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
