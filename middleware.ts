import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const { pathname } = req.nextUrl

    // Protect admin routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        if (!req.auth) {
            const loginUrl = new URL("/admin/login", req.url)
            loginUrl.searchParams.set("callbackUrl", pathname)
            return NextResponse.redirect(loginUrl)
        }

        // Check admin role
        if ((req.auth.user as any)?.role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/admin/:path*"],
}
