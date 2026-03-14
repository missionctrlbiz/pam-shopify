import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

export default async function AdminDashboardPage() {
    const session = await auth()

    if (!session || (session.user as any)?.role !== "ADMIN") {
        redirect("/admin/login")
    }

    return <AdminDashboardClient session={session} />
}
