import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

import {
  handleWhereAreTheMenShareSubmission,
  type WhereAreTheMenShareDependencies,
} from "./where-are-the-men-share";

function requestWithBody(body: unknown) {
  return new NextRequest("https://www.holditdown.uk/where-are-the-men/share", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("rejects missing name and message", async () => {
  const deps: WhereAreTheMenShareDependencies = {
    saveSubmission: async () => {
      throw new Error("save should not be called");
    },
    fetchImpl: async () => {
      throw new Error("telegram should not be called");
    },
  };

  const response = await handleWhereAreTheMenShareSubmission(
    requestWithBody({ name: "", message: "" }),
    deps,
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Please add your name and what you want to share.");
});

test("returns unavailable when the submission cannot be saved", async () => {
  const deps: WhereAreTheMenShareDependencies = {
    saveSubmission: async () => ({ saved: false, error: "storage down" }),
    fetchImpl: async () => {
      throw new Error("telegram should not be called");
    },
  };

  const response = await handleWhereAreTheMenShareSubmission(
    requestWithBody({ name: "Marcus", message: "More spaces for young men to talk openly." }),
    deps,
  );
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, "The form is temporarily unavailable. Please try again shortly.");
});

test("rejects oversized direct API submissions instead of truncating them", async () => {
  const deps: WhereAreTheMenShareDependencies = {
    saveSubmission: async () => {
      throw new Error("save should not be called");
    },
    fetchImpl: async () => {
      throw new Error("telegram should not be called");
    },
  };

  const response = await handleWhereAreTheMenShareSubmission(
    requestWithBody({ name: "Marcus", message: "a".repeat(2001) }),
    deps,
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Please keep your message to 2000 characters or less.");
});

test("accepts direct API submissions up to two thousand characters", async () => {
  const savedPayloads: unknown[] = [];
  const deps: WhereAreTheMenShareDependencies = {
    telegramBotToken: "bot-token",
    telegramAdminIds: ["111"],
    saveSubmission: async (input) => {
      savedPayloads.push(input);
      return { saved: true, backend: "table", id: "submission-1" };
    },
    fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  };

  const response = await handleWhereAreTheMenShareSubmission(
    requestWithBody({ name: "Marcus", message: "a".repeat(2000) }),
    deps,
  );
  const body = await response.json();
  const savedInput = savedPayloads[0] as Record<string, unknown>;
  const payload = savedInput.payload as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, redirectTo: "/" });
  assert.equal(payload.message, "a".repeat(2000));
});

test("rate limited submissions are rejected before save and Telegram notification", async () => {
  const deps: WhereAreTheMenShareDependencies = {
    isRateLimited: async () => true,
    saveSubmission: async () => {
      throw new Error("save should not be called");
    },
    fetchImpl: async () => {
      throw new Error("telegram should not be called");
    },
  };

  const response = await handleWhereAreTheMenShareSubmission(
    requestWithBody({ name: "Marcus", message: "More safe places for boys to talk." }),
    deps,
  );
  const body = await response.json();

  assert.equal(response.status, 429);
  assert.equal(body.error, "Too many submissions. Please wait a minute and try again.");
});

test("saves the share submission and notifies Telegram admins", async () => {
  const savedPayloads: unknown[] = [];
  const telegramRequests: unknown[] = [];
  const deps: WhereAreTheMenShareDependencies = {
    telegramBotToken: "bot-token",
    telegramAdminIds: ["111", "222"],
    saveSubmission: async (input) => {
      savedPayloads.push(input);
      return { saved: true, backend: "table", id: "submission-1" };
    },
    fetchImpl: async (_url, init) => {
      telegramRequests.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  };

  const response = await handleWhereAreTheMenShareSubmission(
    requestWithBody({
      name: " Marcus ",
      message: " I want more safe places where boys can speak honestly. ",
    }),
    deps,
  );
  const body = await response.json();
  const savedInput = savedPayloads[0] as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, redirectTo: "/" });
  assert.equal(savedPayloads.length, 1);
  assert.deepEqual({
    formType: savedInput.formType,
    sourcePath: savedInput.sourcePath,
    payload: savedInput.payload,
    contactName: savedInput.contactName,
    subject: savedInput.subject,
  }, {
    formType: "where_are_the_men_share",
    sourcePath: "/where-are-the-men/share",
    payload: {
      name: "Marcus",
      message: "I want more safe places where boys can speak honestly.",
      campaign: "Where Are The Men",
      event: "Friday 26 June 2026",
    },
    contactName: "Marcus",
    subject: "Where Are The Men - Share Your Voice",
  });
  assert.equal(telegramRequests.length, 2);
  assert.deepEqual(
    telegramRequests.map((request) => request.chat_id),
    ["111", "222"],
  );
  assert.match(String(telegramRequests[0].text), /Where Are The Men voice shared/);
  assert.match(String(telegramRequests[0].text), /Marcus/);
});
