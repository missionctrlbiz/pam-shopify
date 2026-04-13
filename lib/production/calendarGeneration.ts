import { supabaseAdmin } from "@/lib/supabase";
import { generateContentIdea } from "@/lib/production/contentStrategist";
import { Platform, FunnelStage, PostType } from "@/lib/enums";

export type ToneOption =
  | "educational"
  | "professional"
  | "conversational"
  | "inspiring";

export type RatioOption = "1:1" | "4:5" | "9:16";

export type PostTypeSelectionKey =
  | "CAROUSEL"
  | "EMAIL"
  | "CAPTION"
  | "LINKEDIN";

export interface PostTypeSelection {
  enabled: boolean;
  count: number;
  slides?: number;
  ratios?: RatioOption[];
  tone?: ToneOption;
  platform?: string;
}

export interface SelectionTemplate {
  platform: Platform;
  postType: PostType;
  funnelStage: FunnelStage;
  contentGoal: string;
  selectionKey: PostTypeSelectionKey;
  tone?: ToneOption;
  slides?: number;
  ratios?: RatioOption[];
  requestedPlatform?: string;
}

export interface CalendarGenerationInput {
  days: number;
  offset: number;
  overwrite: boolean;
  startDate: string;
  generatedById: string;
  selections?: Partial<Record<PostTypeSelectionKey, PostTypeSelection>>;
}

export interface CalendarGenerationResult {
  generated: number;
  failed: number;
  entries: { dayNumber: number; entryId: string; topic: string }[];
  errors?: string[];
}

const LEGACY_SAFE_TEMPLATE: SelectionTemplate[] = [
  {
    platform: "IG",
    postType: "CAROUSEL",
    funnelStage: "AWARENESS",
    contentGoal: "Educational carousel focused on practical assessment skills.",
    selectionKey: "CAROUSEL",
    tone: "educational",
    slides: 6,
    ratios: ["1:1", "4:5", "9:16"],
  },
  {
    platform: "FB",
    postType: "TEXT_POST",
    funnelStage: "CONSIDERATION",
    contentGoal:
      "Readable social post that explains a practical psychiatric concept clearly.",
    selectionKey: "CAPTION",
    tone: "conversational",
    requestedPlatform: "FB",
  },
  {
    platform: "LINKEDIN",
    postType: "TEXT_POST",
    funnelStage: "CONSIDERATION",
    contentGoal:
      "Professional thought-leadership post grounded in real clinical practice.",
    selectionKey: "LINKEDIN",
    tone: "professional",
    requestedPlatform: "LINKEDIN",
  },
  {
    platform: "EMAIL",
    postType: "EMAIL_LESSON",
    funnelStage: "CONVERSION",
    contentGoal:
      "Structured educational email with a clear lesson and next step.",
    selectionKey: "EMAIL",
    tone: "educational",
  },
  {
    platform: "IG",
    postType: "CAROUSEL",
    funnelStage: "CONSIDERATION",
    contentGoal:
      "Save-worthy carousel that breaks down a common assessment challenge.",
    selectionKey: "CAROUSEL",
    tone: "educational",
    slides: 6,
    ratios: ["1:1", "4:5", "9:16"],
  },
];

function clampCount(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function normalizeTone(tone?: string): ToneOption {
  if (
    tone === "educational" ||
    tone === "professional" ||
    tone === "conversational" ||
    tone === "inspiring"
  ) {
    return tone;
  }
  return "educational";
}

function normalizeRatios(ratios?: string[]): RatioOption[] {
  const allowed: RatioOption[] = ["1:1", "4:5", "9:16"];
  const next = (ratios ?? []).filter((r): r is RatioOption =>
    allowed.includes(r as RatioOption),
  );
  return next.length > 0 ? Array.from(new Set(next)) : ["1:1", "4:5", "9:16"];
}

function buildContentGoal(
  base: string,
  opts?: {
    tone?: ToneOption;
    slides?: number;
    ratios?: RatioOption[];
    requestedPlatform?: string;
  },
) {
  const parts = [base];

  if (opts?.tone) {
    const toneMap: Record<ToneOption, string> = {
      educational: "Use a clear educational tone.",
      professional: "Use a polished professional tone.",
      conversational: "Use a warm conversational tone.",
      inspiring: "Use an encouraging and motivating tone.",
    };
    parts.push(toneMap[opts.tone]);
  }

  if (opts?.slides) {
    parts.push(`Build exactly ${opts.slides} carousel slides.`);
  }

  if (opts?.ratios?.length) {
    parts.push(
      `Prepare content that works cleanly in these layouts: ${opts.ratios.join(", ")}.`,
    );
  }

  if (opts?.requestedPlatform) {
    parts.push(`Primary destination: ${opts.requestedPlatform}.`);
  }

  parts.push("Keep the copy specific, polished, practical, and non-generic.");
  return parts.join(" ");
}

function buildTemplatesFromSelections(
  selections?: Partial<Record<PostTypeSelectionKey, PostTypeSelection>>,
): SelectionTemplate[] {
  const s = selections ?? {};

  const templates: SelectionTemplate[] = [];

  const carousel = s.CAROUSEL;
  if (carousel?.enabled) {
    const count = clampCount(carousel.count, 1, 5, 1);
    const slides = clampCount(carousel.slides, 2, 10, 6);
    const tone = normalizeTone(carousel.tone);
    const ratios = normalizeRatios(carousel.ratios);

    for (let i = 0; i < count; i++) {
      const stageCycle: FunnelStage[] = [
        "AWARENESS",
        "CONSIDERATION",
        "CONVERSION",
        "RETENTION",
        "AWARENESS",
      ];
      const funnelStage = stageCycle[i % stageCycle.length];
      templates.push({
        platform: "IG",
        postType: "CAROUSEL",
        funnelStage,
        selectionKey: "CAROUSEL",
        tone,
        slides,
        ratios,
        contentGoal: buildContentGoal(
          "Create a carousel built from seeded clinical topics with clear, practical teaching value.",
          { tone, slides, ratios, requestedPlatform: "IG" },
        ),
      });
    }
  }

  const email = s.EMAIL;
  if (email?.enabled) {
    const count = clampCount(email.count, 1, 5, 1);
    const tone = normalizeTone(email.tone);

    for (let i = 0; i < count; i++) {
      const stageCycle: FunnelStage[] = [
        "CONSIDERATION",
        "CONVERSION",
        "RETENTION",
        "CONSIDERATION",
        "CONVERSION",
      ];
      templates.push({
        platform: "EMAIL",
        postType: "EMAIL_LESSON",
        funnelStage: stageCycle[i % stageCycle.length],
        selectionKey: "EMAIL",
        tone,
        contentGoal: buildContentGoal(
          "Create a structured email lesson with strong clarity, useful teaching points, and an actionable close.",
          { tone, requestedPlatform: "EMAIL" },
        ),
      });
    }
  }

  const caption = s.CAPTION;
  if (caption?.enabled) {
    const count = clampCount(caption.count, 1, 5, 1);
    const tone = normalizeTone(caption.tone);
    const requestedPlatform = (caption.platform ?? "IG").toUpperCase();
    const platform: Platform =
      requestedPlatform === "FB"
        ? "FB"
        : requestedPlatform === "LINKEDIN"
          ? "LINKEDIN"
          : "IG";

    for (let i = 0; i < count; i++) {
      const stageCycle: FunnelStage[] = [
        "AWARENESS",
        "CONSIDERATION",
        "RETENTION",
        "AWARENESS",
        "CONSIDERATION",
      ];
      templates.push({
        platform,
        postType: "TEXT_POST",
        funnelStage: stageCycle[i % stageCycle.length],
        selectionKey: "CAPTION",
        tone,
        requestedPlatform,
        contentGoal: buildContentGoal(
          "Create a concise social post with clear teaching value and strong readability.",
          { tone, requestedPlatform },
        ),
      });
    }
  }

  const linkedin = s.LINKEDIN;
  if (linkedin?.enabled) {
    const count = clampCount(linkedin.count, 1, 5, 1);
    const tone = normalizeTone(linkedin.tone ?? "professional");

    for (let i = 0; i < count; i++) {
      const stageCycle: FunnelStage[] = [
        "CONSIDERATION",
        "CONVERSION",
        "CONSIDERATION",
        "RETENTION",
        "CONSIDERATION",
      ];
      templates.push({
        platform: "LINKEDIN",
        postType: "TEXT_POST",
        funnelStage: stageCycle[i % stageCycle.length],
        selectionKey: "LINKEDIN",
        tone,
        requestedPlatform: "LINKEDIN",
        contentGoal: buildContentGoal(
          "Create a polished LinkedIn post with authority, clarity, and practical insight.",
          { tone, requestedPlatform: "LINKEDIN" },
        ),
      });
    }
  }

  return templates;
}

export async function runCalendarGenerationBatch(
  input: CalendarGenerationInput,
): Promise<CalendarGenerationResult> {
  const startDate = new Date(input.startDate);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("Invalid startDate");
  }

  const selectionTemplates = buildTemplatesFromSelections(input.selections);
  const usingSelections = selectionTemplates.length > 0;

  const totalRequested = usingSelections
    ? selectionTemplates.length
    : Math.min(Math.max(input.days, 1), 5);

  if (totalRequested < 1) {
    throw new Error("Select at least one post format before generating.");
  }

  if (totalRequested > 5) {
    throw new Error("You can generate a maximum of 5 entries at a time.");
  }

  const days = totalRequested;
  const offset = Math.max(input.offset, 0);

  if (input.overwrite) {
    const { error: deleteError } = await supabaseAdmin
      .from("production_calendar_entries")
      .delete()
      .eq("publish_status", "DRAFT");

    if (deleteError) {
      throw new Error(`Failed to clear drafts: ${deleteError.message}`);
    }
  }

  const { data: clinicalFields, error: clinicalError } = await supabaseAdmin
    .from("clinical_fields")
    .select(
      `
      id,
      fieldKey:field_key,
      displayName:display_name,
      fieldCategory:field_category,
      description,
      clinicalContext:clinical_context,
      exampleValues:example_values
    `,
    )
    .eq("is_active", true)
    .order("field_category", { ascending: true });

  if (clinicalError) {
    throw new Error(`Failed to read clinical fields: ${clinicalError.message}`);
  }

  if (!clinicalFields || clinicalFields.length === 0) {
    throw new Error("No active topic records found. Load topics first.");
  }

  const templates = usingSelections
    ? selectionTemplates
    : LEGACY_SAFE_TEMPLATE.slice(0, days);

  const results: CalendarGenerationResult["entries"] = [];
  const errors: string[] = [];

  // Running tasks sequentially to prevent 503/429 "High Demand" rate limits
  // when bursting multiple requests to the Gemini API simultaneously.
  for (let i = 0; i < days; i++) {
    const absoluteDay = offset + i;
    const template = templates[i % templates.length];
    const field = clinicalFields[absoluteDay % clinicalFields.length];
    const entryDate = new Date(startDate);
    entryDate.setDate(startDate.getDate() + i);

    try {
      const { masterJson, rawPrompt } = await generateContentIdea(
        {
          fieldKey: field.fieldKey,
          displayName: field.displayName,
          fieldCategory: field.fieldCategory,
          description: field.description,
          clinicalContext: field.clinicalContext,
          exampleValues: field.exampleValues,
        },
        {
          platform: template.platform,
          postType: template.postType,
          funnelStage: template.funnelStage,
          contentGoal: template.contentGoal,
          dayNumber: i + 1,
        },
      );

      const enrichedMasterJson = {
        ...masterJson,
        requestedTone: template.tone ?? null,
        requestedPlatform: template.requestedPlatform ?? template.platform,
        requestedCarouselSlides: template.slides ?? null,
        requestedRatios: template.ratios ?? null,
        selectedFormat: template.selectionKey,
      };

      const { data: calEntry, error: entryError } = await supabaseAdmin
        .from("production_calendar_entries")
        .insert({
          day_number: absoluteDay + 1,
          entry_date: entryDate.toISOString(),
          platform: template.platform,
          topic:
            enrichedMasterJson.title ||
            enrichedMasterJson.hook ||
            field.displayName,
          content_goal: template.contentGoal,
          funnel_stage: template.funnelStage,
          post_type: template.postType,
          hook: enrichedMasterJson.hook,
          cta: enrichedMasterJson.cta,
          publish_status: "DRAFT",
        })
        .select("id")
        .single();

      if (entryError || !calEntry) {
        throw new Error(
          entryError?.message ?? "Failed to create calendar entry",
        );
      }

      const { error: ideaError } = await supabaseAdmin
        .from("content_ideas")
        .insert({
          calendar_entry_id: calEntry.id,
          clinical_field_id: field.id,
          master_json: enrichedMasterJson,
          raw_gemini_prompt: rawPrompt,
          quality_gate_status: "PENDING",
          generated_by_id: input.generatedById,
        });

      if (ideaError) {
        throw new Error(ideaError.message);
      }

      results.push({
        dayNumber: absoluteDay + 1,
        entryId: calEntry.id,
        topic:
          enrichedMasterJson.title ||
          enrichedMasterJson.hook ||
          field.displayName,
      });
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      
      // Parse out Google's raw JSON error for a beautiful UI message
      if (message.includes('"error"')) {
        try {
          const parsed = JSON.parse(message);
          if (parsed.error && parsed.error.message) {
            message = parsed.error.message;
            if (message.includes("high demand") || parsed.error.code === 503) {
              message = "Gemini AI is currently overloaded. Waiting a few minutes usually resolves this.";
            }
          }
        } catch {
          // Ignore parse errors, fallback to raw message
        }
      } else if (message.includes("503") || message.toLowerCase().includes("high demand")) {
         message = "Gemini AI is currently overloaded. Waiting a few minutes usually resolves this.";
      }

      errors.push(`Day ${absoluteDay + 1} (${field.fieldKey}): ${message}`);
    }
  }

  return {
    generated: results.length,
    failed: errors.length,
    entries: results,
    errors: errors.length > 0 ? errors : undefined,
  };
}
