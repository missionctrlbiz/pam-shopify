import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "COMPLETE";
    const assetType = searchParams.get("assetType");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = supabaseAdmin
        .from("content_assets")
        .select("id, storage_url, asset_type, status, file_name, metadata")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (assetType) {
        query = query.eq("asset_type", assetType);
    }

    const { data: assets, error } = await query;

    if (error) {
        console.error("[assets API] DB Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map DB snake_case columns to camelCase for the frontend UI models
    const formatted = (assets || []).map(a => ({
        id: a.id,
        storageUrl: a.storage_url,
        assetType: a.asset_type,
        assetStatus: a.status,
        fileName: a.file_name,
        metadata: a.metadata
    }));

    return NextResponse.json({ assets: formatted });
}
