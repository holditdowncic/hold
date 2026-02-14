import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    now: new Date().toISOString(),
    vercel: {
      env: process.env.VERCEL_ENV || null,
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      git: {
        sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        ref: process.env.VERCEL_GIT_COMMIT_REF || null,
        message: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
      },
    },
  });
}

