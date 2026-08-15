-- AlterTable
ALTER TABLE "t212_api_keys" ADD COLUMN "apiSecret" TEXT NOT NULL DEFAULT '',
ADD COLUMN "environment" VARCHAR(20) NOT NULL DEFAULT 'demo';

-- Backfill any existing rows: apiSecret from apiKey (best effort placeholder)
UPDATE "t212_api_keys" SET "apiSecret" = "apiKey" WHERE "apiSecret" = '';