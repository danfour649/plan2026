-- CreateTable
CREATE TABLE "PlanShareLink" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "allowStatusUpdate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanShareLink_token_key" ON "PlanShareLink"("token");

-- CreateIndex
CREATE INDEX "PlanShareLink_planId_idx" ON "PlanShareLink"("planId");

-- CreateIndex
CREATE INDEX "PlanShareLink_token_idx" ON "PlanShareLink"("token");

-- AddForeignKey
ALTER TABLE "PlanShareLink" ADD CONSTRAINT "PlanShareLink_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
