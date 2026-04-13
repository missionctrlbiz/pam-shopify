/**
 * POST /api/production/calendar/import
 *
 * Accepts a JSON body: { csv: string }
 * Parses and bulk-inserts production calendar rows.
 *
 * Required CSV columns (case-insensitive, trimmed):
 *   day_number, entry_date, platform, post_type, topic, content_goal
 *
 * Optional CSV columns:
 *   funnel_stage, hook, cta
 *
 * Returns: { imported: number, skipped: number, errors: string[] }
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import type { Platform, PostType, FunnelStage } from "@/lib/enums";

const VALID_PLATFORMS = new Set<Platform>([
  "IG",
  "FB",
  "TIKTOK",
  "LINKEDIN",
  "EMAIL",
]);

const VALID_POST_TYPES = new Set<PostType>([
  "CAROUSEL",
  "TEXT_POST",
  "STORY",
  "EMAIL_LESSON",
]);

const VALID_FUNNEL_STAGES = new Set<FunnelStage>([
  "AWARENESS",
  "CONSIDERATION",
  "CONVERSION",
  "RETENTION",
]);

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"(.*)"$/, "$1").trim());
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());

  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const row: Record<string, string> = {};

    header.forEach((h, i) => {
      row[h] = vals[i] ?? "";
    });

    return row;
  });
}

function normalizePlatform(value: string): Platform {
  return value.trim().toUpperCase() as Platform;
}

function normalizePostType(value: string): PostType {
  return value.trim().toUpperCase().replace(/\s+/g, "_") as PostType;
}

function normalizeFunnelStage(value: string): FunnelStage {
  return value.trim().toUpperCase() as FunnelStage;
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let csv: string;
  try {
    const body = (await req.json()) as { csv?: unknown };
    csv = body.csv as string;
    if (!csv || typeof csv !== "string") {
      throw new Error("csv field missing");
    }
  } catch {
    return NextResponse.json(
      { error: "Body must be JSON with { csv: string }" },
      { status: 400 },
    );
  }

  const rows = parseCSV(csv);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found in CSV" },
      { status: 400 },
    );
  }

  const results = await Promise.allSettled(
    rows.map(async (row, i) => {
      const rowLabel = `Row ${i + 2}`;

      const dayNumber = parseInt(row["day_number"] ?? "", 10);
      const entryDateRaw = row["entry_date"] ?? "";
      const platform = normalizePlatform(row["platform"] ?? "");
      const postType = normalizePostType(row["post_type"] ?? "");
      const topic = (row["topic"] ?? "").trim();
      const contentGoal = (row["content_goal"] ?? "").trim();

      if (Number.isNaN(dayNumber) || dayNumber < 1) {
        throw new Error(
          `${rowLabel}: invalid day_number "${row["day_number"] ?? ""}"`,
        );
      }

      const entryDate = new Date(entryDateRaw);
      if (Number.isNaN(entryDate.getTime())) {
        throw new Error(
          `${rowLabel}: invalid entry_date "${entryDateRaw}" (use YYYY-MM-DD)`,
        );
      }

      if (!VALID_PLATFORMS.has(platform)) {
        throw new Error(`${rowLabel}: invalid platform "${platform}"`);
      }

      if (!VALID_POST_TYPES.has(postType)) {
        throw new Error(
          `${rowLabel}: invalid post_type "${row["post_type"] ?? ""}"`,
        );
      }

      if (!topic) {
        throw new Error(`${rowLabel}: topic is empty`);
      }

      const funnelStageRaw = normalizeFunnelStage(row["funnel_stage"] ?? "");
      const funnelStage: FunnelStage = VALID_FUNNEL_STAGES.has(funnelStageRaw)
        ? funnelStageRaw
        : "AWARENESS";

      const hook = (row["hook"] ?? "").trim();
      const cta = (row["cta"] ?? "").trim();

      const { error } = await supabaseAdmin
        .from("production_calendar_entries")
        .insert({
          day_number: dayNumber,
          entry_date: entryDate.toISOString(),
          platform,
          post_type: postType,
          topic,
          content_goal: contentGoal || topic,
          funnel_stage: funnelStage,
          hook: hook || null,
          cta: cta || null,
          publish_status: "DRAFT",
        });

      if (error) {
        throw new Error(`${rowLabel}: ${error.message}`);
      }
    }),
  );

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      imported++;
      return;
    }

    skipped++;
    const message =
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
    errors.push(message);
  });

  return NextResponse.json({
    imported,
    skipped,
    errors: errors.slice(0, 20),
  });
}
