import { NextRequest } from "next/server";
import { handleRootsAndWingsFeedbackSubmission } from "@/lib/roots-and-wings-feedback";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleRootsAndWingsFeedbackSubmission(request);
}
