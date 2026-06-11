"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TreeModerationStatus = "pending" | "approved" | "rejected";

type TreeContribution = {
  id?: string;
  zoneId?: string;
  author?: string;
  message?: string;
  audioDataUrl?: string;
  audioUrl?: string;
  audioType?: string;
  audioDurationSeconds?: number;
  createdAt?: string;
  x?: number;
  y?: number;
  moderationStatus?: TreeModerationStatus;
  moderatedAt?: string;
  moderatedBy?: string;
};

type TreeSubmission = {
  id: string;
  createdAt: string;
  contribution: TreeContribution;
};

const passwordKey = "hold-tree-admin-password";
const statuses: TreeModerationStatus[] = ["pending", "approved", "rejected"];

function zoneLabel(zoneId?: string) {
  switch (zoneId) {
    case "roots":
      return "Roots";
    case "trunk":
      return "Trunk";
    case "left-branch":
      return "Left branch";
    case "right-branch":
      return "Right branch";
    case "canopy":
      return "Leaves";
    default:
      return zoneId || "Tree";
  }
}

function formatDate(value?: string) {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClasses(status: TreeModerationStatus) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export default function TreeAdminPage() {
  const [password, setPassword] = useState("");
  const [activePassword, setActivePassword] = useState("");
  const [submissions, setSubmissions] = useState<TreeSubmission[]>([]);
  const [activeStatus, setActiveStatus] = useState<TreeModerationStatus>("pending");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const filtered = useMemo(() => {
    return submissions.filter((item) => (item.contribution.moderationStatus || "pending") === activeStatus);
  }, [activeStatus, submissions]);

  async function loadSubmissions(nextPassword = activePassword) {
    if (!nextPassword) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/tree-admin", {
        headers: { "x-tree-admin-password": nextPassword },
        cache: "no-store",
      });

      if (!response.ok) throw new Error(response.status === 401 ? "Incorrect password." : "Could not load Tree admin.");

      const data = (await response.json()) as { submissions?: TreeSubmission[] };
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      setActivePassword(nextPassword);
      window.sessionStorage.setItem(passwordKey, nextPassword);
      setMessage("Tree admin loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load Tree admin.");
      setActivePassword("");
      window.sessionStorage.removeItem(passwordKey);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: TreeModerationStatus) {
    setUpdatingId(id);
    setMessage("");

    try {
      const response = await fetch("/api/tree-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tree-admin-password": activePassword,
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) throw new Error("Could not update this leaf.");
      await loadSubmissions(activePassword);
      setMessage(status === "approved" ? "Leaf approved and live on the tree." : "Leaf removed from the public tree.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update this leaf.");
    } finally {
      setUpdatingId("");
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadSubmissions(password);
  }

  useEffect(() => {
    const stored = window.sessionStorage.getItem(passwordKey);
    if (stored) void loadSubmissions(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f1e5] px-4 py-10 text-[#20170f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-[#d7c9a3] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#79522d]">Hold It Down admin</p>
            <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-black tracking-tight text-[#20170f]">
              Tree of Hope Moderation
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5f4a35]">
              Review event-day leaves, approve genuine contributions, and remove anything unsafe or irrelevant.
            </p>
          </div>

          {activePassword ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadSubmissions(activePassword)}
                className="h-11 rounded-lg bg-[#214d27] px-4 text-sm font-bold text-white"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePassword("");
                  setSubmissions([]);
                  window.sessionStorage.removeItem(passwordKey);
                }}
                className="h-11 rounded-lg border border-[#d7c9a3] px-4 text-sm font-bold text-[#20170f]"
              >
                Lock
              </button>
            </div>
          ) : null}
        </div>

        {!activePassword ? (
          <form onSubmit={handleLogin} className="mt-8 max-w-md rounded-lg border border-[#d7c9a3] bg-white p-5 shadow-sm">
            <label htmlFor="tree-admin-password" className="block text-sm font-bold text-[#20170f]">
              Admin password
            </label>
            <input
              id="tree-admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-[#cbbd96] px-3 text-base outline-none focus:border-[#214d27]"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="mt-4 h-12 w-full rounded-lg bg-[#f2c94c] px-4 text-sm font-black text-[#20170f] disabled:opacity-50"
            >
              {loading ? "Opening" : "Open admin"}
            </button>
          </form>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-2 rounded-lg border border-[#d7c9a3] bg-white p-2">
              {statuses.map((status) => {
                const count = submissions.filter((item) => (item.contribution.moderationStatus || "pending") === status).length;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActiveStatus(status)}
                    className={`h-12 rounded-md text-sm font-black capitalize ${
                      activeStatus === status ? "bg-[#20170f] text-white" : "text-[#5f4a35]"
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#cbbd96] p-8 text-center text-sm text-[#5f4a35]">
                  No {activeStatus} leaves right now.
                </div>
              ) : (
                filtered.map((item) => {
                  const contribution = item.contribution;
                  const audioSource = contribution.audioUrl || contribution.audioDataUrl;

                  return (
                    <article key={item.id} className="rounded-lg border border-[#d7c9a3] bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-black capitalize ${statusClasses(contribution.moderationStatus || "pending")}`}>
                              {contribution.moderationStatus || "pending"}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#79522d]">
                              {zoneLabel(contribution.zoneId)}
                            </span>
                          </div>
                          <h2 className="mt-3 text-xl font-black">{contribution.author || "Community voice"}</h2>
                          <p className="mt-1 text-xs text-[#6f5a42]">
                            Submitted {formatDate(contribution.createdAt || item.createdAt)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:min-w-64">
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, "approved")}
                            disabled={updatingId === item.id}
                            className="h-11 rounded-lg bg-[#214d27] px-3 text-sm font-black text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, "rejected")}
                            disabled={updatingId === item.id}
                            className="h-11 rounded-lg bg-[#9f2f21] px-3 text-sm font-black text-white disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {contribution.message ? (
                        <p className="mt-4 rounded-lg bg-[#f5f1e5] p-4 text-sm leading-relaxed text-[#3d2c1d]">
                          {contribution.message}
                        </p>
                      ) : null}

                      {audioSource ? (
                        <div className="mt-4 rounded-lg border border-[#d7c9a3] p-3">
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#79522d]">Voice note</p>
                          <audio controls src={audioSource} className="w-full" />
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-2 text-xs text-[#6f5a42] sm:grid-cols-3">
                        <span>ID: {item.id}</span>
                        <span>Position: {typeof contribution.x === "number" ? contribution.x.toFixed(1) : "?"} / {typeof contribution.y === "number" ? contribution.y.toFixed(1) : "?"}</span>
                        {contribution.moderatedAt ? <span>Moderated: {formatDate(contribution.moderatedAt)}</span> : <span>Awaiting review</span>}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </>
        )}

        {message ? (
          <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-[#20170f] px-4 py-3 text-sm font-bold text-white shadow-xl md:left-auto md:w-96">
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}
