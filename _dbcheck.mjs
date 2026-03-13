import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
try {
    const [entries, ideas, fields, jobs] = await Promise.all([
        p.productionCalendarEntry.count(),
        p.contentIdea.count(),
        p.clinicalField.count(),
        p.renderJob.count(),
    ])
    console.log("CalendarEntries:", entries)
    console.log("ContentIdeas:", ideas)
    console.log("ClinicalFields:", fields)
    console.log("RenderJobs:", jobs)
} catch (e) {
    console.error(e.message)
} finally {
    await p.$disconnect()
}
