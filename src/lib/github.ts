type GitHubFile = {
  sha: string;
  content: string; // base64
  encoding: "base64";
};

type GitHubCommitInfo = {
  sha: string;
  html_url?: string;
};

type GitHubCommitFile = {
  filename: string;
  status?: "added" | "removed" | "modified" | "renamed";
  previous_filename?: string;
};

type GitRefResponse = {
  object: { sha: string };
};

function getRepoConfig() {
  const owner = process.env.GITHUB_OWNER || "holditdowncic";
  const repo = process.env.GITHUB_REPO || "hold";
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CMS_TOKEN;
  return { owner, repo, branch, token };
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}

async function ghJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub API failed (${res.status}): ${bodyText}`);
  }
  return (await res.json()) as T;
}

export type GitHubCommitStatusSummary = {
  sha: string;
  state: "error" | "failure" | "pending" | "success";
  statuses: Array<{
    context: string;
    state: "error" | "failure" | "pending" | "success";
    description?: string | null;
    target_url?: string | null;
    updated_at?: string;
  }>;
};

export async function getGitHubFile(path: string, ref?: string): Promise<{ sha: string; text: string }> {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  url.searchParams.set("ref", ref || branch);

  const res = await fetch(url.toString(), { headers: ghHeaders(token), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub get file failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as GitHubFile;
  const text = Buffer.from(json.content, "base64").toString("utf8");
  return { sha: json.sha, text };
}

export async function putGitHubFile(args: {
  path: string;
  text: string;
  message: string;
  sha?: string;
}): Promise<{ commitSha: string; commitUrl?: string }> {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${args.path}`;
  const body: Record<string, string> = {
    message: args.message,
    content: Buffer.from(args.text, "utf8").toString("base64"),
    branch,
  };
  if (args.sha) body.sha = args.sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub put file failed (${res.status}): ${bodyText}`);
  }

  const json = (await res.json()) as { commit?: GitHubCommitInfo };
  return { commitSha: json.commit?.sha || "", commitUrl: json.commit?.html_url };
}

export async function putGitHubBinaryFile(args: {
  path: string;
  base64: string;
  message: string;
  sha?: string;
}): Promise<{ commitSha: string; commitUrl?: string }> {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${args.path}`;
  const body: Record<string, string> = {
    message: args.message,
    content: args.base64,
    branch,
  };
  if (args.sha) body.sha = args.sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub put binary file failed (${res.status}): ${bodyText}`);
  }

  const json = (await res.json()) as { commit?: GitHubCommitInfo };
  return { commitSha: json.commit?.sha || "", commitUrl: json.commit?.html_url };
}

export async function deleteGitHubFile(args: {
  path: string;
  sha: string;
  message: string;
}): Promise<{ commitSha: string; commitUrl?: string }> {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${args.path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ message: args.message, sha: args.sha, branch }),
    cache: "no-store",
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub delete file failed (${res.status}): ${bodyText}`);
  }

  const json = (await res.json()) as { commit?: GitHubCommitInfo };
  return { commitSha: json.commit?.sha || "", commitUrl: json.commit?.html_url };
}

export async function listRecentCommits(perPage = 20) {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
  url.searchParams.set("sha", branch);
  url.searchParams.set("per_page", String(perPage));

  const res = await fetch(url.toString(), { headers: ghHeaders(token), cache: "no-store" });
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub list commits failed (${res.status}): ${bodyText}`);
  }
  return (await res.json()) as Array<{ sha: string; commit: { message: string } }>;
}

export async function getCommitStatus(sha: string): Promise<GitHubCommitStatusSummary> {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/status`;
  const res = await fetch(url, { headers: ghHeaders(token), cache: "no-store" });
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub commit status failed (${res.status}): ${bodyText}`);
  }

  const json = (await res.json()) as {
    sha: string;
    state: "error" | "failure" | "pending" | "success";
    statuses?: Array<{
      context: string;
      state: "error" | "failure" | "pending" | "success";
      description?: string | null;
      target_url?: string | null;
      updated_at?: string;
    }>;
  };

  return {
    sha: json.sha,
    state: json.state,
    statuses: Array.isArray(json.statuses) ? json.statuses : [],
  };
}

export async function getCommitDetails(sha: string) {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  const res = await fetch(url, { headers: ghHeaders(token), cache: "no-store" });
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub commit details failed (${res.status}): ${bodyText}`);
  }
  return (await res.json()) as {
    sha: string;
    html_url?: string;
    parents: Array<{ sha: string }>;
    files?: Array<GitHubCommitFile>;
    commit: { message: string };
  };
}

export async function revertCommit(sha: string): Promise<{ revertedFiles: string[]; revertCommitShas: string[] }> {
  const details = await getCommitDetails(sha);
  const parentSha = details.parents?.[0]?.sha;
  if (!parentSha) throw new Error("Cannot revert: commit has no parent");

  const files = details.files || [];
  if (files.length === 0) throw new Error("Cannot revert: no files listed on commit");

  const revertedFiles: string[] = [];
  const revertCommitShas: string[] = [];

  // We commit each file revert separately because the Contents API only supports single-file commits.
  for (const f of files) {
    const filename = f.filename;
    const status = f.status || "modified";

    if (status === "added") {
      // File didn't exist in parent; revert by deleting it.
      const current = await getGitHubFile(filename);
      const res = await deleteGitHubFile({
        path: filename,
        sha: current.sha,
        message: `telegram: revert ${sha.slice(0, 7)} (delete ${filename})`,
      });
      revertedFiles.push(filename);
      revertCommitShas.push(res.commitSha);
      continue;
    }

    if (status === "removed") {
      // File existed in parent but was deleted; restore it (no sha in current).
      const prev = await getGitHubFile(filename, parentSha);
      const res = await putGitHubFile({
        path: filename,
        text: prev.text,
        message: `telegram: revert ${sha.slice(0, 7)} (restore ${filename})`,
      });
      revertedFiles.push(filename);
      revertCommitShas.push(res.commitSha);
      continue;
    }

    if (status === "renamed") {
      // Best-effort: delete new name and restore previous filename (if provided).
      const current = await getGitHubFile(filename);
      const delRes = await deleteGitHubFile({
        path: filename,
        sha: current.sha,
        message: `telegram: revert ${sha.slice(0, 7)} (delete ${filename})`,
      });
      revertedFiles.push(filename);
      revertCommitShas.push(delRes.commitSha);

      if (f.previous_filename) {
        const prev = await getGitHubFile(f.previous_filename, parentSha);
        const putRes = await putGitHubFile({
          path: f.previous_filename,
          text: prev.text,
          message: `telegram: revert ${sha.slice(0, 7)} (restore ${f.previous_filename})`,
        });
        revertedFiles.push(f.previous_filename);
        revertCommitShas.push(putRes.commitSha);
      }
      continue;
    }

    // modified (or unknown): restore from parent.
    const prev = await getGitHubFile(filename, parentSha);
    const current = await getGitHubFile(filename); // grab sha for update
    const res = await putGitHubFile({
      path: filename,
      text: prev.text,
      sha: current.sha,
      message: `telegram: revert ${sha.slice(0, 7)} (${filename})`,
    });
    revertedFiles.push(filename);
    revertCommitShas.push(res.commitSha);
  }

  return { revertedFiles, revertCommitShas };
}

// ============================================================
// PR-based "code edit flow" helpers
// ============================================================

export async function getHeadSha(ref?: string): Promise<string> {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  const b = ref || branch;
  const url = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(b)}`;
  const json = await ghJson<GitRefResponse>(url, { headers: ghHeaders(token) });
  return json.object.sha;
}

export async function createBranch(args: { branch: string; fromSha: string }) {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  const url = `https://api.github.com/repos/${owner}/${repo}/git/refs`;
  await ghJson(url, {
    method: "POST",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${args.branch}`, sha: args.fromSha }),
  });
}

export async function createCommitWithFiles(args: {
  branch: string;
  message: string;
  files: Array<{ path: string; content?: string; delete?: boolean }>;
}): Promise<{ commitSha: string; commitUrl: string }> {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const baseCommitSha = await getHeadSha(args.branch);
  const baseCommit = await ghJson<{ tree: { sha: string } }>(
    `https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
    { headers: ghHeaders(token) }
  );
  const baseTreeSha = baseCommit.tree.sha;

  const blobs = new Map<string, string>();
  for (const f of args.files) {
    if (f.delete) continue;
    if (typeof f.content !== "string") throw new Error(`Missing content for ${f.path}`);
    const blob = await ghJson<{ sha: string }>(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
      {
        method: "POST",
        headers: { ...ghHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ content: f.content, encoding: "utf-8" }),
      }
    );
    blobs.set(f.path, blob.sha);
  }

  const tree = args.files.map((f) => {
    if (f.delete) {
      return { path: f.path, mode: "100644", type: "blob", sha: null as unknown as string };
    }
    const sha = blobs.get(f.path);
    if (!sha) throw new Error(`Missing blob sha for ${f.path}`);
    return { path: f.path, mode: "100644", type: "blob", sha };
  });

  const newTree = await ghJson<{ sha: string }>(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: baseTreeSha, tree }),
    }
  );

  const newCommit = await ghJson<{ sha: string }>(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ message: args.message, tree: newTree.sha, parents: [baseCommitSha] }),
    }
  );

  await ghJson(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(args.branch)}`,
    {
      method: "PATCH",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ sha: newCommit.sha, force: false }),
    }
  );

  return { commitSha: newCommit.sha, commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}` };
}

export async function createPullRequest(args: {
  title: string;
  body: string;
  head: string;
  base?: string;
}): Promise<{ number: number; html_url: string }> {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  return await ghJson(url, {
    method: "POST",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ title: args.title, body: args.body, head: args.head, base: args.base || branch }),
  });
}

export async function getPullRequest(args: { number: number }): Promise<{ number: number; html_url: string; head: { ref: string } }> {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${args.number}`;
  return await ghJson(url, { headers: ghHeaders(token) });
}

export async function closePullRequest(args: { number: number }) {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${args.number}`;
  await ghJson(url, {
    method: "PATCH",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ state: "closed" }),
  });
}

export async function mergePullRequest(args: {
  number: number;
  title: string;
  message: string;
  method?: "merge" | "squash" | "rebase";
}): Promise<{ sha: string; merged: boolean; message?: string }> {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${args.number}/merge`;
  return await ghJson(url, {
    method: "PUT",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      merge_method: args.method || "squash",
      commit_title: args.title,
      commit_message: args.message,
    }),
  });
}
