-- Add provider column to t212_api_keys to support multiple brokers (trading212 | alpaca)

ALTER TABLE "t212_api_keys" ADD COLUMN "provider" VARCHAR(20) NOT NULL DEFAULT 'trading212';

CREATE INDEX "t212_api_keys_provider_idx" ON "t212_api_keys"("provider");