-- CreateIndex
CREATE INDEX "Task_userId_status_urgency_createdAt_idx" ON "Task"("userId", "status", "urgency" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Plan_userId_status_priority_createdAt_idx" ON "Plan"("userId", "status", "priority" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PlanShare_sharedWithUserId_planId_idx" ON "PlanShare"("sharedWithUserId", "planId");
