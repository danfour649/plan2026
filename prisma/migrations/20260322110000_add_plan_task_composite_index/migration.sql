-- CreateIndex
CREATE INDEX "Task_planId_status_completedAt_urgency_createdAt_idx" ON "Task"("planId", "status", "completedAt" DESC, "urgency" DESC, "createdAt" DESC);
