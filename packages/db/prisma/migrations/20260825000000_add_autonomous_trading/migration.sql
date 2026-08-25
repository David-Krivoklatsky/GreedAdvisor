-- CreateTable
CREATE TABLE "automation_configs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" VARCHAR(20) NOT NULL DEFAULT 'advisory',
    "allowLive" BOOLEAN NOT NULL DEFAULT false,
    "scanIntervalMinutes" INTEGER NOT NULL DEFAULT 5,
    "universe" VARCHAR(30) NOT NULL DEFAULT 'watchlist',
    "maxCandidates" INTEGER NOT NULL DEFAULT 5,
    "maxPositions" INTEGER NOT NULL DEFAULT 10,
    "maxRiskPerTradePct" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "dailyLossLimitPct" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "maxDailyTrades" INTEGER NOT NULL DEFAULT 5,
    "confidenceThreshold" INTEGER NOT NULL DEFAULT 70,
    "respectPdt" BOOLEAN NOT NULL DEFAULT true,
    "flattenAtClose" BOOLEAN NOT NULL DEFAULT false,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 30,
    "orderType" VARCHAR(20) NOT NULL DEFAULT 'MARKET',
    "slippageTolerancePct" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "extendedHours" BOOLEAN NOT NULL DEFAULT false,
    "tradingKeyId" INTEGER,
    "aiKeyId" INTEGER,
    "marketDataKeyId" INTEGER,
    "model" VARCHAR(100),
    "telegramChatId" VARCHAR(255),
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "automation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_signals" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "automationConfigId" INTEGER,
    "symbol" VARCHAR(50) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "recommendation" VARCHAR(20) NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "analysis" JSONB,
    "entryPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "positionSize" DOUBLE PRECISION,
    "riskAmount" DOUBLE PRECISION,
    "riskPerUnit" DOUBLE PRECISION,
    "report" JSONB NOT NULL,
    "marketSnapshot" JSONB,
    "news" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "source" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "provider" VARCHAR(50),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actedAt" TIMESTAMP(3),

    CONSTRAINT "trade_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_records" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "automationConfigId" INTEGER,
    "signalId" INTEGER,
    "tradingKeyId" INTEGER NOT NULL,
    "symbol" VARCHAR(50) NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "orderType" VARCHAR(20) NOT NULL DEFAULT 'MARKET',
    "orderId" VARCHAR(100) NOT NULL,
    "clientOrderId" VARCHAR(128),
    "entryPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "stopOrderId" VARCHAR(100),
    "takeProfitOrderId" VARCHAR(100),
    "status" VARCHAR(30) NOT NULL,
    "reason" VARCHAR(255),
    "filledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filledAvgPrice" DOUBLE PRECISION,
    "exitPrice" DOUBLE PRECISION,
    "realizedPnl" DOUBLE PRECISION,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_run_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "automationConfigId" INTEGER,
    "status" VARCHAR(30) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "details" JSONB,

    CONSTRAINT "automation_run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "automationConfigId" INTEGER,
    "date" DATE NOT NULL,
    "startEquity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "realizedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unrealizedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "dayTradeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_configs_userId_idx" ON "automation_configs"("userId");

-- CreateIndex
CREATE INDEX "automation_configs_enabled_idx" ON "automation_configs"("enabled");

-- CreateIndex
CREATE INDEX "automation_configs_mode_idx" ON "automation_configs"("mode");

-- CreateIndex
CREATE INDEX "trade_signals_userId_idx" ON "trade_signals"("userId");

-- CreateIndex
CREATE INDEX "trade_signals_automationConfigId_idx" ON "trade_signals"("automationConfigId");

-- CreateIndex
CREATE INDEX "trade_signals_status_idx" ON "trade_signals"("status");

-- CreateIndex
CREATE INDEX "trade_signals_symbol_idx" ON "trade_signals"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "trade_records_signalId_key" ON "trade_records"("signalId");

-- CreateIndex
CREATE INDEX "trade_records_userId_idx" ON "trade_records"("userId");

-- CreateIndex
CREATE INDEX "trade_records_automationConfigId_idx" ON "trade_records"("automationConfigId");

-- CreateIndex
CREATE INDEX "trade_records_status_idx" ON "trade_records"("status");

-- CreateIndex
CREATE INDEX "trade_records_symbol_idx" ON "trade_records"("symbol");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "automation_run_logs_userId_idx" ON "automation_run_logs"("userId");

-- CreateIndex
CREATE INDEX "automation_run_logs_automationConfigId_idx" ON "automation_run_logs"("automationConfigId");

-- CreateIndex
CREATE INDEX "daily_stats_userId_idx" ON "daily_stats"("userId");

-- CreateIndex
CREATE INDEX "daily_stats_date_idx" ON "daily_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_userId_automationConfigId_date_key" ON "daily_stats"("userId", "automationConfigId", "date");

-- AddForeignKey
ALTER TABLE "automation_configs" ADD CONSTRAINT "automation_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_signals" ADD CONSTRAINT "trade_signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_signals" ADD CONSTRAINT "trade_signals_automationConfigId_fkey" FOREIGN KEY ("automationConfigId") REFERENCES "automation_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_records" ADD CONSTRAINT "trade_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_records" ADD CONSTRAINT "trade_records_automationConfigId_fkey" FOREIGN KEY ("automationConfigId") REFERENCES "automation_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_records" ADD CONSTRAINT "trade_records_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "trade_signals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_run_logs" ADD CONSTRAINT "automation_run_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_run_logs" ADD CONSTRAINT "automation_run_logs_automationConfigId_fkey" FOREIGN KEY ("automationConfigId") REFERENCES "automation_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_automationConfigId_fkey" FOREIGN KEY ("automationConfigId") REFERENCES "automation_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;