import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();

        if (!action || !["accepted", "declined"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        await supabaseAdmin.from("cookie_consent_log").insert({
            action,
            user_agent: request.headers.get("user-agent") || "",
            country: request.headers.get("x-vercel-ip-country") || "",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cookie consent tracking error:", error);
        return NextResponse.json({ success: true }); // Don't break UX
    }
}
