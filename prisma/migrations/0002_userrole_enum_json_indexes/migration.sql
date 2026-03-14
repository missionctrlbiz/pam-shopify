-- Migration: UserRole enum, Json metadata, new indexes, fieldType
-- Safe data-preserving migration (no DROP/RECREATE)

-- ─────────────────────────────────────────────────────────────────
-- 1. Create UserRole enum
-- ─────────────────────────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- ─────────────────────────────────────────────────────────────────
-- 2. Normalize existing role string values before casting
-- ─────────────────────────────────────────────────────────────────
UPDATE "User" SET "role" = 'ADMIN' WHERE lower("role") = 'admin';
UPDATE "User" SET "role" = 'USER'  WHERE "role" IS NULL OR lower("role") NOT IN ('admin', 'user');

-- ─────────────────────────────────────────────────────────────────
-- 3. Cast the column in-place (no data loss)
--    Must drop default first; PostgreSQL cannot auto-cast it
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";

-- ─────────────────────────────────────────────────────────────────
-- 4. UsageEvent.metadata: String? → Json?
--    Null out any values that are not valid JSON before casting
-- ─────────────────────────────────────────────────────────────────
UPDATE "UsageEvent"
  SET "metadata" = NULL
  WHERE "metadata" IS NOT NULL
    AND "metadata" !~ '^[\[\{]';

ALTER TABLE "UsageEvent"
  ALTER COLUMN "metadata" TYPE JSONB USING "metadata"::jsonb;

-- ─────────────────────────────────────────────────────────────────
-- 5. ClinicalField.fieldType (new column)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE "ClinicalField"
  ADD COLUMN IF NOT EXISTS "fieldType" TEXT NOT NULL DEFAULT 'text';

-- ─────────────────────────────────────────────────────────────────
-- 6. New performance indexes
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Lead_userId_idx"
  ON "Lead"("userId");

CREATE INDEX IF NOT EXISTS "UsageEvent_userId_idx"
  ON "UsageEvent"("userId");

CREATE INDEX IF NOT EXISTS "ProductionCalendarEntry_approvedById_idx"
  ON "ProductionCalendarEntry"("approvedById");

CREATE INDEX IF NOT EXISTS "ContentIdea_clinicalFieldId_idx"
  ON "ContentIdea"("clinicalFieldId");

CREATE INDEX IF NOT EXISTS "ContentIdea_generatedById_idx"
  ON "ContentIdea"("generatedById");

CREATE INDEX IF NOT EXISTS "ClinicalField_isActive_idx"
  ON "ClinicalField"("isActive");

CREATE INDEX IF NOT EXISTS "ClinicalField_fieldCategory_idx"
  ON "ClinicalField"("fieldCategory");
