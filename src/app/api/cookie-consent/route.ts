import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();

        if (!action || !["accepted", "declined"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
        // CMS removed: we no longer log consent to a database.
        // Keep the endpoint so UX doesn't break (fire-and-forget in the client).
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cookie consent tracking error:", error);
        return NextResponse.json({ success: true }); // Don't break UX
    }
}
