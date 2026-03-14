-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('CAROUSEL_PNG', 'VIDEO_MP4', 'TEXT_POST', 'EMAIL_HTML', 'AUDIO_MP3', 'VIDEO_SCRIPT_JSON');

-- CreateEnum
CREATE TYPE "public"."FieldCategory" AS ENUM ('CHIEF_COMPLAINT', 'MSE', 'DIAGNOSTIC', 'RISK_ASSESSMENT', 'DOCUMENTATION', 'INTERVIEW');

-- CreateEnum
CREATE TYPE "public"."FunnelStage" AS ENUM ('AWARENESS', 'CONSIDERATION', 'CONVERSION', 'RETENTION');

-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('IG', 'FB', 'TIKTOK', 'LINKEDIN', 'EMAIL', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."PostType" AS ENUM ('CAROUSEL', 'VIDEO', 'TEXT_POST', 'REEL', 'STORY', 'EMAIL_LESSON');

-- CreateEnum
CREATE TYPE "public"."PublishStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'GENERATING', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."QualityGateStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'BYPASSED');

-- CreateEnum
CREATE TYPE "public"."RenderJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."RenderJobType" AS ENUM ('CAROUSEL', 'VIDEO', 'AUDIO', 'REPURPOSE');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Buyer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicalField" (
    "id" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldCategory" "public"."FieldCategory" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "exampleValues" JSONB NOT NULL DEFAULT '[]',
    "clinicalContext" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentAsset" (
    "id" TEXT NOT NULL,
    "contentIdeaId" TEXT NOT NULL,
    "renderJobId" TEXT,
    "platform" "public"."Platform" NOT NULL,
    "assetType" "public"."AssetType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageUrl" TEXT,
    "storagePath" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentIdea" (
    "id" TEXT NOT NULL,
    "calendarEntryId" TEXT NOT NULL,
    "clinicalFieldId" TEXT,
    "masterJson" JSONB NOT NULL,
    "rawGeminiPrompt" TEXT NOT NULL,
    "qualityGateStatus" "public"."QualityGateStatus" NOT NULL DEFAULT 'PENDING',
    "generatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'lead-magnet',
    "ip" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductionCalendarEntry" (
    "id" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "topic" TEXT NOT NULL,
    "contentGoal" TEXT NOT NULL,
    "funnelStage" "public"."FunnelStage" NOT NULL,
    "postType" "public"."PostType" NOT NULL,
    "hook" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "publishStatus" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionCalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QualityGateResult" (
    "id" TEXT NOT NULL,
    "contentIdeaId" TEXT NOT NULL,
    "question1" TEXT NOT NULL,
    "question2" TEXT NOT NULL,
    "question3" TEXT NOT NULL,
    "question4" TEXT NOT NULL,
    "question5" TEXT NOT NULL,
    "score1" INTEGER NOT NULL,
    "score2" INTEGER NOT NULL,
    "score3" INTEGER NOT NULL,
    "score4" INTEGER NOT NULL,
    "score5" INTEGER NOT NULL,
    "overallScore" DECIMAL(65,30) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "geminiRawResponse" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityGateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenderJob" (
    "id" TEXT NOT NULL,
    "contentIdeaId" TEXT NOT NULL,
    "jobType" "public"."RenderJobType" NOT NULL,
    "cloudRunExecutionId" TEXT,
    "cloudTasksTaskId" TEXT,
    "status" "public"."RenderJobStatus" NOT NULL DEFAULT 'QUEUED',
    "inputPayload" JSONB NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SoapHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoapHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."VideoScript" (
    "id" TEXT NOT NULL,
    "contentIdeaId" TEXT NOT NULL,
    "scriptJson" JSONB NOT NULL,
    "totalDurationSecs" INTEGER NOT NULL,
    "elevenLabsJobId" TEXT,
    "audioStorageUrl" TEXT,
    "audioStatus" "public"."AssetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoScript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider" ASC, "providerAccountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_email_key" ON "public"."Buyer"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalField_fieldKey_key" ON "public"."ClinicalField"("fieldKey" ASC);

-- CreateIndex
CREATE INDEX "ContentAsset_contentIdeaId_platform_idx" ON "public"."ContentAsset"("contentIdeaId" ASC, "platform" ASC);

-- CreateIndex
CREATE INDEX "ContentAsset_status_idx" ON "public"."ContentAsset"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContentIdea_calendarEntryId_key" ON "public"."ContentIdea"("calendarEntryId" ASC);

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "public"."Lead"("email" ASC);

-- CreateIndex
CREATE INDEX "ProductionCalendarEntry_entryDate_idx" ON "public"."ProductionCalendarEntry"("entryDate" ASC);

-- CreateIndex
CREATE INDEX "ProductionCalendarEntry_platform_idx" ON "public"."ProductionCalendarEntry"("platform" ASC);

-- CreateIndex
CREATE INDEX "ProductionCalendarEntry_publishStatus_idx" ON "public"."ProductionCalendarEntry"("publishStatus" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "QualityGateResult_contentIdeaId_key" ON "public"."QualityGateResult"("contentIdeaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken" ASC);

-- CreateIndex
CREATE INDEX "SoapHistory_userId_idx" ON "public"."SoapHistory"("userId" ASC);

-- CreateIndex
CREATE INDEX "UsageEvent_action_idx" ON "public"."UsageEvent"("action" ASC);

-- CreateIndex
CREATE INDEX "UsageEvent_createdAt_idx" ON "public"."UsageEvent"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier" ASC, "token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "VideoScript_contentIdeaId_key" ON "public"."VideoScript"("contentIdeaId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentAsset" ADD CONSTRAINT "ContentAsset_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "public"."ContentIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentAsset" ADD CONSTRAINT "ContentAsset_renderJobId_fkey" FOREIGN KEY ("renderJobId") REFERENCES "public"."RenderJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentIdea" ADD CONSTRAINT "ContentIdea_calendarEntryId_fkey" FOREIGN KEY ("calendarEntryId") REFERENCES "public"."ProductionCalendarEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentIdea" ADD CONSTRAINT "ContentIdea_clinicalFieldId_fkey" FOREIGN KEY ("clinicalFieldId") REFERENCES "public"."ClinicalField"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentIdea" ADD CONSTRAINT "ContentIdea_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductionCalendarEntry" ADD CONSTRAINT "ProductionCalendarEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QualityGateResult" ADD CONSTRAINT "QualityGateResult_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "public"."ContentIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenderJob" ADD CONSTRAINT "RenderJob_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "public"."ContentIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SoapHistory" ADD CONSTRAINT "SoapHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoScript" ADD CONSTRAINT "VideoScript_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "public"."ContentIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

