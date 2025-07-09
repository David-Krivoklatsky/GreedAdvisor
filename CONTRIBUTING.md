# Contributing to Greed Advisor

Thank you for your interest in contributing to Greed Advisor! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature/fix
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 10 or higher
- PostgreSQL 15 or higher
- Docker (optional, for database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/greed-advisor.git
cd greed-advisor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the database:
```bash
npm run db:up
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run dev
```

## Contribution Workflow

1. **Create an Issue**: Before starting work, create or comment on an issue describing the feature or bug fix.

2. **Create a Branch**: Create a new branch from `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

3. **Make Changes**: Implement your changes following our code style guidelines.

4. **Test Your Changes**: Ensure all tests pass and add new tests if necessary:
```bash
npm run test
npm run lint
npm run type-check
```

5. **Commit Your Changes**: Use our commit convention:
```bash
git commit -m "feat: add new user registration validation"
```

6. **Push and Create PR**: Push your branch and create a pull request.

## Code Style

We use ESLint and Prettier for code formatting. Please ensure your code follows these guidelines:

- Use TypeScript for all new code
- Follow the existing code structure and naming conventions
- Add proper type annotations
- Include JSDoc comments for public APIs
- Keep functions small and focused

### Running Code Quality Checks

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format
```

## Testing

We use Jest for unit testing and integration testing. Please ensure:

- All new features have corresponding tests
- Existing tests continue to pass
- Aim for good test coverage

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

## Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat: add user authentication system
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user service
```

## Pull Request Process

1. **Update Documentation**: Ensure any public API changes are documented.

2. **Update Tests**: Add or update tests for your changes.

3. **Update CHANGELOG**: Add an entry to CHANGELOG.md describing your changes.

4. **PR Description**: Provide a clear description of:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes

5. **Review Process**: 
   - All PRs require at least one review
   - Address any feedback promptly
   - Ensure CI checks pass

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

Thank you for contributing to Greed Advisor!
