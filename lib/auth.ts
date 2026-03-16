import { getServerAuth, supabaseAdmin } from "./supabase"

/**
 * Custom auth() wrapper replacing NextAuth for backward compatibility.
 * Fetches the user from Supabase and packs it into the expected Session structure.
 */
export const auth = async () => {
    try {
        const supabase = await getServerAuth()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return null
        }

        // Fetch user profile for role verification
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || null,
                role: profile?.role || 'USER', // Supabase profile role mapping
            }
        }
    } catch (e: any) {
        if (e?.digest === 'DYNAMIC_SERVER_USAGE') {
            throw e
        }
        console.error("[auth] wrapper error:", e)
        return null
    }
}

export const signIn = () => {
    throw new Error("signIn() is disabled from back, use supabaseBrowser.auth.signInWithPassword client-side.")
}

export const signOut = () => {
    throw new Error("signOut() is disabled from back, use supabaseBrowser.auth.signOut client-side.")
}
