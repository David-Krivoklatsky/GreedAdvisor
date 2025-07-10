# CI/CD Troubleshooting Guide

## Database Migration Errors in GitHub Actions

### Common Error: "Environment variable not found: DATABASE_URL"

**Problem**: The migration fails because `DATABASE_URL` is not available to the Prisma process in the CI environment, even when environment variables are set at the workflow level.

**Root Cause**: Turbo runs the migration in the `packages/db` directory, and environment variables may not propagate correctly to the Prisma process.

**Solution**: The updated CI workflow now:

1. **Creates .env files**: Instead of relying only on environment variables, the workflow creates actual `.env` files
2. **Uses setup script**: A dedicated `scripts/setup-env.sh` script handles environment setup
3. **Configures Turbo**: The `turbo.json` is configured to pass environment variables to database tasks

### Updated CI Workflow Steps

The workflow now includes these key steps:

1. **PostgreSQL Service**: Starts automatically with health checks
2. **Environment Setup**: Uses `scripts/setup-env.sh` to create `.env` files:

   ```bash
   - name: Setup environment files for CI
     run: |
       chmod +x scripts/setup-env.sh
       ./scripts/setup-env.sh
     env:
       CI: true
       DATABASE_URL: postgresql://postgres:postgres@localhost:5432/greed_advisor_test
       JWT_SECRET: test-jwt-secret-for-ci-environment-only
       NEXTAUTH_SECRET: test-nextauth-secret-for-ci-environment
       ENCRYPTION_KEY: test-encryption-key-32-characters
   ```

3. **Environment Verification**: Checks that `.env` files are created correctly
4. **Database Migration**: Runs with environment variables available

### Turbo Configuration

The `turbo.json` now includes environment variable configuration:

```json
"db:migrate": {
  "cache": false,
  "env": ["DATABASE_URL", "JWT_SECRET", "NEXTAUTH_SECRET", "ENCRYPTION_KEY"]
}
```

3. **Database Readiness Check**:
   The workflow includes a step that waits for PostgreSQL to be ready:
   ```yaml
   - name: Wait for PostgreSQL to be ready
     run: |
       for i in {1..30}; do
         if pg_isready -h localhost -p 5432 -U postgres; then
           echo "PostgreSQL is ready"
           break
         fi
         echo "Waiting for PostgreSQL... attempt $i"
         sleep 2
       done
   ```

### Steps to Fix CI Issues

1. **Ensure PostgreSQL Service is Running**:
   - Check that the `services` section in `.github/workflows/ci.yml` is properly configured
   - Verify the health check is working

2. **Check Environment Variables**:
   - All required environment variables are set in the workflow
   - Variables are consistent across all steps that need them

3. **Migration Order**:
   - Database migration runs after dependencies are installed
   - Migration runs before tests that might depend on the database

4. **Local Testing**:

   ```bash
   # Test the exact same environment locally
   docker run -d --name test-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=greed_advisor_test -p 5432:5432 postgres:15

   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/greed_advisor_test"
   npm run db:migrate
   ```

## GitHub Secrets vs Environment Variables

For **production deployments**, use GitHub Secrets:

- Go to Repository Settings → Secrets and Variables → Actions
- Add production DATABASE_URL as a secret
- Reference it in deployment workflow: `${{ secrets.DATABASE_URL }}`

For **CI testing**, use hardcoded environment variables in the workflow (as shown above).

## Debugging Steps

1. **Check CI Logs**:
   - Look for PostgreSQL startup messages
   - Verify environment variable values (non-sensitive ones)
   - Check migration output

2. **Test Locally**:
   - Use the same PostgreSQL version (15)
   - Use the same environment variables
   - Run the same commands

3. **Validate Prisma Schema**:

   ```bash
   npx prisma validate
   ```

4. **Check Database Connection**:
   ```bash
   npx prisma db push --preview-feature
   ```

## Common Solutions

1. **PostgreSQL Service Not Ready**:
   - Add longer wait time in the readiness check
   - Increase health check intervals

2. **Environment Variable Scope**:
   - Ensure environment variables are set for the correct job/step
   - Use `$GITHUB_ENV` for persistent environment variables

3. **Database Name Mismatch**:
   - Ensure database name in `DATABASE_URL` matches the one created by PostgreSQL service
   - Default is `greed_advisor_test` in CI

4. **Prisma Generate Issues**:
   - Add explicit `prisma generate` step before migration if needed
   - Ensure `@prisma/client` is properly installed
