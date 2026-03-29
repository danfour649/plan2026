-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('daily', 'weekly', 'monthly');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "recurrence" "TaskRecurrence";
