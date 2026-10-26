-- Recoverable article deletion; existing articles stay visible and unchanged.
ALTER TABLE "BlogPost" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");
