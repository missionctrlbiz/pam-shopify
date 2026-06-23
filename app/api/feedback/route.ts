import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

/**
 * Feedback form submission from the public marketing site.
 *
 * Stores { name, email, message } as a `feedback` row in the
 * `usage_events` table (no dedicated table exists yet). Lightweight,
 * anonymous-friendly, and admin-readable via Supabase Studio.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, message } = body ?? {};

        if (
            typeof message !== "string" ||
            message.trim().length === 0
        ) {
            return NextResponse.json(
                { error: "A message is required." },
                { status: 400 }
            );
        }

        if (email && typeof email === "string") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return NextResponse.json(
                    { error: "Invalid email format." },
                    { status: 400 }
                );
            }
        }

        const ip =
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            null;

        const { error: insertError } = await supabaseAdmin
            .from("usage_events")
            .insert({
                action: "feedback_submission",
                metadata: {
                    name: typeof name === "string" ? name.trim() : null,
                    email:
                        typeof email === "string"
                            ? email.trim().toLowerCase()
                            : null,
                    message: message.trim(),
                    ip,
                },
            });

        if (insertError) {
            console.error("[Feedback API] Insert error:", insertError);
            return NextResponse.json(
                { error: "Server error. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Feedback API] Error:", error);
        return NextResponse.json(
            { error: "Server error. Please try again." },
            { status: 500 }
        );
    }
}
