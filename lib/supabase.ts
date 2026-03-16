import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy"
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE || "dummy_admin"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
        console.warn("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }
}

import { createBrowserClient, createServerClient } from "@supabase/ssr"

export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey)

// ---------------------------------------------------------------------------
// Admin Client (Service Role)
// For use in server-side background tasks/workers where RLS should be bypassed
// ---------------------------------------------------------------------------
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : createClient(supabaseUrl, supabaseAnonKey) // Fallback to anon if not set, but operations requiring admin will fail

// ---------------------------------------------------------------------------
// Server-Side Auth Helper (for API routes / Server Components)
// ---------------------------------------------------------------------------
export async function getServerAuth() {
    const { cookies } = require("next/headers")
    const cookieStore = await cookies()

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll() {
                    // API routes typically don't set cookies, but can implement if needed
                }
            }
        }
    )
}
