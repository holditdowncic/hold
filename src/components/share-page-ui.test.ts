import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { isCookieBannerSuppressedPath } from "./CookieBanner";

test("suppresses cookie banner on the Where Are The Men QR share page only", () => {
  assert.equal(isCookieBannerSuppressedPath("/where-are-the-men/share"), true);
  assert.equal(isCookieBannerSuppressedPath("/where-are-the-men/share/"), true);
  assert.equal(isCookieBannerSuppressedPath("/where-are-the-men"), false);
  assert.equal(isCookieBannerSuppressedPath("/"), false);
});

test("Where Are The Men share form does not show the Telegram storage disclaimer", async () => {
  const source = await readFile(
    new URL("../app/where-are-the-men/share/ShareYourVoiceForm.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("By sending, you agree"), false);
  assert.equal(source.includes("send it to the team by Telegram"), false);
});

test("Where Are The Men share form uses a compact desktop layout", async () => {
  const source = await readFile(
    new URL("../app/where-are-the-men/share/ShareYourVoiceForm.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("max-w-xl"), true);
  assert.equal(source.includes('maxWidth: "36rem"'), true);
  assert.equal(source.includes("max-w-[560px]"), false);
  assert.equal(source.includes("sm:min-h-[160px]"), true);
});
