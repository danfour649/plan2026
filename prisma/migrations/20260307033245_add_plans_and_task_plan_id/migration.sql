-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" INTEGER NOT NULL DEFAULT 4,
    "percentCompleted" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "color" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Plan_userId_idx" ON "Plan"("userId");

-- CreateIndex
CREATE INDEX "Plan_userId_priority_idx" ON "Plan"("userId", "priority");

-- CreateIndex
CREATE INDEX "Task_planId_idx" ON "Task"("planId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
