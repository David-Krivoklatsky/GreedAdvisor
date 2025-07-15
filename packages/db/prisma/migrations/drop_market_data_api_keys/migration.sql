-- Drop market data api keys table
DROP TABLE IF EXISTS "market_data_api_keys";

-- Remove foreign key constraint from users table (if it exists)
-- Note: Since we already removed the relation from the schema, this should not be necessary
-- but we include it for completeness in case there are any leftover references
