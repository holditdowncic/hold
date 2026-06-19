import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

import {
  handleRootsAndWingsFeedbackSubmission,
  type RootsAndWingsFeedbackDependencies,
} from "./roots-and-wings-feedback";

function requestWithBody(body: unknown) {
  return new NextRequest("https://www.holditdown.uk/roots-and-wings-feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validFeedback = {
  overallSatisfaction: "5",
  activitiesSatisfaction: "4",
  favoritePart: "The football and family activities.",
  takingAway: "Community matters and families need days like this.",
  connectedImpact: "Yes, significantly",
  futureSuggestions: "More mentoring and wellbeing workshops.",
  attendAgain: "Yes",
  recommend: "Definitely",
  hearFutureEvents: "Yes",
  email: " Parent@Example.COM ",
  ageGroup: "35-44",
  gender: "Female",
};

test("rejects missing required satisfaction ratings", async () => {
  const deps: RootsAndWingsFeedbackDependencies = {
    saveSubmission: async () => {
      throw new Error("save should not be called");
    },
    fetchImpl: async () => {
      throw new Error("telegram should not be called");
    },
  };

  const response = await handleRootsAndWingsFeedbackSubmission(
    requestWithBody({ overallSatisfaction: "5" }),
    deps,
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Please answer both satisfaction rating questions.");
});

test("rejects invalid radio option values", async () => {
  const deps: RootsAndWingsFeedbackDependencies = {
    saveSubmission: async () => {
      throw new Error("save should not be called");
    },
    fetchImpl: async () => {
      throw new Error("telegram should not be called");
    },
  };

  const response = await handleRootsAndWingsFeedbackSubmission(
    requestWithBody({
      ...validFeedback,
      recommend: "Absolutely yes please",
    }),
    deps,
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Please choose one of the available feedback options.");
});

test("saves Roots and Wings feedback and notifies Telegram admins", async () => {
  const savedPayloads: unknown[] = [];
  const telegramRequests: unknown[] = [];
  const deps: RootsAndWingsFeedbackDependencies = {
    telegramBotToken: "bot-token",
    telegramAdminIds: ["111", "222"],
    saveSubmission: async (input) => {
      savedPayloads.push(input);
      return { saved: true, backend: "table", id: "feedback-1" };
    },
    fetchImpl: async (_url, init) => {
      telegramRequests.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  };

  const response = await handleRootsAndWingsFeedbackSubmission(
    requestWithBody(validFeedback),
    deps,
  );
  const body = await response.json();
  const savedInput = savedPayloads[0] as Record<string, unknown>;
  const payload = savedInput.payload as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, redirectTo: "/roots-and-wings" });
  assert.equal(savedInput.formType, "roots_and_wings_feedback");
  assert.equal(savedInput.sourcePath, "/roots-and-wings-feedback");
  assert.equal(savedInput.contactEmail, "parent@example.com");
  assert.equal(savedInput.subject, "Roots & Wings feedback");
  assert.deepEqual(payload, {
    overallSatisfaction: 5,
    activitiesSatisfaction: 4,
    favoritePart: "The football and family activities.",
    takingAway: "Community matters and families need days like this.",
    connectedImpact: "Yes, significantly",
    futureSuggestions: "More mentoring and wellbeing workshops.",
    attendAgain: "Yes",
    recommend: "Definitely",
    hearFutureEvents: "Yes",
    email: "parent@example.com",
    ageGroup: "35-44",
    gender: "Female",
    event: "Roots & Wings",
  });
  assert.equal(telegramRequests.length, 2);
  assert.deepEqual(
    telegramRequests.map((request) => request.chat_id),
    ["111", "222"],
  );
  assert.match(String(telegramRequests[0].text), /Roots &amp; Wings feedback/);
  assert.match(String(telegramRequests[0].text), /Overall satisfaction:<\/b> 5\/5/);
});

test("returns unavailable when feedback cannot be saved", async () => {
  const deps: RootsAndWingsFeedbackDependencies = {
    saveSubmission: async () => ({ saved: false, error: "storage down" }),
    fetchImpl: async () => {
      throw new Error("telegram should not be called");
    },
  };

  const response = await handleRootsAndWingsFeedbackSubmission(
    requestWithBody(validFeedback),
    deps,
  );
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, "The feedback form is temporarily unavailable. Please try again shortly.");
});
