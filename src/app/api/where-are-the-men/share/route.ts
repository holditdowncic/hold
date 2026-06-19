import { NextRequest } from "next/server";
import { handleWhereAreTheMenShareSubmission } from "@/lib/where-are-the-men-share";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleWhereAreTheMenShareSubmission(request);
}
