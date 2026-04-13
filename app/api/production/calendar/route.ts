/**
 * GET /api/production/calendar
 *
 * Returns ProductionCalendarEntry rows ordered by entry date, with optional
 * filtering and explicit sort controls.
 *
 * Query params:
 *   status   — filter by PublishStatus (optional)
 *   platform — filter by Platform enum value (optional)
 *   page     — 1-based page number (default: 1)
 *   limit    — rows per page (default: 10, max: 500)
 *   sort     — one of:
 *              latest        (default)
 *              oldest
 *              day_desc
 *              day_asc
 *              status_asc
 *              status_desc
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { PublishStatus, Platform } from "@/lib/enums";

type SortOption =
  | "latest"
  | "oldest"
  | "day_desc"
  | "day_asc"
  | "status_asc"
  | "status_desc";

const VALID_STATUSES: PublishStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "GENERATING",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

const VALID_PLATFORMS: Platform[] = [
  "IG",
  "FB",
  "TIKTOK",
  "LINKEDIN",
  "EMAIL",
  "VIDEO",
];

const VALID_SORTS: SortOption[] = [
  "latest",
  "oldest",
  "day_desc",
  "day_asc",
  "status_asc",
  "status_desc",
];

const STATUS_SORT_ORDER: PublishStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "GENERATING",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

function normalizeSort(value: string | null): SortOption {
  if (value && VALID_SORTS.includes(value as SortOption)) {
    return value as SortOption;
  }
  return "latest";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get("status") as PublishStatus | null;
    const platformParam = searchParams.get("platform") as Platform | null;
    const sort = normalizeSort(searchParams.get("sort"));
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      500,
      Math.max(1, Number(searchParams.get("limit") ?? 10)),
    );
    const skip = (page - 1) * limit;

    const statusFilter =
      statusParam && VALID_STATUSES.includes(statusParam)
        ? statusParam
        : undefined;

    const platformFilter =
      platformParam && VALID_PLATFORMS.includes(platformParam)
        ? platformParam
        : undefined;

    const selectClause = `
      id,
      dayNumber:day_number,
      entryDate:entry_date,
      platform,
      postType:post_type,
      publishStatus:publish_status,
      topic,
      contentGoal:content_goal,
      contentIdea:content_ideas(
        id,
        masterJson:master_json,
        qualityGateStatus:quality_gate_status,
        qualityGateResult:quality_gate_results(*),
        clinicalField:clinical_fields(
          fieldKey:field_key,
          displayName:display_name,
          fieldCategory:field_category
        )
      )
    `;

    let query = supabaseAdmin
      .from("production_calendar_entries")
      .select(selectClause, { count: "exact" });

    if (statusFilter) {
      query = query.eq("publish_status", statusFilter);
    }

    if (platformFilter) {
      query = query.eq("platform", platformFilter);
    }

    switch (sort) {
      case "oldest":
        query = query
          .order("entry_date", { ascending: true })
          .order("day_number", { ascending: true });
        break;

      case "day_desc":
        query = query
          .order("day_number", { ascending: false })
          .order("entry_date", { ascending: false });
        break;

      case "day_asc":
        query = query
          .order("day_number", { ascending: true })
          .order("entry_date", { ascending: true });
        break;

      case "status_asc":
      case "status_desc":
        // We still fetch deterministically from DB, then apply the custom
        // publish-status ranking below because the desired status order is
        // semantic, not alphabetical.
        query = query
          .order("entry_date", { ascending: false })
          .order("day_number", { ascending: false });
        break;

      case "latest":
      default:
        query = query
          .order("entry_date", { ascending: false })
          .order("day_number", { ascending: false });
        break;
    }

    query = query.range(skip, skip + limit - 1);

    const { data: entries, error, count } = await query;

    if (error) {
      console.error("[calendar] Supabase fetch error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const normalizedEntries = (entries ?? []).map((entry) => {
      const rawIdea = Array.isArray(entry.contentIdea)
        ? entry.contentIdea[0]
        : entry.contentIdea;

      const rawMasterJson = rawIdea?.masterJson as
        | Record<string, unknown>
        | null
        | undefined;

      const rawQualityGateResult = Array.isArray(rawIdea?.qualityGateResult)
        ? rawIdea.qualityGateResult[0]
        : rawIdea?.qualityGateResult;

      const rawClinicalField = Array.isArray(rawIdea?.clinicalField)
        ? rawIdea.clinicalField[0]
        : rawIdea?.clinicalField;

      return {
        ...entry,
        contentIdea: rawIdea
          ? {
              id: rawIdea.id,
              hook:
                typeof rawMasterJson?.hook === "string"
                  ? rawMasterJson.hook
                  : null,
              qualityGateStatus: rawIdea.qualityGateStatus,
              qualityGateResult: rawQualityGateResult ?? null,
              clinicalField: rawClinicalField ?? null,
            }
          : null,
      };
    });

    const sortedEntries =
      sort === "status_asc" || sort === "status_desc"
        ? [...normalizedEntries].sort((a, b) => {
            const aIndex = STATUS_SORT_ORDER.indexOf(
              a.publishStatus as PublishStatus,
            );
            const bIndex = STATUS_SORT_ORDER.indexOf(
              b.publishStatus as PublishStatus,
            );

            const direction = sort === "status_desc" ? -1 : 1;
            if (aIndex !== bIndex) {
              return (aIndex - bIndex) * direction;
            }

            const aDate = new Date(a.entryDate).getTime();
            const bDate = new Date(b.entryDate).getTime();
            return bDate - aDate;
          })
        : normalizedEntries;

    return NextResponse.json({
      entries: sortedEntries,
      pagination: {
        total: count ?? 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
      sort,
    });
  } catch (err) {
    console.error("[calendar] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
