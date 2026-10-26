-- Additive blog schema. No existing content, users or settings are rewritten.
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TABLE "BlogPost" (
 "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "excerpt" TEXT NOT NULL,
 "contentMd" TEXT NOT NULL, "authorName" TEXT NOT NULL DEFAULT 'تحریریه پرامپتی', "category" TEXT NOT NULL DEFAULT 'راهنما',
 "coverImage" TEXT, "coverImageAlt" TEXT, "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
 "publishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");
CREATE TABLE "BlogPostPrompt" (
 "postId" TEXT NOT NULL, "promptId" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "BlogPostPrompt_pkey" PRIMARY KEY ("postId", "promptId"),
 CONSTRAINT "BlogPostPrompt_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "BlogPostPrompt_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "BlogPostPrompt_promptId_idx" ON "BlogPostPrompt"("promptId");
