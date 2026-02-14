type GitHubFile = {
  sha: string;
  content: string; // base64
  encoding: "base64";
};

type GitHubCommitInfo = {
  sha: string;
  html_url?: string;
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

export async function getGitHubFile(path: string, ref?: string): Promise<{ sha: string; text: string }> {
  const { owner, repo, branch, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  url.searchParams.set("ref", ref || branch);

  const res = await fetch(url.toString(), { headers: ghHeaders(token) });
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
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub put file failed (${res.status}): ${bodyText}`);
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

  const res = await fetch(url.toString(), { headers: ghHeaders(token) });
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub list commits failed (${res.status}): ${bodyText}`);
  }
  return (await res.json()) as Array<{ sha: string; commit: { message: string } }>;
}

export async function getCommitDetails(sha: string) {
  const { owner, repo, token } = getRepoConfig();
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`GitHub commit details failed (${res.status}): ${bodyText}`);
  }
  return (await res.json()) as {
    sha: string;
    html_url?: string;
    parents: Array<{ sha: string }>;
    files?: Array<{ filename: string }>;
    commit: { message: string };
  };
}

export async function revertCommit(sha: string): Promise<{ revertedFiles: string[]; revertCommitShas: string[] }> {
  const details = await getCommitDetails(sha);
  const parentSha = details.parents?.[0]?.sha;
  if (!parentSha) throw new Error("Cannot revert: commit has no parent");

  const files = (details.files || []).map((f) => f.filename);
  if (files.length === 0) throw new Error("Cannot revert: no files listed on commit");

  const revertedFiles: string[] = [];
  const revertCommitShas: string[] = [];

  // We commit each file revert separately because the Contents API only supports single-file commits.
  for (const file of files) {
    const prev = await getGitHubFile(file, parentSha);
    const current = await getGitHubFile(file); // grab sha for update
    const res = await putGitHubFile({
      path: file,
      text: prev.text,
      sha: current.sha,
      message: `telegram: revert ${sha.slice(0, 7)} (${file})`,
    });
    revertedFiles.push(file);
    revertCommitShas.push(res.commitSha);
  }

  return { revertedFiles, revertCommitShas };
}
