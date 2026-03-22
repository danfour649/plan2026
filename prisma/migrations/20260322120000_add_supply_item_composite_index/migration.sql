-- CreateIndex
CREATE INDEX "SupplyItem_planId_order_createdAt_idx" ON "SupplyItem"("planId", "order", "createdAt");
