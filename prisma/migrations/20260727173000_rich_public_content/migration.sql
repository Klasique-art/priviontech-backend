CREATE TYPE "ProjectKind" AS ENUM ('WEBSITE', 'WEB_APP', 'MOBILE_APP', 'DESKTOP_APP', 'PLATFORM', 'CASE_STUDY');
ALTER TABLE "Service"
  ADD COLUMN "tagline" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "heroImageUrl" TEXT,
  ADD COLUMN "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "process" JSONB,
  ADD COLUMN "faqs" JSONB,
  ADD COLUMN "startingPrice" TEXT,
  ADD COLUMN "estimatedTimeline" TEXT;
ALTER TABLE "Project"
  ADD COLUMN "kind" "ProjectKind" NOT NULL DEFAULT 'CASE_STUDY',
  ADD COLUMN "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "playStoreUrl" TEXT,
  ADD COLUMN "appStoreUrl" TEXT,
  ADD COLUMN "results" JSONB;
ALTER TABLE "ProjectRequest"
  ADD COLUMN "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "targetAudience" TEXT,
  ADD COLUMN "requiredFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "preferredPlatforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "inspirationUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "budgetMin" INTEGER,
  ADD COLUMN "budgetMax" INTEGER,
  ADD COLUMN "budgetCurrency" TEXT,
  ADD COLUMN "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "contactPreference" TEXT,
  ADD COLUMN "discoveryAnswers" JSONB,
  ADD COLUMN "consentToContact" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source" TEXT;
CREATE INDEX "Service_category_idx" ON "Service"("category");
CREATE INDEX "Project_status_kind_idx" ON "Project"("status", "kind");
