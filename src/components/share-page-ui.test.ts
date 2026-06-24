import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { isCookieBannerSuppressedPath } from "./CookieBanner";

test("suppresses cookie banner on the Where Are The Men QR share page only", () => {
  assert.equal(isCookieBannerSuppressedPath("/where-are-the-men/share"), true);
  assert.equal(isCookieBannerSuppressedPath("/where-are-the-men/share/"), true);
  assert.equal(isCookieBannerSuppressedPath("/roots-and-wings-feedback"), true);
  assert.equal(isCookieBannerSuppressedPath("/roots-and-wings-feedback/"), true);
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

test("Where Are The Men share form allows longer thoughts without showing the counter early", async () => {
  const source = await readFile(
    new URL("../app/where-are-the-men/share/ShareYourVoiceForm.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("maxLength={2000}"), true);
  assert.equal(source.includes("message.length >= 1800"), true);
  assert.equal(source.includes("/700"), false);
});

test("Roots and Wings feedback form includes the requested questions", async () => {
  const source = await readFile(
    new URL("../app/roots-and-wings-feedback/RootsAndWingsFeedbackForm.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("ROOTS & WINGS FEEDBACK FORM"), true);
  assert.equal(source.includes("How satisfied were you with the event overall?"), true);
  assert.equal(source.includes("What was your favourite part of the day?"), true);
  assert.equal(source.includes("What is one thing you are taking away from today?"), true);
  assert.equal(source.includes("Would you recommend Roots & Wings to a friend or family member?"), true);
  assert.equal(source.includes("Email Address (Optional)"), true);
});

test("Roots and Wings feedback is surfaced from the scrolling banner", async () => {
  const source = await readFile(
    new URL("./VotePopup.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes('href="/roots-and-wings-feedback"'), true);
  assert.equal(source.includes("Roots & Wings 2026"), true);
  assert.equal(source.includes("tell us how we did"), true);
});

test("Roots and Wings project page includes the feedback form and QR code", async () => {
  const source = await readFile(
    new URL("../app/roots-and-wings/RootsAndWingsClient.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes('href="/roots-and-wings-feedback"'), true);
  assert.equal(source.includes("/media/roots-and-wings/feedback-qr.png"), true);
  assert.equal(source.includes("Feedback form for Roots & Wings event"), true);
});
