/**
 * GitHub API client for committing CMS content changes.
 * After each CMS action, we push a JSON snapshot to the repo
 * so Vercel auto-deploys from the new commit.
 */

const GITHUB_OWNER = "holditdowncic";
const GITHUB_REPO = "hold";
const GITHUB_BRANCH = "main";

interface GitHubCommitResult {
    success: boolean;
    commitUrl?: string;
    error?: string;
}

/**
 * Commit a JSON content file to the GitHub repo.
 * Uses the GitHub Contents API (simple single-file commits).
 */
export async function commitToGitHub(
    filePath: string,
    content: string,
    commitMessage: string
): Promise<GitHubCommitResult> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error("GITHUB_TOKEN not set");
        return { success: false, error: "GITHUB_TOKEN not configured" };
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    try {
        // 1. Check if file already exists (to get its SHA for updates)
        let existingSha: string | undefined;
        const getResp = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (getResp.ok) {
            const existing = await getResp.json();
            existingSha = existing.sha;
        }

        // 2. Create or update the file
        const body: Record<string, string> = {
            message: commitMessage,
            content: Buffer.from(content).toString("base64"),
            branch: GITHUB_BRANCH,
        };

        if (existingSha) {
            body.sha = existingSha;
        }

        const putResp = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!putResp.ok) {
            const errData = await putResp.json();
            console.error("GitHub commit failed:", errData);
            return { success: false, error: errData.message || "GitHub API error" };
        }

        const result = await putResp.json();
        return {
            success: true,
            commitUrl: result.commit?.html_url,
        };
    } catch (error) {
        console.error("GitHub commit error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Commit a content snapshot for a specific table.
 * Stores as `data/<tableName>.json` in the repo.
 */
export async function commitContentSnapshot(
    tableName: string,
    data: unknown,
    description: string
): Promise<GitHubCommitResult> {
    const filePath = `data/${tableName}.json`;
    const content = JSON.stringify(data, null, 2);
    const commitMessage = `cms: ${description}`;

    return commitToGitHub(filePath, content, commitMessage);
}
