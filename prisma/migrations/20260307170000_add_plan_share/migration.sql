-- CreateTable
CREATE TABLE "PlanShare" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanShare_planId_idx" ON "PlanShare"("planId");

-- CreateIndex
CREATE INDEX "PlanShare_sharedWithUserId_idx" ON "PlanShare"("sharedWithUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanShare_planId_sharedWithUserId_key" ON "PlanShare"("planId", "sharedWithUserId");

-- AddForeignKey
ALTER TABLE "PlanShare" ADD CONSTRAINT "PlanShare_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanShare" ADD CONSTRAINT "PlanShare_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
