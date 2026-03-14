import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
        const existing = await (prisma as any).lead.findFirst({
            where: { email: normalizedEmail },
        });

        if (!existing) {
            await (prisma as any).lead.create({
                data: {
                    email: normalizedEmail,
                    name: name?.trim() || null,
                    source,
                    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
                },
            });
        }

        // Also track the usage event
        await (prisma as any).usageEvent.create({
            data: {
                action: "lead_signup",
                metadata: { email: normalizedEmail, source },
            },
        });

        return NextResponse.json({ success: true, alreadyExists: !!existing });
    } catch (error) {
        console.error("[Leads API] Error:", error);
        return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
    }
}

export async function GET() {
    try {
        const leads = await (prisma as any).lead.findMany({ orderBy: { createdAt: "desc" } });
        return NextResponse.json({ count: leads.length, leads });
    } catch {
        return NextResponse.json({ error: "Could not read leads." }, { status: 500 });
    }
}
