import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function run() {
    const ideas = await prisma.contentIdea.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
    })
    for (const i of ideas) {
        console.log("--- MasterJson for Idea", i.id, "---")
        console.log(JSON.stringify(i.masterJson, null, 2))
    }
}
run().finally(() => prisma.$disconnect())
