import { NextRequest, NextResponse } from "next/server";
import {
  listTreeSubmissions,
  updateTreeSubmissionStatus,
  verifyTreeAdminPassword,
} from "@/lib/tree-of-hope-server";
import type { TreeModerationStatus } from "@/lib/tree-of-hope";

export const runtime = "nodejs";

function authValue(request: NextRequest) {
  const header = request.headers.get("x-tree-admin-password") || request.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim();
}

function validStatus(value: string | null): value is TreeModerationStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function unauthorized() {
  return NextResponse.json({ error: "Tree admin password required." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const id = searchParams.get("id");
  const status = searchParams.get("status");

  if (token && id && validStatus(status)) {
    if (!verifyTreeAdminPassword(token)) return unauthorized();
    await updateTreeSubmissionStatus(id, status, "email-link");
    return NextResponse.redirect(new URL(`/tree-admin?updated=${status}`, request.url));
  }

  if (!verifyTreeAdminPassword(authValue(request))) return unauthorized();
  const submissions = await listTreeSubmissions();
  return NextResponse.json({ submissions });
}

export async function POST(request: NextRequest) {
  if (!verifyTreeAdminPassword(authValue(request))) return unauthorized();

  const body = (await request.json()) as { id?: string; status?: string };
  const status = body.status || null;
  if (!body.id || !validStatus(status)) {
    return NextResponse.json({ error: "Valid id and status are required." }, { status: 400 });
  }

  const contribution = await updateTreeSubmissionStatus(body.id, status, "tree-admin");
  return NextResponse.json({ success: true, contribution });
}
