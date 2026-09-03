# Dashboard Refactoring

The dashboard page (`apps/web/app/dashboard/page.tsx`) was split into focused components/hooks.

## Structure

```
apps/web/
├── types/dashboard.ts          # Shared types
├── constants/dashboard.ts      # Static options (symbols, report types, mocks)
├── hooks/
│   ├── useDashboardData.ts     # Data fetching (user, keys, positions, market keys, notifications)
│   ├── useAiReport.ts          # AI report generation logic
│   └── index.ts
└── components/dashboard/
    ├── market-analysis.tsx     # Symbol/provider selection + TradingView chart
    ├── ai-report-generator.tsx # Report form (symbol, type, keys, generate)
    ├── positions-panel.tsx     # Position cards with P&L, status
    ├── dashboard-panels.tsx    # Resizable layout wrapper
    └── index.ts
```

## Key Points

- **Before**: ~620 lines in `page.tsx`
- **After**: ~80 lines in `page.tsx` + focused modules
- **Separation**: Types → Constants → Hooks (data/logic) → Components (UI)
- **Reusable**: Hooks/components can be used elsewhere
- **Testable**: Logic isolated in hooks

## Migration Summary

| Extracted          | Lines | Destination                                    |
| ------------------ | ----- | ---------------------------------------------- |
| Types              | ~50   | `types/dashboard.ts`                           |
| Constants          | ~40   | `constants/dashboard.ts`                       |
| Data fetching      | ~100  | `hooks/useDashboardData.ts`                    |
| AI report logic    | ~80   | `hooks/useAiReport.ts`                         |
| Market analysis UI | ~150  | `components/dashboard/market-analysis.tsx`     |
| AI report UI       | ~120  | `components/dashboard/ai-report-generator.tsx` |
| Positions UI       | ~90   | `components/dashboard/positions-panel.tsx`     |
