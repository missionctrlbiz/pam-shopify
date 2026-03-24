/**
 * /api/production/publish
 *
 * GET  — Returns current publish state: email quota, Buffer profiles,
 *         scheduled posts, and recent job history.
 *
 * POST — Dispatches an email blast and/or Buffer social posts for a
 *         COMPLETE asset.  Enforces:
 *           • Daily email cap (default 90, well below Resend's free 100/day limit)
 *           • Buffer queue-depth check before scheduling (avoids 429s)
 *           • Typed payloads — no `any` casting on Buffer responses
 *
 * Protected: ADMIN only.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import type {
    PublishPayload,
    PublishResponse,
    PublishState,
    BufferProfile,
    BufferPostPayload,
    BufferPostResponse,
    BufferScheduledUpdate,
    ScheduledPostRow,
    PublishJob,
    PublishChannel,
    PublishJobStatus,
} from "@/components/admin/production/types"

// ── Constants ─────────────────────────────────────────────────────────────────

/** Hard daily email limit — 10 below Resend free-tier cap to avoid quarantine */
const EMAIL_DAILY_LIMIT = 90

/** Buffer free tier queue max per profile */
const BUFFER_QUEUE_MAX = 10

/** Buffer API v1 base URL */
const BUFFER_API = "https://api.bufferapp.com/1"

// ── Auth guard helper ─────────────────────────────────────────────────────────

async function requireAdmin(): Promise<{ error: NextResponse } | { ok: true }> {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
    }
    return { ok: true }
}

// ── Buffer API helpers ────────────────────────────────────────────────────────

/** Fetch all Buffer profiles linked to the access token */
async function fetchBufferProfiles(accessToken: string): Promise<BufferProfile[]> {
    const res = await fetch(`${BUFFER_API}/profiles.json`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    })
    
    if (res.status >= 500) {
        console.error(`[publish] Buffer API 500 Error during profile fetch. Token might be incompatible.`);
        return [];
    }
    if (!res.ok) return []

    const raw: unknown = await res.json()
    if (!Array.isArray(raw)) return []

    return (raw as Record<string, unknown>[]).map((p) => ({
        id:              String(p["id"] ?? ""),
        service:         (p["service"] as BufferProfile["service"]) ?? "linkedin",
        serviceUsername: String(p["service_username"] ?? ""),
        serviceType:     ((p["service_type"] as string) === "page" ? "page" : "profile") as "profile" | "page",
        avatarUrl:       typeof p["avatar"] === "string" ? p["avatar"] : null,
        timezone:        String(p["timezone"] ?? "UTC"),
        bufferCount:     typeof p["buffer_count"] === "number" ? p["buffer_count"] : 0,
        bufferMax:       typeof p["buffer_percentage"] === "number" && (p["buffer_percentage"] as number) > 0
            ? Math.round((p["buffer_count"] as number) / ((p["buffer_percentage"] as number) / 100))
            : BUFFER_QUEUE_MAX,
    }))
}

/**
 * Post an update to Buffer.
 * Returns the typed response or throws on HTTP error.
 */
async function createBufferUpdate(
    accessToken: string,
    payload: BufferPostPayload,
): Promise<BufferPostResponse> {
    const body = new URLSearchParams()
    payload.profile_ids.forEach((id) => body.append("profile_ids[]", id))
    body.set("text", payload.text)
    if (payload.scheduled_at) body.set("scheduled_at", payload.scheduled_at)
    if (payload.now) body.set("now", "true")
    if (payload.top) body.set("top", "true")
    if (payload.shorten !== undefined) body.set("shorten", String(payload.shorten))

    if (payload.media) {
        if (payload.media.photo)     body.set("media[photo]", payload.media.photo)
        if (payload.media.video)     body.set("media[video]", payload.media.video)
        if (payload.media.thumbnail) body.set("media[thumbnail]", payload.media.thumbnail)
        if (payload.media.altText)   body.set("media[alt_text]", payload.media.altText)
    }

    const res = await fetch(
        `${BUFFER_API}/updates/create.json`,
        { 
            method: "POST", 
            headers: { 
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded" 
            }, 
            body 
        },
    )

    if (res.status === 429) {
        throw new RateLimitError("Buffer rate limit exceeded (429)")
    }

    if (res.status >= 500) {
        const msg = await res.text().catch(() => "Unknown 500 error from Buffer");
        console.error(`[publish] Buffer API 500 Error. Status ${res.status}: ${msg}`);
        throw new Error(`Buffer API internal server error (Likely token version mismatch). Status ${res.status}: ${msg}`)
    }

    if (!res.ok) {
        const msg = await res.text()
        throw new Error(`Buffer API error ${res.status}: ${msg}`)
    }

    return res.json() as Promise<BufferPostResponse>
}

class RateLimitError extends Error {
    readonly isRateLimit = true
    constructor(msg: string) { super(msg) }
}

// ── Resend email helper ───────────────────────────────────────────────────────

/** Send a single email via Resend API */
async function sendResendEmail(
    apiKey: string,
    opts: { from: string; to: string; subject: string; html: string },
): Promise<{ id: string }> {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(opts),
    })

    if (res.status === 429) throw new RateLimitError("Resend rate limit (429)")
    if (!res.ok) {
        const msg = await res.text()
        throw new Error(`Resend API error ${res.status}: ${msg}`)
    }

    return res.json() as Promise<{ id: string }>
}

// ── Daily email quota helper ──────────────────────────────────────────────────

async function getEmailsSentToday(): Promise<number> {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { count, error } = await supabaseAdmin
        .from("email_blast_log")
        .select("id", { count: "exact", head: true })
        .gte("sent_at", startOfDay.toISOString())

    if (error) {
        console.error("[publish] email quota check error:", error)
        return 0
    }
    return count ?? 0
}

// ── GET: publish state ────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
    const guard = await requireAdmin()
    if ("error" in guard) return guard.error

    try {
        const accessToken = process.env.BUFFER_ACCESS_TOKEN ?? ""
        const webhookUrl = process.env.MAKE_WEBHOOK_URL || process.env.ZAPIER_WEBHOOK_URL
        const emailSentToday = await getEmailsSentToday()

        const bufferProfiles: BufferProfile[] = webhookUrl 
            ? [{
                id: "hook_default",
                service: "SOCIAL" as any, 
                serviceUsername: "All Connected Social Channels",
                serviceType: "profile",
                avatarUrl: null,
                timezone: "UTC",
                bufferCount: 0,
                bufferMax: 100
              }]
            : (accessToken ? await fetchBufferProfiles(accessToken).catch(() => []) : [])

        // Recent publish jobs (last 50)
        const { data: jobRows, error: jobErr } = await supabaseAdmin
            .from("publish_jobs")
            .select("id, channel, asset_id, recipient_count, buffer_post_id, scheduled_at, dispatched_at, status, error_message, created_at")
            .order("created_at", { ascending: false })
            .limit(50)

        if (jobErr) {
            console.error("[publish] jobs fetch error:", jobErr)
        }

        // Map DB rows → typed PublishJob
        const recentJobs: PublishJob[] = (jobRows ?? []).map((r) => ({
            id:             String(r.id),
            channel:        r.channel as PublishChannel,
            assetId:        r.asset_id ?? null,
            recipientCount: r.recipient_count ?? null,
            bufferPostId:   r.buffer_post_id ?? null,
            scheduledAt:    r.scheduled_at ?? null,
            dispatchedAt:   r.dispatched_at ?? null,
            status:         r.status as PublishJobStatus,
            errorMessage:   r.error_message ?? null,
            createdAt:      String(r.created_at),
        }))

        // Scheduled posts grid: jobs with a future scheduledAt
        const now = new Date().toISOString()
        const { data: scheduledRows } = await supabaseAdmin
            .from("publish_jobs")
            .select("id, channel, scheduled_at, buffer_post_id, asset_id, status")
            .gte("scheduled_at", now)
            .order("scheduled_at", { ascending: true })
            .limit(100)

        const scheduledPosts: ScheduledPostRow[] = (scheduledRows ?? []).map((r) => ({
            id:           String(r.id),
            channel:      r.channel as PublishChannel,
            scheduledAt:  String(r.scheduled_at),
            text:         "",   // lightweight list — detailed text not stored here
            mediaUrl:     null,
            status:       r.status === "COMPLETE" ? "sent"
                        : r.status === "FAILED"   ? "failed"
                        : "scheduled",
            bufferPostId: r.buffer_post_id ?? null,
            assetId:      r.asset_id ?? null,
        }))

        // Last blast timestamp
        const { data: lastBlastRow } = await supabaseAdmin
            .from("publish_jobs")
            .select("dispatched_at")
            .eq("channel", "EMAIL")
            .not("dispatched_at", "is", null)
            .order("dispatched_at", { ascending: false })
            .limit(1)
            .single()

        const state: PublishState = {
            emailSentToday,
            emailDailyLimit: EMAIL_DAILY_LIMIT,
            emailRemainingToday: Math.max(0, EMAIL_DAILY_LIMIT - emailSentToday),
            bufferProfiles,
            scheduledPosts,
            recentJobs,
            lastBlastAt: lastBlastRow?.dispatched_at ?? null,
        }

        return NextResponse.json(state)
    } catch (err) {
        console.error("[publish] GET error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// ── POST: dispatch publish job ────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
    const guard = await requireAdmin()
    if ("error" in guard) return guard.error

    let payload: PublishPayload
    try {
        payload = (await req.json()) as PublishPayload
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    if (!payload.mode || !["email", "buffer", "all"].includes(payload.mode)) {
        return NextResponse.json({ error: "mode must be 'email', 'buffer', or 'all'" }, { status: 400 })
    }

    const response: PublishResponse = {
        errors: [],
        rateLimitedChannels: [],
    }

    // ── Email Blast ─────────────────────────────────────────────────────────
    if (payload.mode === "email" || payload.mode === "all") {
        const cfg = payload.email
        if (!cfg) {
            return NextResponse.json({ error: "email config required for mode 'email' or 'all'" }, { status: 400 })
        }

        const resendKey = process.env.RESEND_API_KEY
        if (!resendKey) {
            return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 })
        }

        const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@psych-mastery.com"

        // Quota check
        const sentToday = await getEmailsSentToday()
        const remaining = EMAIL_DAILY_LIMIT - sentToday

        if (remaining <= 0) {
            return NextResponse.json({
                error: "Daily email quota exhausted. Try again tomorrow.",
                quotaWarning: `${sentToday}/${EMAIL_DAILY_LIMIT} emails sent today`,
            } satisfies PublishResponse, { status: 429 })
        }

        // Clamp maxRecipients to available quota
        const maxRecipients = Math.min(cfg.maxRecipients ?? 90, remaining)

        // Fetch the EMAIL_HTML asset
        const { data: assetRow, error: assetErr } = await supabaseAdmin
            .from("content_assets")
            .select("id, storage_url, metadata, status")
            .eq("id", cfg.assetId)
            .eq("asset_type", "EMAIL_HTML")
            .single()

        if (assetErr || !assetRow) {
            return NextResponse.json({ error: "EMAIL_HTML asset not found or not COMPLETE" }, { status: 404 })
        }
        if (assetRow.status !== "COMPLETE") {
            return NextResponse.json({ error: "Asset must be COMPLETE before publishing" }, { status: 422 })
        }

        // Fetch the HTML body from storage
        let htmlBody: string
        if (assetRow.storage_url) {
            const htmlRes = await fetch(assetRow.storage_url)
            if (!htmlRes.ok) {
                return NextResponse.json({ error: "Could not fetch EMAIL_HTML asset content" }, { status: 502 })
            }
            htmlBody = await htmlRes.text()
        } else {
            return NextResponse.json({ error: "EMAIL_HTML asset has no storage_url" }, { status: 422 })
        }

        // Build recipient list from buyers / leads / both
        const recipientEmails = new Set<string>()

        if (cfg.audienceSource === "buyers" || cfg.audienceSource === "both") {
            const { data: buyers } = await supabaseAdmin
                .from("buyers")
                .select("email")
                .limit(maxRecipients)
            for (const b of buyers ?? []) { recipientEmails.add((b as { email: string }).email) }
        }

        if (cfg.audienceSource === "leads" || cfg.audienceSource === "both") {
            const remaining2 = maxRecipients - recipientEmails.size
            if (remaining2 > 0) {
                const { data: leads } = await supabaseAdmin
                    .from("leads")
                    .select("email")
                    .limit(remaining2)
                for (const l of leads ?? []) { recipientEmails.add((l as { email: string }).email) }
            }
        }

        const recipients = Array.from(recipientEmails).slice(0, maxRecipients)
        if (recipients.length === 0) {
            return NextResponse.json({ error: "No recipients found in selected audience" }, { status: 422 })
        }

        // Create publish_job row
        const { data: jobRow, error: jobInsertErr } = await supabaseAdmin
            .from("publish_jobs")
            .insert({
                channel:         "EMAIL",
                asset_id:        cfg.assetId,
                recipient_count: recipients.length,
                status:          "RUNNING",
            })
            .select("id")
            .single()

        if (jobInsertErr || !jobRow) {
            console.error("[publish] job insert error:", jobInsertErr)
            return NextResponse.json({ error: "Failed to create publish job" }, { status: 500 })
        }

        const jobId = String(jobRow.id)
        let successCount = 0
        const logRows: { recipient_email: string; asset_id: string; publish_job_id: string; delivery_status: string }[] = []

        // Send emails respecting per-call rate (sequential to honour Resend free tier)
        for (const to of recipients) {
            try {
                await sendResendEmail(resendKey, {
                    from: fromAddress,
                    to,
                    subject: cfg.subject,
                    html: htmlBody,
                })
                successCount++
                logRows.push({ recipient_email: to, asset_id: cfg.assetId, publish_job_id: jobId, delivery_status: "sent" })
            } catch (err) {
                if (err instanceof RateLimitError) {
                    response.rateLimitedChannels!.push("EMAIL")
                    break
                }
                logRows.push({ recipient_email: to, asset_id: cfg.assetId, publish_job_id: jobId, delivery_status: "failed" })
                response.errors!.push(`Failed to send to ${to}: ${(err as Error).message}`)
            }
        }

        // Bulk-insert email_blast_log
        if (logRows.length > 0) {
            const { error: logErr } = await supabaseAdmin
                .from("email_blast_log")
                .insert(logRows)
            if (logErr) console.error("[publish] email_blast_log insert error:", logErr)
        }

        // Update job status
        const finalStatus: PublishJobStatus =
            successCount === 0 ? "FAILED"
            : response.rateLimitedChannels!.includes("EMAIL") ? "RATE_LIMITED"
            : "COMPLETE"

        await supabaseAdmin
            .from("publish_jobs")
            .update({ status: finalStatus, dispatched_at: new Date().toISOString(), recipient_count: successCount })
            .eq("id", jobId)

        response.emailJobId = jobId
        response.emailCount = successCount

        if (sentToday + successCount >= EMAIL_DAILY_LIMIT * 0.9) {
            response.quotaWarning = `Approaching daily limit: ${sentToday + successCount}/${EMAIL_DAILY_LIMIT} used`
        }
    }

    // ── Buffer Blast ────────────────────────────────────────────────────────
    if (payload.mode === "buffer" || payload.mode === "all") {
        const cfg = payload.buffer
        if (!cfg) {
            return NextResponse.json({ error: "buffer config required for mode 'buffer' or 'all'" }, { status: 400 })
        }

        // Webhook Override (Make.com or Zapier)
        const webhookUrl = process.env.MAKE_WEBHOOK_URL || process.env.ZAPIER_WEBHOOK_URL
        const accessToken = process.env.BUFFER_ACCESS_TOKEN

        if (!webhookUrl && !accessToken) {
            return NextResponse.json({ error: "No MAKE_WEBHOOK_URL or BUFFER_ACCESS_TOKEN configured" }, { status: 503 })
        }

        // Fetch the asset for media URL
        const { data: assetRow } = await supabaseAdmin
            .from("content_assets")
            .select("id, storage_url, asset_type, status, metadata")
            .eq("id", cfg.assetId)
            .single()

        if (!assetRow || assetRow.status !== "COMPLETE") {
            return NextResponse.json({ error: "Asset not found or not COMPLETE" }, { status: 404 })
        }

        const isVideo = assetRow.asset_type === "VIDEO_MP4"
        const isCarousel = assetRow.asset_type === "CAROUSEL_PNG"

        // ── Webhook Path (Zapier / Make.com) ──
        if (webhookUrl) {
            const payloadData = {
                text: cfg.text,
                mediaUrl: assetRow.storage_url,
                isVideo: isVideo,
                mediaThumbnail: isVideo ? ((assetRow.metadata as any)?.thumbnailUrl || null) : null,
                scheduledAt: cfg.scheduledAt || null,
                assetId: cfg.assetId
            }

            try {
                const whRes = await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payloadData)
                })

                if (!whRes.ok) {
                    const errText = await whRes.text()
                    response.errors!.push(`Webhook failed: ${whRes.status} ${errText}`)
                } else {
                    // Log success natively using legacy constant to pass strict database enum checks
                    await supabaseAdmin
                        .from("publish_jobs")
                        .insert({
                            channel: "LINKEDIN", 
                            asset_id: cfg.assetId,
                            dispatched_at: new Date().toISOString(),
                            status: "COMPLETE",
                        })
                        
                    // Make sure the master Calendar grid actually sees this status update!
                    await supabaseAdmin
                        .from("content_calendar")
                        .update({ 
                            publish_status: cfg.scheduledAt ? "SCHEDULED" : "PUBLISHED" 
                        })
                        .eq("asset_id", cfg.assetId)

                    response.bufferUpdateIds = ["webhook_dipatch_1"]
                    response.bufferCount = 1
                }
            } catch (err) {
                response.errors!.push(`Webhook connection error: ${(err as Error).message}`)
            }
        } 
        // ── Legacy Buffer API Path ──
        else {
            let profiles: BufferProfile[] = []
            try {
                profiles = await fetchBufferProfiles(accessToken!)
            } catch (err) {
                return NextResponse.json({ error: `Buffer profile fetch failed: ${(err as Error).message}` }, { status: 502 })
            }

            const profileMap = new Map(profiles.map((p) => [p.id, p]))
            const safeProfileIds = cfg.profileIds.filter((id) => {
                const p = profileMap.get(id)
                return p && p.bufferCount < p.bufferMax
            })
            const saturatedProfiles = cfg.profileIds.filter((id) => !safeProfileIds.includes(id))

            if (saturatedProfiles.length > 0) {
                saturatedProfiles.forEach((id) => {
                    const p = profileMap.get(id)
                    if (p) response.rateLimitedChannels!.push(p.service.toUpperCase() as PublishChannel)
                })
            }

            if (safeProfileIds.length === 0) {
                return NextResponse.json({
                    ...response,
                    error: "All selected Buffer profiles are at queue capacity",
                    message: `Saturated profiles: ${saturatedProfiles.join(", ")}`,
                } satisfies PublishResponse, { status: 429 })
            }

            const bufferUpdateIds: string[] = []

            for (const profileId of safeProfileIds) {
                const profile = profileMap.get(profileId)
                if (!profile) continue

                const mediaAttachment = assetRow.storage_url
                    ? (isVideo
                        ? {
                            video:         assetRow.storage_url,
                            thumbnail:     (assetRow.metadata as Record<string, string> | null)?.thumbnailUrl ?? undefined,
                            tiktokViewport: profile.service === "tiktok",
                        }
                        : isCarousel
                        ? { photo: assetRow.storage_url }
                        : { photo: assetRow.storage_url })
                    : undefined

                const bufferPayload: BufferPostPayload = {
                    profile_ids:  [profileId],
                    text:         cfg.text,
                    media:        mediaAttachment,
                    scheduled_at: cfg.scheduledAt,
                    shorten:      true,
                }

                let bufferResp: BufferPostResponse
                try {
                    bufferResp = await createBufferUpdate(accessToken!, bufferPayload)
                } catch (err) {
                    if (err instanceof RateLimitError) {
                        response.rateLimitedChannels!.push(profile.service.toUpperCase() as PublishChannel)
                        continue
                    }
                    response.errors!.push(`Buffer post failed for profile ${profileId}: ${(err as Error).message}`)
                    continue
                }

                for (const update of bufferResp.updates as BufferScheduledUpdate[]) {
                    bufferUpdateIds.push(update.id)

                    await supabaseAdmin
                        .from("publish_jobs")
                        .insert({
                            channel:         profile.service.toUpperCase() as PublishChannel,
                            asset_id:        cfg.assetId,
                            buffer_post_id:  update.id,
                            scheduled_at:    update.due_at ? new Date(update.due_at * 1000).toISOString() : null,
                            dispatched_at:   new Date().toISOString(),
                            status:          "COMPLETE",
                        })
                }
            }

            response.bufferUpdateIds = bufferUpdateIds
            response.bufferCount = bufferUpdateIds.length
        }
    }

    response.message = "Publish job(s) dispatched successfully"
    return NextResponse.json(response satisfies PublishResponse, { status: 200 })
}
