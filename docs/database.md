# Database Schema

Prisma schema: `packages/db/prisma/schema.prisma`

## Core Models

### User

```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  passwordHash  String
  accessToken   String?   @unique
  refreshToken  String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  apiKeys       ApiKey[]
  automation    AutomationConfig[]
  watchlist     WatchlistItem[]
  dailyStats    DailyStat[]
  positions     Position[]
  notifications Notification[]
}
```

### ApiKey (encrypted at rest)

```prisma
model ApiKey {
  id        Int      @id @default(autoincrement())
  userId    Int
  provider  String   // "openai" | "twelvedata" | "trading212" | "alpaca"
  keyEnc    String   // "enc:v1:..." AES-256-GCM
  label     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, provider])
}
```

### AutomationConfig

```prisma
model AutomationConfig {
  id                Int      @id @default(autoincrement())
  userId            Int
  name              String
  market            String   // "us" | "eu" | "crypto"
  strategy          String   // "momentum" | "trend" | "mean_reversion" | "breakout" | "scalp" | "swing"
  symbols           String[] // user-defined universe
  execution         String   // "auto" | "approval"
  maxDailySpendPct  Float    // % of cash/day
  stopOnLoss        Float?   // auto-disable on daily loss %
  manageStops       Boolean  @default(false)
  allowLive         Boolean  @default(false)
  enabled           Boolean  @default(true)
  nextRunAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  runs              AutomationRun[]
}
```

### Position + AutomationRun + AutomationRunStep

```prisma
model Position {
  id              Int      @id @default(autoincrement())
  userId          Int
  automationId    Int?
  symbol          String
  qty             Float
  avgEntry        Float
  currentPrice    Float?
  unrealizedPnl   Float?
  realizedPnl     Float    @default(0)
  status          String   // "open" | "closed" | "pending_approval"
  stopPrice       Float?
  trailPrice      Float?
  openedAt        DateTime @default(now())
  closedAt        DateTime?

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  automation      AutomationConfig? @relation(fields: [automationId], references: [id], onDelete: SetNull)
}

model AutomationRun {
  id            Int      @id @default(autoincrement())
  automationId  Int
  status        String   // "success" | "partial" | "failed" | "no_signal"
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  error         String?
  steps         AutomationRunStep[]
}

model AutomationRunStep {
  id        Int      @id @default(autoincrement())
  runId     Int
  step      String   // "analyze" | "signal" | "approve" | "execute" | "reconcile" | "manage_stops"
  status    String   // "ok" | "failed" | "skipped"
  payload   Json?
  error     String?
  createdAt DateTime @default(now())
}
```

## Key Points

- **API keys encrypted**: `enc:v1:...` format, decrypted at point of use via `@greed-advisor/crypto`
- **Migration strategy**: `npm run db:push` (no `migrate deploy`; migration history is broken)
- **Engine safety**: Advisory locks + `nextRunAt` guardrails + per-bot `maxDailySpendPct` / `stopOnLoss`
