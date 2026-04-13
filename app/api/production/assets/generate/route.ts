/**
 * POST /api/production/assets/generate
 *
 * Generates only the assets explicitly requested for a single approved entry.
 * Video generation is intentionally disabled in this workflow.
 *
 * Supported behavior:
 *   - CAROUSEL entries → carousel render only
 *   - TEXT_POST / STORY entries → single text asset for the entry platform
 *   - EMAIL_LESSON entries → single email asset
 *
 * Optional body params:
 *   contentIdeaId — required
 *   scope         — optional, one of:
 *                   "PRIMARY" (default)
 *                   "CAROUSEL"
 *                   "TEXT"
 *                   "EMAIL"
 *
 * Notes:
 *   - No automatic repurposing across every platform.
 *   - No video / reel generation.
 *   - Background execution still uses Trigger.dev when configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { AssetType, Platform, RenderJobType } from "@/lib/enums";
import {
  runRepurposeInline,
  runCarouselInline,
  type RepurposeInlineInput,
} from "@/lib/production/repurposeInline";
import type {
  productionCarouselTask,
  productionRepurposeTask,
} from "@/trigger/production";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type GenerationScope = "PRIMARY" | "CAROUSEL" | "TEXT" | "EMAIL" | "ALL";

function normalizeScope(value: unknown): GenerationScope {
  const v = String(value || "").toUpperCase();
  if (
    v === "CAROUSEL" ||
    v === "TEXT" ||
    v === "EMAIL" ||
    v === "ALL" ||
    v === "PRIMARY"
  ) {
    return v as GenerationScope;
  }
  return "PRIMARY";
}

function buildFileName(
  platform: string,
  entryDateIso: string,
  topic: string,
  assetType: AssetType,
  version: number,
): string {
  const date = new Date(entryDateIso)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const topicSlug = topic
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  const extMap: Record<AssetType, string> = {
    CAROUSEL_PNG: "png",
    VIDEO_MP4: "mp4",
    TEXT_POST: "txt",
    EMAIL_HTML: "html",
    AUDIO_MP3: "mp3",
    VIDEO_SCRIPT_JSON: "json",
  };

  return `PAM_${platform}_${date}_${topicSlug || "Content"}_v${version}.${extMap[assetType]}`;
}

function getPrimaryRepurposeTarget(
  postType: string,
  platform: Platform,
): { assetType: AssetType; platform: Platform } | null {
  if (postType === "EMAIL_LESSON") {
    return { assetType: "EMAIL_HTML", platform: "EMAIL" };
  }

  if (postType === "TEXT_POST") {
    return { assetType: "TEXT_POST", platform };
  }

  return null;
}

function determineRequestedWork(
  postType: string,
  platform: Platform,
  scope: GenerationScope,
): {
  wantsCarousel: boolean;
  repurposeTarget: { assetType: AssetType; platform: Platform } | null;
} {
  const primaryRepurposeTarget = getPrimaryRepurposeTarget(postType, platform);

  switch (scope) {
    case "CAROUSEL":
      return {
        wantsCarousel: postType === "CAROUSEL",
        repurposeTarget: null,
      };

    case "TEXT":
      return {
        wantsCarousel: false,
        repurposeTarget:
          postType === "TEXT_POST"
            ? primaryRepurposeTarget
            : null,
      };

    case "EMAIL":
      return {
        wantsCarousel: false,
        repurposeTarget:
          postType === "EMAIL_LESSON" ? primaryRepurposeTarget : null,
      };

    case "ALL":
      return {
        wantsCarousel: true,
        repurposeTarget: primaryRepurposeTarget,
      };

    case "PRIMARY":
    default:
      return {
        wantsCarousel: postType === "CAROUSEL",
        repurposeTarget: primaryRepurposeTarget,
      };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      contentIdeaId?: string;
      scope?: GenerationScope;
    };

    const contentIdeaId = body.contentIdeaId;
    const scope = normalizeScope(body.scope);

    if (!contentIdeaId || typeof contentIdeaId !== "string") {
      return NextResponse.json(
        { error: "contentIdeaId is required" },
        { status: 400 },
      );
    }

    const { data: idea, error: ideaError } = await supabaseAdmin
      .from("content_ideas")
      .select(
        `
        id,
        masterJson:master_json,
        calendarEntry:production_calendar_entries(
          id,
          entryDate:entry_date,
          publishStatus:publish_status,
          platform,
          postType:post_type,
          topic
        )
      `,
      )
      .eq("id", contentIdeaId)
      .maybeSingle();

    if (ideaError) {
      console.error(
        "[assets/generate] Failed to fetch content idea:",
        ideaError,
      );
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    if (!idea) {
      return NextResponse.json(
        { error: `ContentIdea not found: ${contentIdeaId}` },
        { status: 404 },
      );
    }

    const entry = (
      Array.isArray(idea.calendarEntry)
        ? idea.calendarEntry[0]
        : idea.calendarEntry
    ) as {
      id: string;
      entryDate: string;
      publishStatus: string;
      platform: Platform;
      postType: string;
      topic: string;
    } | null;

    if (!entry) {
      return NextResponse.json(
        { error: `ContentIdea ${contentIdeaId} has no linked calendar entry` },
        { status: 422 },
      );
    }

    if (!["APPROVED", "GENERATING"].includes(entry.publishStatus)) {
      return NextResponse.json(
        {
          error: `Entry must be APPROVED or GENERATING before generating assets. Current: ${entry.publishStatus}`,
        },
        { status: 409 },
      );
    }

    if (entry.postType === "VIDEO" || entry.postType === "REEL" || entry.postType === "STORY") {
      return NextResponse.json(
        {
          error:
            "Video generation is disabled in this workflow. Create visual assets manually instead.",
        },
        { status: 409 },
      );
    }

    const master = idea.masterJson as Record<string, unknown>;
    const entryDateIso = new Date(entry.entryDate).toISOString();
    const triggerConfigured = Boolean(process.env.TRIGGER_SECRET_KEY);

    const jobs: Array<{
      jobType: RenderJobType;
      taskId: string;
      renderJobId: string;
    }> = [];
    const errors: string[] = [];

    const { data: existingAssets } = await supabaseAdmin
      .from("content_assets")
      .select("asset_type, platform, status")
      .eq("content_idea_id", contentIdeaId)
      .eq("status", "COMPLETE");

    const completedAssetPairs = new Set(
      (existingAssets ?? []).map(
        (asset) => `${asset.asset_type}:${asset.platform ?? ""}`,
      ),
    );

    const { wantsCarousel, repurposeTarget } = determineRequestedWork(
      entry.postType,
      entry.platform,
      scope,
    );

    const needsCarousel =
      wantsCarousel &&
      !completedAssetPairs.has(`CAROUSEL_PNG:${entry.platform}`);

    const needsRepurpose =
      !!repurposeTarget &&
      !completedAssetPairs.has(
        `${repurposeTarget.assetType}:${repurposeTarget.platform}`,
      );

    if (!needsCarousel && !needsRepurpose) {
      return NextResponse.json(
        {
          message:
            "The requested asset format is already complete. Nothing new was generated.",
        },
        { status: 200 },
      );
    }

    const dispatch = async (
      jobType: RenderJobType,
      assetTypes: Array<{ assetType: AssetType; platform: Platform }>,
    ): Promise<string> => {
      const payload = {
        contentIdeaId,
        masterJson: master,
        platform: entry.platform,
        postType: entry.postType,
        topic: entry.topic,
        entryDate: entryDateIso,
      };

      const { data: renderJob, error: renderJobError } = await supabaseAdmin
        .from("render_jobs")
        .insert({
          content_idea_id: contentIdeaId,
          job_type: jobType,
          status: "QUEUED",
          input_payload: payload as object,
        })
        .select("id")
        .single();

      if (renderJobError || !renderJob) {
        throw new Error(
          `Failed to create ${jobType} job: ${renderJobError?.message ?? "unknown error"}`,
        );
      }

      const placeholders = assetTypes.map(({ assetType, platform }) => ({
        content_idea_id: contentIdeaId,
        platform,
        asset_type: assetType,
        render_job_id: renderJob.id,
        file_name: buildFileName(
          platform,
          entryDateIso,
          entry.topic,
          assetType,
          1,
        ),
        status: "PENDING" as const,
      }));

      if (placeholders.length > 0) {
        const { error: assetInsertError } = await supabaseAdmin
          .from("content_assets")
          .insert(placeholders);

        if (assetInsertError) {
          await supabaseAdmin
            .from("render_jobs")
            .delete()
            .eq("id", renderJob.id);
          throw new Error(
            `Failed to create asset placeholders for ${jobType}: ${assetInsertError.message}`,
          );
        }
      }

      if (!triggerConfigured) {
        jobs.push({ jobType, taskId: "inline", renderJobId: renderJob.id });
        return renderJob.id;
      }

      try {
        const taskPayload: RepurposeInlineInput = {
          renderJobId: renderJob.id,
          contentIdeaId,
          calendarEntryId: entry.id,
          masterJson: master,
          platform: entry.platform,
          postType: entry.postType,
          topic: entry.topic,
          entryDate: entryDateIso,
        };

        let handle: { id: string };
        if (jobType === "CAROUSEL") {
          handle = await tasks.trigger<typeof productionCarouselTask>(
            "production-carousel",
            taskPayload,
          );
        } else {
          handle = await tasks.trigger<typeof productionRepurposeTask>(
            "production-repurpose",
            taskPayload,
          );
        }

        jobs.push({ jobType, taskId: handle.id, renderJobId: renderJob.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to trigger ${jobType}: ${message}`);
        await supabaseAdmin
          .from("render_jobs")
          .update({ status: "FAILED", error_message: message })
          .eq("id", renderJob.id);
      }

      return renderJob.id;
    };

    if (needsCarousel) {
      const carouselJobId = await dispatch("CAROUSEL", [
        { assetType: "CAROUSEL_PNG", platform: entry.platform },
      ]);

      if (!triggerConfigured) {
        try {
          await runCarouselInline({
            renderJobId: carouselJobId,
            contentIdeaId,
            calendarEntryId: entry.id,
            masterJson: master,
            platform: entry.platform,
            postType: entry.postType,
            topic: entry.topic,
            entryDate: entryDateIso,
          });

          const job = jobs.find((item) => item.renderJobId === carouselJobId);
          if (job) job.taskId = "inline-complete";
        } catch (e) {
          errors.push(`Inline carousel failed: ${(e as Error).message}`);
        }
      }
    }

    if (needsRepurpose && repurposeTarget) {
      const repurposeJobId = await dispatch("REPURPOSE", [repurposeTarget]);

      if (!triggerConfigured) {
        try {
          await runRepurposeInline({
            renderJobId: repurposeJobId,
            contentIdeaId,
            calendarEntryId: entry.id,
            masterJson: master,
            platform: entry.platform,
            postType: entry.postType,
            topic: entry.topic,
            entryDate: entryDateIso,
          });

          const job = jobs.find((item) => item.renderJobId === repurposeJobId);
          if (job) job.taskId = "inline-complete";
        } catch (e) {
          errors.push(`Inline content build failed: ${(e as Error).message}`);
        }
      }
    }

    const hasAsyncJobs = jobs.some((job) => job.taskId !== "inline-complete");
    if (jobs.length > 0 && hasAsyncJobs) {
      const { error: statusError } = await supabaseAdmin
        .from("production_calendar_entries")
        .update({ publish_status: "GENERATING" })
        .eq("id", entry.id);

      if (statusError) {
        console.error(
          "[assets/generate] Failed to move entry to GENERATING:",
          statusError,
        );
      }
    }

    return NextResponse.json(
      {
        queued: jobs.length,
        jobs,
        errors: errors.length > 0 ? errors : undefined,
        scope,
      },
      { status: 202 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[assets/generate] Unhandled error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
