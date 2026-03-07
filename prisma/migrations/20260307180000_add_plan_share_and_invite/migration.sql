-- PlanShare already added by 20260307170000_add_plan_share. Only add PlanInvite here.
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
CREATE INDEX "PlanInvite_planId_idx" ON "PlanInvite"("planId");

-- CreateIndex
CREATE INDEX "PlanInvite_token_idx" ON "PlanInvite"("token");

-- AddForeignKey
ALTER TABLE "PlanInvite" ADD CONSTRAINT "PlanInvite_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
