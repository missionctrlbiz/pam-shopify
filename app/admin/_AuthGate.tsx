import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AuthGate({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        redirect("/admin/login")
    }
    return <>{children}</>
}
