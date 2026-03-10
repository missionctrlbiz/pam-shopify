/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding database...\n")

    // Create admin user
    const adminPassword = await bcrypt.hash("PamAdmin2026!", 12)
    const admin = await prisma.user.upsert({
        where: { email: "anthoniaojomo22@gmail.com" },
        update: { password: adminPassword, role: "admin" },
        create: {
            email: "anthoniaojomo22@gmail.com",
            name: "Anthonia Ojomor",
            password: adminPassword,
            role: "admin",
        },
    })
    console.log(`✅ Admin user created:`)
    console.log(`   Email:    anthoniaojomo22@gmail.com`)
    console.log(`   Password: PamAdmin2026!`)
    console.log(`   Role:     ${admin.role}\n`)

    // Seed the existing buyer
    const buyer = await prisma.buyer.upsert({
        where: { email: "charleschuck89@gmail.com" },
        update: {},
        create: { email: "charleschuck89@gmail.com" },
    })
    console.log(`✅ Buyer whitelisted: ${buyer.email}\n`)

    console.log("🎉 Database seeded successfully!")
    console.log("\n📋 Test Credentials:")
    console.log("   URL:      http://localhost:3000/admin/login")
    console.log("   Email:    anthoniaojomo22@gmail.com")
    console.log("   Password: PamAdmin2026!")
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
