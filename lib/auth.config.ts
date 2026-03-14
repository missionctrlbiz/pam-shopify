/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/admin/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAdmin = (auth?.user as any)?.role === "ADMIN"
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")
            const isOnLogin = nextUrl.pathname === "/admin/login"

            if (isOnAdmin && !isOnLogin) {
                if (isLoggedIn && isAdmin) return true
                return false // Redirect to login
            }
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role
                session.user.id = token.id
            }
            return session
        },
    },
    providers: [], // Add empty providers array, required by NextAuthConfig type
} satisfies NextAuthConfig
