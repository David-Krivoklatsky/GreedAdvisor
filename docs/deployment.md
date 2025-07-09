# Deployment Guide

## Overview

This guide covers deploying Greed Advisor to various platforms. The application is built as a Next.js monorepo with PostgreSQL database.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Domain name (for production)

## Environment Setup

1. Copy `.env.example` to `.env.local` (development) or `.env.production` (production)
2. Update all environment variables:

```bash
# Required for all environments
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secure-random-string-32-chars-minimum"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE greedadvisor;
CREATE USER greedadvisor_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE greedadvisor TO greedadvisor_user;
```

### 2. Run Migrations

```bash
npm run db:migrate
npm run db:seed  # Optional: creates test user
```

## Deployment Options

### Option 1: Vercel (Recommended for MVP)

#### Prerequisites

- Vercel account
- PostgreSQL database (Supabase, Railway, Neon, etc.)

#### Steps

1. **Connect Repository**

   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`

3. **Build Settings**:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `apps/web/.next`
   - Install Command: `npm install`

4. **Database Setup**:
   ```bash
   # Run migrations on production database
   DATABASE_URL="your-prod-db-url" npm run db:migrate
   ```

#### Database Providers for Vercel:

- **Supabase**: Free tier with 500MB
- **Railway**: PostgreSQL with generous free tier
- **Neon**: Serverless PostgreSQL
- **Vercel Postgres**: Native integration

### Option 2: Railway

#### Prerequisites

- Railway account
- GitHub repository

#### Steps

1. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository
   - Select `apps/web` as root directory

2. **Add PostgreSQL**:
   - Add PostgreSQL service to your Railway project
   - Copy connection string to `DATABASE_URL`

3. **Environment Variables**:

   ```bash
   JWT_SECRET=your-secure-secret
   NEXT_PUBLIC_APP_URL=https://yourapp.railway.app
   ```

4. **Custom Start Command**:
   ```bash
   cd apps/web && npm run build && npm run start
   ```

### Option 3: AWS/Digital Ocean VPS

#### Prerequisites

- VPS with Node.js and PostgreSQL
- Domain name
- SSL certificate (Let's Encrypt)

#### Steps

1. **Server Setup**:

   ```bash
   # Install dependencies
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql nginx certbot

   # Clone repository
   git clone https://github.com/yourusername/greed-advisor.git
   cd greed-advisor
   npm install
   ```

2. **Database Setup**:

   ```bash
   sudo -u postgres createdb greedadvisor
   sudo -u postgres createuser greedadvisor_user
   sudo -u postgres psql -c "ALTER USER greedadvisor_user WITH PASSWORD 'secure_password';"
   sudo -u postgres psql -c "GRANT ALL ON DATABASE greedadvisor TO greedadvisor_user;"
   ```

3. **Environment Configuration**:

   ```bash
   cp apps/web/.env.example apps/web/.env.production
   # Edit .env.production with your values
   ```

4. **Build Application**:

   ```bash
   npm run build
   ```

5. **Process Manager (PM2)**:

   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

6. **Nginx Configuration**:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **SSL with Let's Encrypt**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

### Option 4: Docker Deployment

#### Prerequisites

- Docker and Docker Compose
- VPS or cloud instance

#### Steps

1. **Create Production Dockerfile**:

   ```dockerfile
   # apps/web/Dockerfile.prod
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY . .
   COPY --from=deps /app/node_modules ./node_modules
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production

   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nextjs -u 1001

   COPY --from=builder /app/apps/web/.next/standalone ./
   COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
   COPY --from=builder /app/apps/web/public ./apps/web/public

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000

   CMD ["node", "apps/web/server.js"]
   ```

2. **Update docker-compose for production**:

   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     web:
       build:
         context: .
         dockerfile: apps/web/Dockerfile.prod
       ports:
         - '3000:3000'
       environment:
         - DATABASE_URL=postgresql://user:password@db:5432/greedadvisor
         - JWT_SECRET=your-secure-secret
         - NODE_ENV=production
       depends_on:
         - db

     db:
       image: postgres:15
       environment:
         POSTGRES_DB: greedadvisor
         POSTGRES_USER: user
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - '5432:5432'

   volumes:
     postgres_data:
   ```

## Security Checklist

- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable database SSL in production
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Use strong database passwords
- [ ] Keep dependencies updated

## Monitoring

### Basic Health Check

```bash
curl https://yourdomain.com/api/health
```

### Database Health

```bash
curl https://yourdomain.com/api/health/db
```

### Recommended Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics, Google Analytics
- **Logs**: Vercel/Railway logs, CloudWatch

## Backup Strategy

### Database Backups

```bash
# Daily automated backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to S3 or similar
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Environment Backups

- Store environment variables securely
- Use secret management tools (AWS Secrets Manager, etc.)
- Document all configuration changes

## Rollback Plan

1. **Quick Rollback** (Vercel/Railway):
   - Use platform's instant rollback feature
   - Revert to previous deployment

2. **Database Rollback**:

   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup-20231209.sql
   ```

3. **Code Rollback**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

## Performance Optimization

### Production Checklist

- [ ] Enable Next.js compression
- [ ] Configure CDN for static assets
- [ ] Optimize images with Next.js Image component
- [ ] Set up database connection pooling
- [ ] Enable database query caching
- [ ] Monitor Core Web Vitals
- [ ] Set up proper caching headers

### Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```
