# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+
- Docker Desktop
- Git

## Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd GreedAdvisor
```

### 2. Start PostgreSQL Database

```bash
npm run db:up
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set up Database

```bash
cd apps/web
cp .env.example .env
npm run generate
npm run db:push
```

### 5. Start Application

```bash
npm run dev
```

Application will be available at `http://localhost:3001`

## 📋 Testing Functionality

### 1. New User Registration

- Go to `/register`
- Fill in email and password (min. 6 characters)
- Click "Create account"

### 2. Login

- Go to `/login`
- Enter your login credentials
- Click "Sign in"

### 3. API Key Management

- After login go to dashboard (`/dashboard`)
- Add your OpenAI and Trading212 API keys
- Click "Update API Keys"

## 🔧 Useful Commands

```bash
# Stop database
npm run db:down

# Restart database
npm run db:down && npm run db:up

# Format code
npm run format

# Check syntax
npm run lint

# Build application
npm run build
```

## 🗄️ Database

### Pripojenie k PostgreSQL

```bash
Host: localhost
Port: 5433
Database: apikeys
Username: user
Password: password
```

### Prisma Studio (GUI for database)

```bash
cd apps/web
npx prisma studio
```

## 🛡️ Security Features

- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation (Zod)
- ✅ CORS middleware

## 📝 API Documentation

### POST /api/auth/register

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/login

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /api/me

Headers: `Authorization: Bearer <token>`

### PUT /api/api-keys

Headers: `Authorization: Bearer <token>`

```json
{
  "openAiKey": "sk-...",
  "t212Key": "your-t212-key"
}
```

## 🚨 Troubleshooting

### Port 5432 already in use

```bash
# Change port in docker-compose.yml to 5433
# Already set in this project
```

### TypeScript errors

```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### Prisma problems

```bash
# Reset database
cd apps/web
npx prisma db push --force-reset
```

## 🎨 UI Customization

Project uses **shadcn/ui** + **Tailwind CSS**.

Components are in `components/ui/`:

- `Button` - buttons
- `Input` - input fields
- `Card` - containers
- `Label` - labels

### Adding new component

```bash
# Using shadcn CLI
npx shadcn-ui@latest add <component-name>
```

## 📈 Production Deployment

### CI/CD with GitHub Actions

The project includes automated CI/CD pipeline that runs on every push to `main` or `develop` branches.

#### Environment Variables for GitHub Actions

The CI pipeline automatically sets up test environment variables:

- `DATABASE_URL`: Points to PostgreSQL test database
- `JWT_SECRET`: Test JWT secret
- `NEXTAUTH_SECRET`: Test NextAuth secret
- `ENCRYPTION_KEY`: Test encryption key

#### Fixing CI Migration Issues

If you encounter database migration errors in GitHub Actions:

1. **Check PostgreSQL Service**: The CI config includes PostgreSQL service that should start automatically
2. **Environment Variables**: All required env vars are set in the workflow
3. **Database Readiness**: The workflow waits for PostgreSQL to be ready before running migrations

#### Manual CI Debugging

To debug CI issues locally:

```bash
# Simulate CI environment
export CI=true
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/greed_advisor_test"
export JWT_SECRET="test-jwt-secret-for-ci-environment-only"

# Start local PostgreSQL (if not using Docker)
npm run db:up

# Run migration
npm run db:migrate
```

### Vercel (recommended)

1. Push to GitHub
2. Connect Vercel to repository
3. Set environment variables
4. Automatic deployment

### Environment variables for production

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="super-secret-production-key"
NEXTAUTH_URL="https://yourdomain.com"
```
