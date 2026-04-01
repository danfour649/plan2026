-- CreateTable
CREATE TABLE "PlanAttachment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanAttachment_planId_idx" ON "PlanAttachment"("planId");

-- CreateIndex
CREATE INDEX "PlanAttachment_userId_idx" ON "PlanAttachment"("userId");

-- AddForeignKey
ALTER TABLE "PlanAttachment" ADD CONSTRAINT "PlanAttachment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAttachment" ADD CONSTRAINT "PlanAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "logoAttachmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_logoAttachmentId_key" ON "Plan"("logoAttachmentId");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_logoAttachmentId_fkey" FOREIGN KEY ("logoAttachmentId") REFERENCES "PlanAttachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
