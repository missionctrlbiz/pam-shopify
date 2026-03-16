import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase"; // Supabase service client

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-shopify-hmac-sha256");

        // Verify webhook signature (Security)
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
        if (secret && signature) {
            const generatedSignature = crypto
                .createHmac("sha256", secret)
                .update(rawBody, "utf8")
                .digest("base64");

            if (generatedSignature !== signature) {
                console.error("[Shopify Webhook] Invalid signature");
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        } else if (!secret) {
            console.warn("[Shopify Webhook] SHOPIFY_WEBHOOK_SECRET is not set. Skipping signature verification in development.");
        }

        const body = JSON.parse(rawBody);

        // Extract email from the order
        const email = body.email || body.customer?.email || body.contact_email;

        if (!email) {
            return NextResponse.json({ error: "No email found in order" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Store in Supabase 'Buyer' table (Upsert avoids errors if buying twice)
        console.log(`[Shopify Webhook] Logging buyer email to Postgres: ${normalizedEmail}`);

        const { error } = await supabaseAdmin
            .from("buyers")
            .upsert({ email: normalizedEmail }, { onConflict: "email" })

        if (error) {
            console.error("[Shopify Webhook] Supabase upsert error:", error)
            return NextResponse.json({ error: "Server error" }, { status: 500 })
        }

        return NextResponse.json({ success: true, email: normalizedEmail });
    } catch (error) {
        console.error("[Shopify Webhook] Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
