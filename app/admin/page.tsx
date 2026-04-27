import AuthGate from "./_AuthGate"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage() {
    return (
        <AuthGate>
            <AdminDashboardClient />
        </AuthGate>
    )
}
