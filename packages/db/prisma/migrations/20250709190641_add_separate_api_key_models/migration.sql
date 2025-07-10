/*
  Warnings:

  - You are about to drop the column `openAiKey` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `t212Key` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "openAiKey",
DROP COLUMN "t212Key",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "firstName" VARCHAR(100),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "lastName" VARCHAR(100),
ADD COLUMN     "name" VARCHAR(255),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "keyType" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_api_keys" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ai_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t212_api_keys" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "apiKey" TEXT NOT NULL,
    "accessType" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "t212_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "api_key_logs_userId_idx" ON "api_key_logs"("userId");

-- CreateIndex
CREATE INDEX "api_key_logs_keyType_idx" ON "api_key_logs"("keyType");

-- CreateIndex
CREATE INDEX "api_key_logs_action_idx" ON "api_key_logs"("action");

-- CreateIndex
CREATE INDEX "api_key_logs_createdAt_idx" ON "api_key_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_api_keys_userId_idx" ON "ai_api_keys"("userId");

-- CreateIndex
CREATE INDEX "ai_api_keys_provider_idx" ON "ai_api_keys"("provider");

-- CreateIndex
CREATE INDEX "ai_api_keys_isActive_idx" ON "ai_api_keys"("isActive");

-- CreateIndex
CREATE INDEX "t212_api_keys_userId_idx" ON "t212_api_keys"("userId");

-- CreateIndex
CREATE INDEX "t212_api_keys_accessType_idx" ON "t212_api_keys"("accessType");

-- CreateIndex
CREATE INDEX "t212_api_keys_isActive_idx" ON "t212_api_keys"("isActive");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_logs" ADD CONSTRAINT "api_key_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_api_keys" ADD CONSTRAINT "ai_api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t212_api_keys" ADD CONSTRAINT "t212_api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
