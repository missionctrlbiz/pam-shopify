import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// ---------------------------------------------------------------------------
// Admin Client (Service Role)
// For use in server-side background tasks/workers where RLS should be bypassed
// Browser client is in lib/supabase-browser.ts (client components only)
// ---------------------------------------------------------------------------
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : createClient(supabaseUrl, supabaseAnonKey) // Fallback to anon if not set, but operations requiring admin will fail
