-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('active', 'on_hold', 'completed');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'active';

-- Backfill: migrate completed tasks to status = 'completed'
UPDATE "Task" SET "status" = 'completed' WHERE "completedAt" IS NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "Task_userId_completedAt_idx";

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");
