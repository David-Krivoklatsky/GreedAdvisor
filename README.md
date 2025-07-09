# Greed Advisor

Moderná fullstack aplikácia pre bezpečné ukladanie API kľúčov pre OpenAI a Trading212.

## 🏗️ Architektúra

### Monorepo štruktúra

```
GreedAdvisor/
├── apps/
│   └── web/               # Next.js 14 aplikácia (App Router)
│       ├── app/           # Next.js App Router stránky a API
│       │   ├── api/       # API endpoints
│       │   ├── dashboard/ # Dashboard stránky
│       │   ├── login/     # Login stránka
│       │   └── register/  # Register stránka
│       ├── components/    # React komponenty
│       │   └── ui/        # shadcn/ui základné komponenty
│       └── lib/           # App-špecifické utilities
├── packages/              # Zdieľané balíčky
│   ├── db/               # Prisma databáza & klient
│   ├── auth/             # Autentifikácia (JWT, bcrypt)
│   ├── utils/            # Všeobecné utilities (cn, clsx)
│   ├── validations/      # Zod schémy a validácie
│   └── rate-limit/       # Rate limiting middleware
└── docs/                 # Dokumentácia
```

## 🛠️ Technológie

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui komponenty
- **Backend**: Next.js API Routes (fullstack)
- **Databáza**: PostgreSQL s Prisma ORM
- **Autentifikácia**: JWT tokeny (vlastný package)
- **Security**: bcrypt pre heslá, rate limiting
- **DevOps**: Docker, Turborepo monorepo

## 🚀 Rýchly štart

### 1. Nastavenie prostredia

```bash
# Klonuj repozitár
git clone <repository-url>
cd GreedAdvisor

# Nainštaluj závislosti
npm install
```

### 2. Spusti PostgreSQL databázu

```bash
# Spusti Docker container s PostgreSQL
npm run db:up
```

### 3. Nastavenie databázy

```bash
cd apps/web

# Vytvor .env súbor (skopíruj z .env.example)
cp .env.example .env

# Vygeneruj Prisma klienta
npm run generate

# Spusti migrácie
npm run migrate
```

### 4. Spusti vývojový server

```bash
# Z root zložky
npm run dev

# Alebo z apps/web
cd apps/web
npm run dev
```

Aplikácia bude dostupná na `http://localhost:3000`

## 📁 Štruktúra projektu

```
GreedAdvisor/
├── apps/
│   └── web/                 # Next.js aplikácia
│       ├── app/            # App Router pages
│       │   ├── api/        # API routes
│       │   ├── dashboard/  # Dashboard stránka
│       │   ├── login/      # Login stránka
│       │   └── register/   # Registračná stránka
│       ├── components/     # UI komponenty
│       ├── lib/           # Utility funkcie
│       └── prisma/        # Databázová schéma
├── docker-compose.yml     # PostgreSQL setup
└── package.json          # Monorepo konfigurácia
```

## 🔐 API Endpoints

### Autentifikácia

- `POST /api/auth/register` - Registrácia používateľa
- `POST /api/auth/login` - Prihlásenie používateľa
- `GET /api/me` - Získanie údajov používateľa (protected)

### API kľúče

- `PUT /api/api-keys` - Aktualizácia API kľúčov (protected)

## 🛡️ Bezpečnosť

### Rate Limiting

- 100 požiadaviek za 15 minút na IP adresu
- Implementované v memory (pre produkciu odporúčam Redis)

### Autentifikácia

- JWT tokeny s expiration time 7 dní
- Bearer token autentifikácia

### Heslá

- bcrypt hashing s salt rounds 12
- Minimum 6 znakov

## 🗄️ Databáza

### User model

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  openAiKey String?
  t212Key   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🎨 UI Komponenty

Používame **shadcn/ui** komponenty s Tailwind CSS:

- `Button` - Tlačidlá s rôznymi variantmi
- `Input` - Vstupné polia s validáciou
- `Card` - Kontajnery pre obsah
- `Label` - Popisky pre formuláre

## 🛠️ Dostupné skripty

```bash
# Development
npm run dev          # Spusti dev server
npm run build        # Build aplikácie
npm run lint         # ESLint kontrola

# Databáza
npm run db:up        # Spusti PostgreSQL
npm run db:down      # Zastavi PostgreSQL
npm run generate     # Vygeneruj Prisma klienta
npm run migrate      # Spusti migrácie

# Formatovanie
npm run format       # Prettier formatting
```

## 🌍 Environment Variables

V `apps/web/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/apikeys"
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 📝 Ďalšie možnosti rozšírenia

- [ ] Redis pre rate limiting
- [ ] Email verifikácia
- [ ] 2FA autentifikácia
- [ ] API key encryption
- [ ] Audit logging
- [ ] Role-based permissions
- [ ] API versioning
- [ ] Swagger dokumentácia

## 🤝 Príspevky

1. Fork repozitár
2. Vytvor feature branch
3. Commit zmeny
4. Push do branch
5. Otvor Pull Request

## 📄 Licencia

MIT License
