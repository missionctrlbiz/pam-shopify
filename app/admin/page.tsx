import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

export const dynamic = "force-dynamic"

type AdminSessionUser = {
    role?: string | null
}

export default async function AdminDashboardPage() {
    const session = await auth()
    const user = session?.user as AdminSessionUser | undefined

    if (!session || user?.role !== "ADMIN") {
        redirect("/admin/login")
    }

    return <AdminDashboardClient session={session} />
}
