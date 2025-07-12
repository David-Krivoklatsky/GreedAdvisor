-- CreateTable
CREATE TABLE "market_data_api_keys" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "market_data_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_data_api_keys_userId_idx" ON "market_data_api_keys"("userId");

-- CreateIndex
CREATE INDEX "market_data_api_keys_provider_idx" ON "market_data_api_keys"("provider");

-- CreateIndex
CREATE INDEX "market_data_api_keys_isActive_idx" ON "market_data_api_keys"("isActive");

-- AddForeignKey
ALTER TABLE "market_data_api_keys" ADD CONSTRAINT "market_data_api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
