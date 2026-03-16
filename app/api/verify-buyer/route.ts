import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ verified: false, error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if the email exists in the Postgres database
        const { data: buyer } = await supabaseAdmin
            .from("buyers")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle()

        // Track the verification attempt
        try {
            await supabaseAdmin
                .from("usage_events")
                .insert({
                    action: buyer ? "buyer_verified" : "buyer_not_found",
                    metadata: { email: normalizedEmail },
                })
        } catch { /* don't fail if tracking fails */ }

        return NextResponse.json({ verified: !!buyer });
    } catch (error) {
        console.error("[Verify Buyer API] Error:", error);
        return NextResponse.json({ verified: false, error: "Server error" }, { status: 500 });
    }
}
