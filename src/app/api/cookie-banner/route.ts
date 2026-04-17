import { NextResponse } from "next/server";
import { getCookieBannerContent } from "@/lib/content";

export async function GET() {
    const content = await getCookieBannerContent();

    return NextResponse.json({
        message:
            content?.message ??
            "We use essential cookies and similar local storage to remember your preferences and support core site functions.",
        accept_text: content?.accept_text ?? "OK",
        decline_text: content?.decline_text ?? "Close",
        policy_link: content?.policy_link ?? "/privacy-policy",
        enabled: content?.enabled ?? true,
    });
}
