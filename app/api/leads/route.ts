import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

interface Lead {
  email: string;
  name?: string;
  source: string;
  timestamp: string;
  ip?: string;
}

function readLeads(): Lead[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LEADS_FILE)) {
      fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const raw = fs.readFileSync(LEADS_FILE, "utf-8");
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

function writeLeads(leads: Lead[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

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

    const leads = readLeads();

    // Avoid duplicate emails
    const alreadyExists = leads.some(
      (l) => l.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!alreadyExists) {
      const newLead: Lead = {
        email: email.trim().toLowerCase(),
        name: name?.trim() || undefined,
        source,
        timestamp: new Date().toISOString(),
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      };
      leads.push(newLead);
      writeLeads(leads);
    }

    return NextResponse.json({ success: true, alreadyExists });
  } catch (error) {
    console.error("[Leads API] Error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  // Simple read endpoint (secure this in production with auth)
  try {
    const leads = readLeads();
    return NextResponse.json({ count: leads.length, leads });
  } catch {
    return NextResponse.json({ error: "Could not read leads." }, { status: 500 });
  }
}
