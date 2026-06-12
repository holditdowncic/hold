import { Filter } from "bad-words";

export type TreeSubmissionErrorType =
  | "profanity"
  | "too-short"
  | "all-caps"
  | "gibberish"
  | "link"
  | "rate-limit";

export const treeSubmissionErrors: Record<TreeSubmissionErrorType, string> = {
  profanity: "This message contains language we can't add to the tree. Please rewrite it and try again.",
  "too-short": "Your message is too short. Say a little more - even one full sentence is enough.",
  "all-caps": "Please rewrite your message in normal text rather than capitals.",
  gibberish: "This doesn't look like a real message. Take a moment and try again.",
  link: "Messages can't contain links or email addresses. Just your words are needed here.",
  "rate-limit": "You've already added your leaves today. Come back tomorrow to add more.",
};

export const treeFlagWords = [
  "hate",
  "kill",
  "die",
  "fight",
  "attack",
  "abuse",
  "stupid",
  "idiot",
  "ugly",
  "dumb",
];

const customProfanityWords = [
  "racist",
  "nigger",
  "nigga",
  "paki",
  "chink",
  "spastic",
  "retard",
  "faggot",
  "tranny",
  "slag",
  "whore",
  "cunt",
  "twat",
  "bastard",
  "prick",
  "battyboy",
  "bloodclaat",
  "bumbaclaat",
];

const filter = new Filter();
filter.addWords(...customProfanityWords);

function normaliseText(value: string) {
  return value.trim();
}

export function validateTreeSubmissionText(messageInput: string, nameInput: string): TreeSubmissionErrorType | null {
  const message = normaliseText(messageInput);
  const name = normaliseText(nameInput);

  if (filter.isProfane(message) || filter.isProfane(name)) return "profanity";
  if (message.length < 10) return "too-short";

  const isAllCaps = message === message.toUpperCase() && message.length > 10 && /[A-Z]/.test(message);
  if (isAllCaps) return "all-caps";

  const isGibberish = /(.)\1{4,}/.test(message);
  if (isGibberish) return "gibberish";

  const hasLink = /(https?:\/\/|www\.|@)/i.test(message);
  if (hasLink) return "link";

  return null;
}

export function containsTreeProfanity(messageInput: string, nameInput: string) {
  return filter.isProfane(normaliseText(messageInput)) || filter.isProfane(normaliseText(nameInput));
}

export function findTreeFlagWords(messageInput: string, nameInput = "") {
  const haystack = `${messageInput} ${nameInput}`.toLowerCase();
  return treeFlagWords.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(haystack));
}
