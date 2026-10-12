-- Additive migration. Existing content remains uncategorized until an editor assigns a use case.
ALTER TABLE "Prompt" ADD COLUMN "useCase" TEXT;
ALTER TABLE "Prompt" ADD COLUMN "resourceType" TEXT NOT NULL DEFAULT 'prompt';
ALTER TABLE "Prompt" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Prompt" SET "intent" = 'teaching' WHERE lower("intent") = 'learning';
UPDATE "Prompt" SET "intents" = ARRAY(SELECT DISTINCT CASE WHEN lower(value) = 'learning' THEN 'teaching' ELSE value END FROM unnest("intents") AS value);
