/**
 * GET /api/production/assets/[id]
 *
 * Returns a normalized asset detail payload for the admin carousel page view.
 * The response shape is intentionally camelCased and unwraps nested Supabase
 * relation arrays so client pages can consume it directly without extra guards.
 *
 * Protected: admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type RawAssetRow = {
  id: string;
  asset_type: string | null;
  storage_url: string | null;
  file_name: string | null;
  storage_path?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
  platform?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  contentIdea?: unknown;
  renderJob?: unknown;
};

function firstOrValue<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeAsset(raw: RawAssetRow) {
  const rawContentIdea = firstOrValue(
    raw.contentIdea as
      | {
          id?: string;
          qualityGateStatus?: string | null;
          calendarEntry?: unknown;
        }
      | Array<{
          id?: string;
          qualityGateStatus?: string | null;
          calendarEntry?: unknown;
        }>
      | null
      | undefined,
  );

  const rawCalendarEntry = firstOrValue(
    rawContentIdea?.calendarEntry as
      | {
          id?: string;
          dayNumber?: number | null;
          entryDate?: string | null;
          platform?: string | null;
          topic?: string | null;
          publishStatus?: string | null;
        }
      | Array<{
          id?: string;
          dayNumber?: number | null;
          entryDate?: string | null;
          platform?: string | null;
          topic?: string | null;
          publishStatus?: string | null;
        }>
      | null
      | undefined,
  );

  const rawRenderJob = firstOrValue(
    raw.renderJob as
      | {
          id?: string;
          jobType?: string | null;
          status?: string | null;
          queuedAt?: string | null;
          startedAt?: string | null;
          completedAt?: string | null;
          errorMessage?: string | null;
          retryCount?: number | null;
        }
      | Array<{
          id?: string;
          jobType?: string | null;
          status?: string | null;
          queuedAt?: string | null;
          startedAt?: string | null;
          completedAt?: string | null;
          errorMessage?: string | null;
          retryCount?: number | null;
        }>
      | null
      | undefined,
  );

  return {
    id: raw.id,
    assetType: raw.asset_type ?? "",
    storageUrl: raw.storage_url ?? "",
    fileName: raw.file_name ?? null,
    storagePath: raw.storage_path ?? null,
    metadata: raw.metadata ?? null,
    status: raw.status ?? null,
    platform: raw.platform ?? null,
    createdAt: raw.created_at ?? null,
    updatedAt: raw.updated_at ?? null,
    contentIdea: rawContentIdea
      ? {
          id: rawContentIdea.id ?? "",
          qualityGateStatus: rawContentIdea.qualityGateStatus ?? null,
          calendarEntry: rawCalendarEntry
            ? {
                id: rawCalendarEntry.id ?? "",
                dayNumber: rawCalendarEntry.dayNumber ?? null,
                entryDate: rawCalendarEntry.entryDate ?? null,
                platform: rawCalendarEntry.platform ?? null,
                topic: rawCalendarEntry.topic ?? null,
                publishStatus: rawCalendarEntry.publishStatus ?? null,
              }
            : null,
        }
      : null,
    renderJob: rawRenderJob
      ? {
          id: rawRenderJob.id ?? "",
          jobType: rawRenderJob.jobType ?? null,
          status: rawRenderJob.status ?? null,
          queuedAt: rawRenderJob.queuedAt ?? null,
          startedAt: rawRenderJob.startedAt ?? null,
          completedAt: rawRenderJob.completedAt ?? null,
          errorMessage: rawRenderJob.errorMessage ?? null,
          retryCount: rawRenderJob.retryCount ?? null,
        }
      : null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("content_assets")
    .select(
      `
        id,
        asset_type,
        storage_url,
        file_name,
        storage_path,
        metadata,
        status,
        platform,
        created_at,
        updated_at,
        contentIdea:content_ideas(
          id,
          qualityGateStatus:quality_gate_status,
          calendarEntry:production_calendar_entries(
            id,
            dayNumber:day_number,
            entryDate:entry_date,
            platform,
            topic,
            publishStatus:publish_status
          )
        ),
        renderJob:render_jobs(
          id,
          jobType:job_type,
          status,
          queuedAt:queued_at,
          startedAt:started_at,
          completedAt:completed_at,
          errorMessage:error_message,
          retryCount:retry_count
        )
      `,
    )
    .eq("id", id)
    .maybeSingle<RawAssetRow>();

  if (error) {
    console.error("[assets/:id] Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: `ContentAsset not found: ${id}` },
      { status: 404 },
    );
  }

  return NextResponse.json({ asset: normalizeAsset(data) });
}
