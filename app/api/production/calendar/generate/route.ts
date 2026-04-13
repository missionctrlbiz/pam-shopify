/**
 * POST /api/production/calendar/generate
 *
 * Generates a batch of ProductionCalendarEntry + ContentIdea rows by:
 *   1. Reading active topic rows from Supabase
 *   2. Building a generation plan from the requested selections
 *   3. Calling the content strategist for each requested entry
 *   4. Persisting entries with status DRAFT
 *
 * Body params:
 *   startDate   — ISO date string for Day 1 (default: tomorrow)
 *   days        — optional legacy count (capped to 5)
 *   offset      — optional day offset
 *   overwrite   — if true, delete existing DRAFT entries before generating
 *   selections  — optional selection map from the generation modal
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runCalendarGenerationBatch } from "@/lib/production/calendarGeneration";

// Keep route bounded; generation is now intentionally inline for small batches.
export const maxDuration = 300;

type ToneOption =
  | "educational"
  | "professional"
  | "conversational"
  | "inspiring";

type RatioOption = "1:1" | "4:5" | "9:16";

type PostTypeSelectionKey = "CAROUSEL" | "EMAIL" | "CAPTION" | "LINKEDIN";

interface PostTypeSelection {
  enabled: boolean;
  count: number;
  slides?: number;
  ratios?: RatioOption[];
  tone?: ToneOption;
  platform?: string;
}

type SelectionMap = Partial<Record<PostTypeSelectionKey, PostTypeSelection>>;

function sanitizeSelections(raw: unknown): SelectionMap | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const input = raw as Record<string, unknown>;
  const out: SelectionMap = {};

  const allowedKeys: PostTypeSelectionKey[] = [
    "CAROUSEL",
    "EMAIL",
    "CAPTION",
    "LINKEDIN",
  ];

  for (const key of allowedKeys) {
    const value = input[key];
    if (!value || typeof value !== "object") continue;

    const row = value as Record<string, unknown>;

    const enabled = Boolean(row.enabled);
    const count = Math.min(
      5,
      Math.max(1, Number.isFinite(Number(row.count)) ? Number(row.count) : 1),
    );

    const slidesRaw = Number(row.slides);
    const slides =
      key === "CAROUSEL" && Number.isFinite(slidesRaw)
        ? Math.min(10, Math.max(2, Math.floor(slidesRaw)))
        : undefined;

    const tone =
      row.tone === "educational" ||
      row.tone === "professional" ||
      row.tone === "conversational" ||
      row.tone === "inspiring"
        ? row.tone
        : undefined;

    const ratios = Array.isArray(row.ratios)
      ? row.ratios.filter(
          (ratio): ratio is RatioOption =>
            ratio === "1:1" || ratio === "4:5" || ratio === "9:16",
        )
      : undefined;

    const platform =
      typeof row.platform === "string" && row.platform.trim()
        ? row.platform.trim().toUpperCase()
        : undefined;

    out[key] = {
      enabled,
      count,
      slides,
      tone,
      ratios,
      platform,
    };
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function countRequestedEntries(selections?: SelectionMap): number {
  if (!selections) return 0;

  return Object.values(selections)
    .filter((selection): selection is PostTypeSelection =>
      Boolean(selection?.enabled),
    )
    .reduce(
      (sum, selection) => sum + Math.max(1, Math.min(5, selection.count)),
      0,
    );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}) as Record<string, unknown>);

    const selections = sanitizeSelections(body.selections);
    const requestedViaSelections = countRequestedEntries(selections);

    const days = selections
      ? requestedViaSelections
      : Math.min(Math.max(Number(body.days ?? 1), 1), 5);

    if (days < 1) {
      return NextResponse.json(
        { error: "Select at least one post format before generating." },
        { status: 400 },
      );
    }

    if (days > 5) {
      return NextResponse.json(
        { error: "You can generate a maximum of 5 entries at a time." },
        { status: 400 },
      );
    }

    const offset = Math.max(Number(body.offset ?? 0), 0);
    const overwrite = Boolean(body.overwrite ?? false);
    const startDate = body.startDate
      ? new Date(String(body.startDate))
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(9, 0, 0, 0);
          return d;
        })();

    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
    }

    const generatedById = (session.user as { id?: string })?.id;
    if (!generatedById) {
      return NextResponse.json(
        { error: "Session user ID missing" },
        { status: 400 },
      );
    }

    // Intentionally run inline so the user gets a deterministic completion result
    // and never sees a background handoff for these small batches.
    const result = await runCalendarGenerationBatch({
      days,
      offset,
      overwrite,
      startDate: startDate.toISOString(),
      generatedById,
      selections,
    });

    return NextResponse.json(result, {
      status: result.failed > 0 && result.generated === 0 ? 500 : 207,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[calendar/generate] Unexpected error:", err);

    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: "Internal server error", ...(isDev && { detail: errMsg }) },
      { status: 500 },
    );
  }
}
