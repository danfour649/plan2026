-- CreateTable
CREATE TABLE "PlanShare" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanInvite" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanInvite_token_key" ON "PlanInvite"("token");

-- CreateIndex
CREATE INDEX "PlanShare_planId_idx" ON "PlanShare"("planId");

-- CreateIndex
CREATE INDEX "PlanShare_sharedWithUserId_idx" ON "PlanShare"("sharedWithUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanShare_planId_sharedWithUserId_key" ON "PlanShare"("planId", "sharedWithUserId");

-- CreateIndex
CREATE INDEX "PlanInvite_planId_idx" ON "PlanInvite"("planId");

-- CreateIndex
CREATE INDEX "PlanInvite_token_idx" ON "PlanInvite"("token");

-- AddForeignKey
ALTER TABLE "PlanShare" ADD CONSTRAINT "PlanShare_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanShare" ADD CONSTRAINT "PlanShare_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInvite" ADD CONSTRAINT "PlanInvite_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
