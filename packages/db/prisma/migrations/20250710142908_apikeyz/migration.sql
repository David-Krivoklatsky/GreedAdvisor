-- AlterTable
ALTER TABLE "ai_api_keys" ADD COLUMN     "lastUsed" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "t212_api_keys" ADD COLUMN     "lastUsed" TIMESTAMP(3);
