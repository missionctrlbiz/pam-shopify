import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const jobs = await prisma.renderJob.findMany({
        where: { status: 'FAILED' },
        orderBy: { queuedAt: 'desc' },
        take: 10,
        select: {
            id: true,
            jobType: true,
            status: true,
            errorMessage: true,
            queuedAt: true,
            contentIdea: {
                select: {
                    calendarEntry: {
                        select: { dayNumber: true, topic: true }
                    }
                }
            }
        }
    })

    console.log(JSON.stringify(jobs, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
