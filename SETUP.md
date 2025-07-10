# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+
- Docker Desktop
- Git

## Setup Instructions

### 1. Klonuj repozitár

```bash
git clone <your-repository-url>
cd GreedAdvisor
```

### 2. Spusti PostgreSQL databázu

```bash
npm run db:up
```

### 3. Nainštaluj závislosti

```bash
npm install
```

### 4. Nastav databázu

```bash
cd apps/web
cp .env.example .env
npm run generate
npm run db:push
```

### 5. Spusti aplikáciu

```bash
npm run dev
```

Aplikácia bude dostupná na `http://localhost:3001`

## 📋 Testovanie funkcionalít

### 1. Registrácia nového používateľa

- Choď na `/register`
- Vyplň email a heslo (min. 6 znakov)
- Klikni "Create account"

### 2. Prihlásenie

- Choď na `/login`
- Zadaj svoje prihlasovacie údaje
- Klikni "Sign in"

### 3. Správa API kľúčov

- Po prihlásení si na dashboard (`/dashboard`)
- Pridaj svoje OpenAI a Trading212 API kľúče
- Klikni "Update API Keys"

## 🔧 Užitočné príkazy

```bash
# Zastavenie databázy
npm run db:down

# Reštart databázy
npm run db:down && npm run db:up

# Formátovanie kódu
npm run format

# Kontrola syntaxe
npm run lint

# Build aplikácie
npm run build
```

## 🗄️ Databáza

### Pripojenie k PostgreSQL

```bash
Host: localhost
Port: 5433
Database: apikeys
Username: user
Password: password
```

### Prisma Studio (GUI pre databázu)

```bash
cd apps/web
npx prisma studio
```

## 🛡️ Bezpečnostné funkcie

- ✅ JWT autentifikácia
- ✅ bcrypt hashovanie hesiel
- ✅ Rate limiting (100 req/15min)
- ✅ Validácia vstupov (Zod)
- ✅ CORS middleware

## 📝 API Dokumentácia

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

## 🚨 Riešenie problémov

### Port 5432 už používaný

```bash
# Zmení port v docker-compose.yml na 5433
# Už je nastavené v tomto projekte
```

### TypeScript chyby

```bash
# Reštartuj TypeScript server v VS Code
Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### Prisma problémy

```bash
# Resetuj databázu
cd apps/web
npx prisma db push --force-reset
```

## 🎨 Prispôsobenie UI

Projekt používa **shadcn/ui** + **Tailwind CSS**.

Komponenty sú v `components/ui/`:

- `Button` - tlačidlá
- `Input` - vstupné polia
- `Card` - kontajnery
- `Label` - popisky

### Pridanie novej komponenty

```bash
# Pomocou shadcn CLI
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

### Vercel (odporúčané)

1. Push do GitHub
2. Pripoj Vercel k repozitáru
3. Nastav environment variables
4. Deploy automaticky

### Environment variables pre produkciu

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="super-secret-production-key"
NEXTAUTH_URL="https://yourdomain.com"
```
