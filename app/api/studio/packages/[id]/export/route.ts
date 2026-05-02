import { NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk"
import { runStudioExportPackage } from "@/lib/studio/exportPackage"
import { getStudioHandledError, requireStudioAdmin } from "@/lib/studio/server"
import { STUDIO_RATIOS } from "@/lib/studio/shared"
import type { StudioRatio } from "@/lib/studio/types"
import type { studioExportPackageTask } from "@/trigger/studio"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ownerId = await requireStudioAdmin()
        const { id } = await params
        const body = await req.json().catch(() => ({})) as {
            ratios?: StudioRatio[]
            mode?: "SLIDES" | "BUNDLE" | "ALL"
        }

        const ratios = Array.isArray(body.ratios) && body.ratios.length > 0 ? body.ratios : STUDIO_RATIOS
        const mode = body.mode ?? "ALL"
        const triggerConfigured = Boolean(process.env.TRIGGER_SECRET_KEY && process.env.TRIGGER_PROJECT_REF)

        if (!triggerConfigured) {
            const assets = await runStudioExportPackage({
                packageId: id,
                ownerId,
                ratios,
                mode,
            })

            return NextResponse.json({
                dispatched: false,
                taskId: "inline-complete",
                inline: true,
                assets,
            })
        }

        const handle = await tasks.trigger<typeof studioExportPackageTask>("studio-export-package", {
            packageId: id,
            ownerId,
            ratios,
            mode,
        })

        return NextResponse.json({
            dispatched: true,
            taskId: handle.id,
            inline: false,
        })
    } catch (error) {
        console.error("[studio/packages/:id/export] POST failed", error)
        const handled = getStudioHandledError(error, "Failed to export studio assets")
        return NextResponse.json({ error: handled.message }, { status: handled.status })
    }
}
