# Contributing

## Quick Start

```bash
git clone https://github.com/David-Krivoklatsky/GreedAdvisor.git
cd GreedAdvisor
npm install
npm run db:up
npm run db:generate && npm run db:push
npm run dev
```

## Workflow

1. **Create issue** → describe the change
2. **Branch from `develop`** → `git checkout -b feat/my-feature develop`
3. **Make changes** → follow code style below
4. **Test** → `npm run test && npm run lint && npm run type-check`
5. **Commit** → Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
6. **Push & PR** → target `develop`

## Code Style

- TypeScript strict, `@/*` maps to `apps/web/*`
- ESLint + Prettier (run `npm run format` before commit)
- Small, focused functions; explicit types for public APIs
- No comments unless requested

## Testing

- Jest in `apps/web`
- Single test: `cd apps/web && npx jest __tests__/api/auth/register.test.ts`
- Add tests for new features

## Package Conventions

Each `@greed-advisor/*` package:

- `main: index.ts` (raw TS, no build)
- Exports types + runtime code
- Tests in `__tests__/`
- Update `apps/web/next.config.js` (`transpilePackages`), `tsconfig.json` (`paths`), `jest.config.js` (`moduleNameMapper`) when adding new packages

## Commit Message Format

```
<type>(<scope>): <subject>

<body (optional)>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

Example: `feat(engine): add trailing stop logic`
