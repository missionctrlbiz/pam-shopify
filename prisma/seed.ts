import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// CSV FIELD MAP HELPERS
// ---------------------------------------------------------------------------

/**
 * Convert a snake_case fieldKey such as "mse_affect" into a human-readable
 * display name like "MSE Affect".
 */
function toDisplayName(fieldKey: string): string {
  return fieldKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Derive a FieldCategory from the field key prefix.
 * Prefixes in the CSV:
 *   assess_  → DIAGNOSTIC
 *   mse_     → MSE
 *   plan_    → DOCUMENTATION
 *   risk_    → RISK_ASSESSMENT
 *   s_       → CHIEF_COMPLAINT  (subjective / chief complaint block)
 *   cont_    → DOCUMENTATION    (continuation/summary fields)
 *   sx_      → DIAGNOSTIC       (symptom checklists feed into diagnostic reasoning)
 *   vh_      → INTERVIEW        (visit header / interview metadata)
 */
type FieldCategoryValue =
  | "CHIEF_COMPLAINT"
  | "MSE"
  | "DIAGNOSTIC"
  | "RISK_ASSESSMENT"
  | "DOCUMENTATION"
  | "INTERVIEW"

function categoriseField(fieldKey: string): FieldCategoryValue {
  if (fieldKey.startsWith("assess_")) return "DIAGNOSTIC"
  if (fieldKey.startsWith("mse_")) return "MSE"
  if (fieldKey.startsWith("plan_")) return "DOCUMENTATION"
  if (fieldKey.startsWith("risk_")) return "RISK_ASSESSMENT"
  if (fieldKey.startsWith("s_")) return "CHIEF_COMPLAINT"
  if (fieldKey.startsWith("cont_")) return "DOCUMENTATION"
  if (fieldKey.startsWith("sx_")) return "DIAGNOSTIC"
  if (fieldKey.startsWith("vh_")) return "INTERVIEW"
  // Fallback — should not happen with the current CSV, but safe to have
  return "DOCUMENTATION"
}

interface CsvRow {
  fieldKey: string
  fieldType: string
}

/**
 * Parse the two-column FieldMap CSV.
 * Header row: FieldName,Type
 * Returns an array of { fieldKey, fieldType } objects.
 */
function parseCsvFieldMap(csvPath: string): CsvRow[] {
  const raw = fs.readFileSync(csvPath, "utf-8")
  const lines = raw.split(/\r?\n/).filter(Boolean)

  // Skip the header line (index 0)
  const dataLines = lines.slice(1)

  return dataLines
    .map((line) => {
      const [fieldKey, fieldType] = line.split(",")
      return { fieldKey: fieldKey?.trim(), fieldType: fieldType?.trim() }
    })
    .filter((row) => Boolean(row.fieldKey))
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding database...\n")

  // ── 1. Admin user ─────────────────────────────────────────────────────────
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
  console.log(`✅ Admin user upserted:`)
  console.log(`   Email:    anthoniaojomo22@gmail.com`)
  console.log(`   Password: PamAdmin2026!`)
  console.log(`   Role:     ${admin.role}\n`)

  // ── 2. Buyer whitelist ────────────────────────────────────────────────────
  const buyer = await prisma.buyer.upsert({
    where: { email: "charleschuck89@gmail.com" },
    update: {},
    create: { email: "charleschuck89@gmail.com" },
  })
  console.log(`✅ Buyer whitelisted: ${buyer.email}\n`)

  // ── 3. Clinical Field Map ─────────────────────────────────────────────────
  const csvPath = path.resolve(
    __dirname,
    "../DOCS/Psychiatric_Assessment_SuperCompact_FieldMap.csv"
  )

  if (!fs.existsSync(csvPath)) {
    console.warn(`⚠️  CSV not found at: ${csvPath}`)
    console.warn("   Skipping ClinicalField seeding.\n")
  } else {
    const rows = parseCsvFieldMap(csvPath)
    console.log(`📋 Parsed ${rows.length} clinical fields from CSV.\n`)

    // Build upsert operations
    const upsertOps = rows.map((row) => {
      const category = categoriseField(row.fieldKey)
      const displayName = toDisplayName(row.fieldKey)

      return prisma.clinicalField.upsert({
        where: { fieldKey: row.fieldKey },
        update: {
          fieldCategory: category,
          displayName,
          isActive: true,
        },
        create: {
          fieldKey: row.fieldKey,
          fieldCategory: category,
          displayName,
          description: "",
          exampleValues: [],
          isActive: true,
        },
      })
    })

    // Run all upserts in a single transaction for atomicity
    const results = await prisma.$transaction(upsertOps)

    // Report category breakdown
    const breakdown: Partial<Record<FieldCategoryValue, number>> = {}
    results.forEach((r: { fieldCategory: FieldCategoryValue }) => {
      breakdown[r.fieldCategory] = (breakdown[r.fieldCategory] ?? 0) + 1
    })

    console.log(`✅ ${results.length} ClinicalField rows upserted:`)
    Object.entries(breakdown).forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(20)} ${count} fields`)
    })
    console.log()
  }

  // ── Done ──────────────────────────────────────────────────────────────────
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
