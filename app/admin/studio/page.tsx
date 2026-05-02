import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function AdminStudioPage() {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
        redirect("/admin/login")
    }

    redirect("/admin?panel=carouselStudio")
}
