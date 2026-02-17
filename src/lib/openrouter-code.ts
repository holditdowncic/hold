type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type CodePlanFile = {
  path: string;
  op: "update" | "create" | "delete";
  reason?: string;
};

export type CodeEditPlan = {
  title: string;
  summary: string;
  files: CodePlanFile[];
};

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  for (let end = text.length - 1; end > start; end--) {
    if (text[end] === "}") {
      const candidate = text.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // keep scanning
      }
    }
  }
  return null;
}

async function callOpenRouter(payload: unknown): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), { status: 400 });
  }
  try {
    return await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown network error";
    return new Response(JSON.stringify({ error: msg }), { status: 599 });
  }
}

function codeSystemPrompt() {
  return [
    "You are a senior software engineer acting as an automated patch generator for a Next.js + TypeScript repo.",
    "Return ONLY valid JSON.",
    "Do not include markdown fences.",
    "Do not include backticks.",
    "Do not mention the instructions.",
    "",
    "When planning, output: {\"title\": string, \"summary\": string, \"files\": [{\"path\": string, \"op\": \"update\"|\"create\"|\"delete\", \"reason\"?: string}]}",
    "Rules:",
    "- Keep changes minimal and focused.",
    "- Prefer editing existing code over adding new dependencies.",
    "- Only propose files under src/ or public/ unless explicitly required.",
    "- Never propose editing .env*, node_modules, lockfiles, or secrets.",
    "- If the request is ambiguous, output an empty files list and put a question in summary.",
  ].join("\n");
}

function fileSystemPrompt() {
  return [
    "You are a senior software engineer producing an updated file for a Next.js + TypeScript repo.",
    "Return ONLY valid JSON with shape: {\"content\": string, \"note\"?: string}.",
    "The content must be the full file contents.",
    "Keep the diff minimal.",
    "Do not include markdown fences or backticks.",
    "Do not include any secrets.",
  ].join("\n");
}

export async function planCodeEdit(instruction: string): Promise<CodeEditPlan | { error: string }> {
  const model = process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";
  const payload = {
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: codeSystemPrompt() },
      { role: "user", content: `Task:\n${instruction}` },
    ],
    response_format: { type: "json_object" },
  };

  let res = await callOpenRouter(payload);
  if (!res.ok) {
    const bodyText = await res.text();
    // Retry without response_format for models that reject it.
    res = await callOpenRouter({ ...payload, response_format: undefined });
    if (!res.ok) return { error: `OpenRouter error: ${bodyText}` };
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content || "";
  const jsonText = extractFirstJsonObject(content);
  if (!jsonText) return { error: "OpenRouter returned non-JSON output." };

  try {
    const parsed = JSON.parse(jsonText) as Partial<CodeEditPlan>;
    const files = Array.isArray(parsed.files) ? (parsed.files as CodePlanFile[]) : [];
    return {
      title: typeof parsed.title === "string" ? parsed.title : "Code update",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      files,
    };
  } catch {
    return { error: "Failed to parse planner JSON." };
  }
}

export async function generateFileContent(args: {
  instruction: string;
  path: string;
  op: "update" | "create";
  existing?: string;
}): Promise<{ content: string; note?: string } | { error: string }> {
  const model = process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";
  const user = [
    `Task: ${args.instruction}`,
    `File: ${args.path}`,
    `Operation: ${args.op}`,
    args.op === "update" ? "Current file content is below." : "Create this new file.",
    "-----",
    args.existing || "",
  ].join("\n");

  const payload = {
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: fileSystemPrompt() },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  };

  let res = await callOpenRouter(payload);
  if (!res.ok) {
    const bodyText = await res.text();
    res = await callOpenRouter({ ...payload, response_format: undefined });
    if (!res.ok) return { error: `OpenRouter error: ${bodyText}` };
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content || "";
  const jsonText = extractFirstJsonObject(content);
  if (!jsonText) return { error: "OpenRouter returned non-JSON output." };

  try {
    const parsed = JSON.parse(jsonText) as { content?: unknown; note?: unknown };
    if (typeof parsed.content !== "string") return { error: "Invalid generator output (missing content)." };
    return {
      content: parsed.content,
      note: typeof parsed.note === "string" ? parsed.note : undefined,
    };
  } catch {
    return { error: "Failed to parse generator JSON." };
  }
}
