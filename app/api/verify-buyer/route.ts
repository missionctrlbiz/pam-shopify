import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ verified: false, error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if the email exists in the Postgres database
        const buyer = await (prisma as any).buyer.findUnique({
            where: { email: normalizedEmail }
        });

        // Track the verification attempt
        try {
            await (prisma as any).usageEvent.create({
                data: {
                    action: buyer ? "buyer_verified" : "buyer_not_found",
                    metadata: JSON.stringify({ email: normalizedEmail }),
                },
            });
        } catch { /* don't fail if tracking fails */ }

        return NextResponse.json({ verified: !!buyer });
    } catch (error) {
        console.error("[Verify Buyer API] Error:", error);
        return NextResponse.json({ verified: false, error: "Server error" }, { status: 500 });
    }
}
