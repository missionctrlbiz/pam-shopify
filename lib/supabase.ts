import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
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
import { cookies } from "next/headers"

export async function getServerAuth() {
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
