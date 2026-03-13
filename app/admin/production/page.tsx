import { redirect } from "next/navigation"

// Production Calendar now lives inside the main admin shell as a sidebar tab.
// This route simply redirects there.
export default function ProductionPage() {
    redirect("/admin")
}
