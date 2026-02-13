import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    // Auth check
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CMS_API_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Revalidate all pages
        revalidatePath("/", "layout");
        revalidatePath("/events");
        revalidatePath("/contact");

        return NextResponse.json({
            success: true,
            message: "All pages revalidated",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Revalidation failed" },
            { status: 500 }
        );
    }
}
