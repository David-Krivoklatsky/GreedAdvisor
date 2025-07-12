# Greed Advisor

Modern fullstack application for secure storage of API keys for OpenAI and Trading212.

## 🏗️ Architecture

### Monorepo Structure

```
GreedAdvisor/
├── apps/
│   └── web/               # Next.js 14 application (App Router)
│       ├── app/           # Next.js App Router pages and API
│       │   ├── api/       # API endpoints
│       │   ├── dashboard/ # Dashboard pages
│       │   ├── login/     # Login page
│       │   └── register/  # Register page
│       ├── components/    # React components
│       │   └── ui/        # shadcn/ui base components
│       └── lib/           # App-specific utilities
├── packages/              # Shared packages
│   ├── db/               # Prisma database & client
│   ├── auth/             # Authentication (JWT, bcrypt)
│   ├── utils/            # General utilities (cn, clsx)
│   ├── validations/      # Zod schemas and validations
│   └── rate-limit/       # Rate limiting middleware
└── docs/                 # Documentation
```

## 🛠️ Technologies

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes (fullstack)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens (custom package)
- **Security**: bcrypt for passwords, rate limiting
- **DevOps**: Docker, Turborepo monorepo

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd GreedAdvisor

# Install dependencies
npm install
```

### 2. Start PostgreSQL Database

```bash
# Start Docker container with PostgreSQL
npm run db:up
```

### 3. Database Setup

```bash
cd apps/web

# Create .env file (copy from .env.example)
cp .env.example .env

# Generate Prisma client
npm run generate

# Run migrations
npm run migrate
```

### 4. Start Development Server

```bash
# From root folder
npm run dev

# Or from apps/web
cd apps/web
npm run dev
```

Application will be available at `http://localhost:3000`

## 📁 Project Structure

```
GreedAdvisor/
├── apps/
│   └── web/                 # Next.js application
│       ├── app/            # App Router pages
│       │   ├── api/        # API routes
│       │   ├── dashboard/  # Dashboard page
│       │   ├── login/      # Login page
│       │   └── register/   # Registration page
│       ├── components/     # UI components
│       ├── lib/           # Utility functions
│       └── prisma/        # Database schema
├── docker-compose.yml     # PostgreSQL setup
└── package.json          # Monorepo configuration
```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/me` - Get user data (protected)

### API Keys

- `PUT /api/api-keys` - Update API keys (protected)

## 🛡️ Security

### Rate Limiting

- 100 requests per 15 minutes per IP address
- Implemented in memory (Redis recommended for production)

### Authentication

- JWT tokens with 7-day expiration time
- Bearer token authentication

### Passwords

- bcrypt hashing with salt rounds 12
- Minimum 6 characters

## 🗄️ Database

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

## 🎨 UI Components

We use **shadcn/ui** components with Tailwind CSS:

- `Button` - Buttons with various variants
- `Input` - Input fields with validation
- `Card` - Content containers
- `Label` - Form labels

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build applications
npm run lint         # ESLint check

# Database
npm run db:up        # Start PostgreSQL
npm run db:down      # Stop PostgreSQL
npm run generate     # Generate Prisma client
npm run migrate      # Run migrations

# Formatting
npm run format       # Prettier formatting
```

## 🌍 Environment Variables

In `apps/web/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/apikeys"
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 📝 Future Extension Possibilities

- [ ] Redis for rate limiting
- [ ] Email verification
- [ ] 2FA authentication
- [ ] API key encryption
- [ ] Audit logging
- [ ] Role-based permissions
- [ ] API versioning
- [ ] Swagger documentation

## 🤝 Contributions

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License
