import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, source = "lead-magnet" } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check for duplicate
        const { data: existing } = await supabaseAdmin
            .from("leads")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle()

        if (!existing) {
            const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null
            const { error: insertError } = await supabaseAdmin
                .from("leads")
                .insert({
                    email: normalizedEmail,
                    name: name?.trim() || null,
                    source,
                    ip,
                })

            if (insertError) {
                console.error("[Leads API] Insert error:", insertError)
                return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 })
            }
        }

        // Also track the usage event
        await supabaseAdmin
            .from("usage_events")
            .insert({
                action: "lead_signup",
                metadata: { email: normalizedEmail, source },
            })

        return NextResponse.json({ success: true, alreadyExists: !!existing });
    } catch (error) {
        console.error("[Leads API] Error:", error);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { data: leads, error } = await supabaseAdmin
            .from("leads")
            .select("id, email, name, source, createdAt")
            .order("createdAt", { ascending: false })

        if (error) {
            console.error("[Leads API] Fetch error:", error)
            return NextResponse.json({ error: "Could not read leads." }, { status: 500 })
        }

        return NextResponse.json({ count: leads?.length ?? 0, leads: leads ?? [] });
    } catch {
        return NextResponse.json({ error: "Could not read leads." }, { status: 500 });
    }
}
