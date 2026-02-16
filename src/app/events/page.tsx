import EventsClient from "./EventsClient";
import { getEvents, getEventsMeta } from "@/lib/content";

export default async function EventsPage() {
  const [events, meta] = await Promise.all([getEvents(), getEventsMeta()]);
  return <EventsClient events={events} meta={meta} />;
}

