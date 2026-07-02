export const WHERE_ARE_THE_MEN_EVENT_SLUG = "where-are-the-men-croydon-community-conversation";

const londonFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
});

const eventDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const badgeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "numeric",
  month: "long",
});

const fridayIndex = 5;
const weekdayIndex: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function getLondonDateParts(date: Date) {
  const parts = londonFormatter.formatToParts(date);
  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value);

  return {
    day: getPart("day"),
    month: getPart("month"),
    year: getPart("year"),
  };
}

export function getNextWhereAreTheMenEventDate(now = new Date()) {
  const { day, month, year } = getLondonDateParts(now);
  const londonNoon = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = weekdayIndex[weekdayFormatter.format(londonNoon)] ?? fridayIndex;
  const daysUntilFriday = (fridayIndex - weekday + 7) % 7;

  return new Date(Date.UTC(year, month - 1, day + daysUntilFriday, 12));
}

export function getWhereAreTheMenEventCopy(now = new Date()) {
  const eventDate = getNextWhereAreTheMenEventDate(now);
  const parts = eventDateFormatter.formatToParts(eventDate);
  const part = (type: string) => parts.find((candidate) => candidate.type === type)?.value || "";
  const fullDate = `${part("weekday")} ${part("day")} ${part("month")} ${part("year")}`;
  const shortDate = badgeFormatter.format(eventDate);
  const pageHeadingDate = fullDate.replace(/ \d{4}$/, "");

  return {
    badge: `Upcoming: ${shortDate}`,
    dateWithTime: `${fullDate}, 6-9pm`,
    fullDate,
    pageHeading: `${pageHeadingDate}, 159 London Road, Croydon.`,
  };
}
