#!/bin/bash

# CI Environment Setup Script
# This script sets up the necessary environment variables for GitHub Actions

echo "Setting up CI environment variables..."

# Define default values for CI
CI_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/greed_advisor_test"
CI_JWT_SECRET="test-jwt-secret-for-ci-environment-only"
CI_NEXTAUTH_SECRET="test-nextauth-secret-for-ci-environment"
CI_ENCRYPTION_KEY="test-encryption-key-32-characters"

# Check if we're in CI environment
if [ "$CI" = "true" ]; then
    echo "Running in CI environment"
    
    # Export environment variables for CI
    export DATABASE_URL="${DATABASE_URL:-$CI_DATABASE_URL}"
    export JWT_SECRET="${JWT_SECRET:-$CI_JWT_SECRET}"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$CI_NEXTAUTH_SECRET}"
    export ENCRYPTION_KEY="${ENCRYPTION_KEY:-$CI_ENCRYPTION_KEY}"
    export NODE_ENV="${NODE_ENV:-test}"
    
    # Create .env files for different packages
    echo "Creating .env files for CI..."
    
    # Root .env
    cat > .env << EOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
NODE_ENV=${NODE_ENV}
EOF
    
    # packages/db/.env
    mkdir -p packages/db
    echo "DATABASE_URL=${DATABASE_URL}" > packages/db/.env
    
    # apps/web/.env
    mkdir -p apps/web
    cat > apps/web/.env << EOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
NODE_ENV=${NODE_ENV}
EOF
    
    echo "Environment variables set for CI"
    echo "DATABASE_URL: $DATABASE_URL"
    echo "NODE_ENV: $NODE_ENV"
else
    echo "Not running in CI environment"
    
    # Check if .env file exists
    if [ -f ".env" ]; then
        echo ".env file found"
        source .env
    else
        echo "Warning: .env file not found"
    fi
fi

echo "Environment setup complete"
