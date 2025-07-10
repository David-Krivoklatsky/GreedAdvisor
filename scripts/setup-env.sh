#!/bin/bash

# CI Environment Setup Script
# This script sets up the necessary environment variables for GitHub Actions

echo "Setting up CI environment variables..."

# Check if we're in CI environment
if [ "$CI" = "true" ]; then
    echo "Running in CI environment"
    
    # Export environment variables for CI
    export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/greed_advisor_test}"
    export JWT_SECRET="${JWT_SECRET:-test-jwt-secret-for-ci-environment-only}"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-test-nextauth-secret-for-ci-environment}"
    export ENCRYPTION_KEY="${ENCRYPTION_KEY:-test-encryption-key-32-characters}"
    export NODE_ENV="${NODE_ENV:-test}"
    
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
