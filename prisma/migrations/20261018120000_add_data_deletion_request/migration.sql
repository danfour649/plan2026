-- CreateTable
CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL,
    "confirmationCode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataDeletionRequest_confirmationCode_key" ON "DataDeletionRequest"("confirmationCode");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_provider_providerAccountId_idx" ON "DataDeletionRequest"("provider", "providerAccountId");
