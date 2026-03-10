import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth(() => {
    // Auth.js handles the logic inside the 'authorized' callback of authConfig
    // We just need to make sure we're using the edge-compatible version here.
})

export const config = {
    // Only wrap the admin routes to protect them
    matcher: ["/admin/:path*"],
}
