import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.TELEGRAM_SETUP_SECRET || process.env.CMS_API_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commands = [
    { command: "help", description: "Show bot commands and examples" },
    { command: "sections", description: "List editable sections" },
    { command: "status", description: "Show GitHub/Deploy status" },
    { command: "deploy", description: "Show deploy status for last change" },
    { command: "undo", description: "Undo the last Telegram change" },
    { command: "revert", description: "Same as /undo" },
    { command: "reset", description: "Clear pending preview" },
  ];

  try {
    const res = await fetch(`${TELEGRAM_API}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands }),
    });
    const data = await res.json();
    return NextResponse.json({ success: true, telegram: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
