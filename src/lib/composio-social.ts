import { timingSafeEqual } from "node:crypto";

export type SocialPlatformSlug = "instagram" | "facebook" | "linkedin";

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type SocialPlatformConfig = {
  slug: SocialPlatformSlug;
  displayName: string;
  toolkitSlug: string;
  authConfigEnv: string;
  inviteTokenEnv: string;
};

type ConnectLinkSuccess = {
  ok: true;
  redirectUrl: string;
  expiresAt: string | null;
  connectedAccountId: string | null;
};

type ConnectLinkFailure = {
  ok: false;
  status: number;
  code:
    | "unsupported_platform"
    | "invalid_invite"
    | "missing_config"
    | "composio_error"
    | "invalid_composio_response";
  message: string;
};

type CreateConnectLinkOptions = {
  platform: string;
  inviteToken: string;
  requestUrl: string;
  fetchImpl?: FetchLike;
};

const COMPOSIO_API_BASE_URL = "https://backend.composio.dev/api/v3.1";

const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    slug: "instagram",
    displayName: "Instagram",
    toolkitSlug: "instagram",
    authConfigEnv: "COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID",
    inviteTokenEnv: "COMPOSIO_INSTAGRAM_INVITE_TOKEN",
  },
  {
    slug: "facebook",
    displayName: "Facebook",
    toolkitSlug: "facebook",
    authConfigEnv: "COMPOSIO_FACEBOOK_AUTH_CONFIG_ID",
    inviteTokenEnv: "COMPOSIO_FACEBOOK_INVITE_TOKEN",
  },
  {
    slug: "linkedin",
    displayName: "LinkedIn",
    toolkitSlug: "linkedin",
    authConfigEnv: "COMPOSIO_LINKEDIN_AUTH_CONFIG_ID",
    inviteTokenEnv: "COMPOSIO_LINKEDIN_INVITE_TOKEN",
  },
];

export function getSocialPlatformConfig(platform: string): SocialPlatformConfig | null {
  const normalized = platform.toLowerCase().trim();
  return SOCIAL_PLATFORMS.find((candidate) => candidate.slug === normalized) || null;
}

export function getSocialPlatformDisplayName(platform: string) {
  return getSocialPlatformConfig(platform)?.displayName || "Social account";
}

function envValue(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function inviteMatches(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function callbackUrlFor(requestUrl: string, platform: SocialPlatformSlug) {
  const callbackUrl = new URL("/connect-social/complete", requestUrl);
  callbackUrl.searchParams.set("platform", platform);
  return callbackUrl.toString();
}

export async function createComposioSocialConnectLink({
  platform,
  inviteToken,
  requestUrl,
  fetchImpl = fetch,
}: CreateConnectLinkOptions): Promise<ConnectLinkSuccess | ConnectLinkFailure> {
  const config = getSocialPlatformConfig(platform);
  if (!config) {
    return {
      ok: false,
      status: 404,
      code: "unsupported_platform",
      message: "This social platform is not configured.",
    };
  }

  const expectedInvite = envValue(config.inviteTokenEnv);
  if (!expectedInvite || !inviteMatches(inviteToken, expectedInvite)) {
    return {
      ok: false,
      status: expectedInvite ? 404 : 500,
      code: expectedInvite ? "invalid_invite" : "missing_config",
      message: expectedInvite ? "This invite link is not valid." : "The invite token is not configured.",
    };
  }

  const apiKey = envValue("COMPOSIO_API_KEY");
  const authConfigId = envValue(config.authConfigEnv);
  if (!apiKey || !authConfigId) {
    return {
      ok: false,
      status: 500,
      code: "missing_config",
      message: "Composio is not fully configured for this platform.",
    };
  }

  const baseUrl = envValue("COMPOSIO_API_BASE_URL") || COMPOSIO_API_BASE_URL;
  const userId = envValue("COMPOSIO_SOCIAL_USER_ID") || "holditdown-socials";
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/connected_accounts/link`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      auth_config_id: authConfigId,
      user_id: userId,
      callback_url: callbackUrlFor(requestUrl, config.slug),
    }),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      code: "composio_error",
      message: "Composio could not create a fresh connection link.",
    };
  }

  const payload = body as {
    redirect_url?: unknown;
    expires_at?: unknown;
    connected_account_id?: unknown;
  };

  if (typeof payload.redirect_url !== "string" || !payload.redirect_url.startsWith("http")) {
    return {
      ok: false,
      status: 502,
      code: "invalid_composio_response",
      message: "Composio did not return a usable connection link.",
    };
  }

  return {
    ok: true,
    redirectUrl: payload.redirect_url,
    expiresAt: typeof payload.expires_at === "string" ? payload.expires_at : null,
    connectedAccountId:
      typeof payload.connected_account_id === "string" ? payload.connected_account_id : null,
  };
}
