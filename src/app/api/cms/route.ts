import { NextRequest, NextResponse } from "next/server";
import { executeCMSAction } from "@/lib/cms-actions";

// Auth check
function isAuthorized(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CMS_API_SECRET;
    if (!secret) return false;
    return authHeader === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const result = await executeCMSAction(body);

        if (result.success) {
            return NextResponse.json({ success: true, result: result.result });
        }
        return NextResponse.json({ error: result.error }, { status: result.error === "Supabase not configured" ? 503 : 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("CMS API error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
