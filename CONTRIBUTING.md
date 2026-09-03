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

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat: add user authentication system
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user service
feat(engine): add trailing stop logic
```

## Pull Request Process

1. **Update Documentation**: Ensure any public API changes are documented.
2. **Update Tests**: Add or update tests for your changes.
3. **Update CHANGELOG**: Add an entry to CHANGELOG.md describing your changes.
4. **PR Description**: Provide a clear description of what changed, why, and how to test.
5. **Review Process**: All PRs require at least one review; ensure CI checks pass.
6. **Merge**: Once approved, the PR will be merged by a maintainer.

## Package Structure

When contributing to packages, follow these guidelines:

- Each package should have a clear, single responsibility
- Include proper TypeScript types
- Add comprehensive tests
- Update package documentation

### Adding New Packages

1. Create the package directory in `packages/`
2. Add `package.json` with proper dependencies
3. Include TypeScript configuration
4. Add tests and documentation
5. Update the workspace configuration

## Questions?

If you have questions about contributing, please:

1. Check existing issues and discussions
2. Create a new issue with the `question` label
3. Reach out to the maintainers

Thank you for contributing to Greed Advisor!!!
