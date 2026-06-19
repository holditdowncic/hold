import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import {
  createComposioSocialConnectLink,
  getSocialPlatformConfig,
  type SocialPlatformSlug,
} from "./composio-social";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.COMPOSIO_API_KEY = "test-key";
  process.env.COMPOSIO_API_BASE_URL = "https://example.test/api/v3.1";
  process.env.COMPOSIO_SOCIAL_USER_ID = "holditdown-test";
  process.env.COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID = "ac_instagram";
  process.env.COMPOSIO_FACEBOOK_AUTH_CONFIG_ID = "ac_facebook";
  process.env.COMPOSIO_LINKEDIN_AUTH_CONFIG_ID = "ac_linkedin";
  process.env.COMPOSIO_INSTAGRAM_INVITE_TOKEN = "ig-token";
  process.env.COMPOSIO_FACEBOOK_INVITE_TOKEN = "fb-token";
  process.env.COMPOSIO_LINKEDIN_INVITE_TOKEN = "li-token";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

test("resolves supported social platform config", () => {
  assert.equal(getSocialPlatformConfig("instagram")?.displayName, "Instagram");
  assert.equal(getSocialPlatformConfig("facebook")?.displayName, "Facebook");
  assert.equal(getSocialPlatformConfig("linkedin")?.displayName, "LinkedIn");
  assert.equal(getSocialPlatformConfig("threads"), null);
});

test("rejects unsupported social platform", async () => {
  const result = await createComposioSocialConnectLink({
    platform: "threads",
    inviteToken: "anything",
    requestUrl: "https://www.holditdown.uk/connect-social/threads/anything",
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(result.code, "unsupported_platform");
});

test("rejects wrong invite token before calling Composio", async () => {
  const result = await createComposioSocialConnectLink({
    platform: "instagram",
    inviteToken: "wrong-token",
    requestUrl: "https://www.holditdown.uk/connect-social/instagram/wrong-token",
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(result.code, "invalid_invite");
});

test("reports missing auth config env", async () => {
  delete process.env.COMPOSIO_LINKEDIN_AUTH_CONFIG_ID;

  const result = await createComposioSocialConnectLink({
    platform: "linkedin",
    inviteToken: "li-token",
    requestUrl: "https://www.holditdown.uk/connect-social/linkedin/li-token",
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 500);
  assert.equal(result.code, "missing_config");
});

test("creates a Composio connect link with callback and stable user id", async () => {
  let capturedUrl = "";
  let capturedBody: unknown = null;
  let capturedKey = "";

  const result = await createComposioSocialConnectLink({
    platform: "instagram",
    inviteToken: "ig-token",
    requestUrl: "https://www.holditdown.uk/connect-social/instagram/ig-token",
    fetchImpl: async (input, init) => {
      capturedUrl = String(input);
      capturedKey = String((init?.headers as Record<string, string>)["x-api-key"]);
      capturedBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          redirect_url: "https://auth.composio.dev/connect/example",
          expires_at: "2026-06-19T10:00:00Z",
          connected_account_id: "ca_test",
        }),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      );
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.redirectUrl, "https://auth.composio.dev/connect/example");
  assert.equal(capturedUrl, "https://example.test/api/v3.1/connected_accounts/link");
  assert.equal(capturedKey, "test-key");
  assert.deepEqual(capturedBody, {
    auth_config_id: "ac_instagram",
    user_id: "holditdown-test",
    callback_url: "https://www.holditdown.uk/connect-social/complete?platform=instagram",
  });
});

test("accepts platform slugs as typed values", () => {
  const slugs: SocialPlatformSlug[] = ["instagram", "facebook", "linkedin"];
  assert.deepEqual(slugs.map((slug) => getSocialPlatformConfig(slug)?.toolkitSlug), slugs);
});
