import { NextResponse } from "next/server";
import { getCookieBannerContent } from "@/lib/content";

export async function GET() {
    const content = await getCookieBannerContent();

    return NextResponse.json({
        message:
            content?.message ??
            "We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.",
        accept_text: content?.accept_text ?? "Accept All",
        decline_text: content?.decline_text ?? "Decline",
        policy_link: content?.policy_link ?? null,
        enabled: content?.enabled ?? true,
    });
}
