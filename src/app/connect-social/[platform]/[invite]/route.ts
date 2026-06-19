import { NextRequest, NextResponse } from "next/server";
import { createComposioSocialConnectLink } from "@/lib/composio-social";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    platform: string;
    invite: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { platform, invite } = await context.params;
  const result = await createComposioSocialConnectLink({
    platform,
    inviteToken: invite,
    requestUrl: request.url,
  });

  if (result.ok) {
    return NextResponse.redirect(result.redirectUrl, 303);
  }

  const errorUrl = new URL("/connect-social/error", request.url);
  errorUrl.searchParams.set("platform", platform);
  errorUrl.searchParams.set("code", result.code);
  return NextResponse.redirect(errorUrl, 303);
}
