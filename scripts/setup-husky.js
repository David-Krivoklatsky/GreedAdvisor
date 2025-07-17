#!/usr/bin/env node

// Skip Husky installation in CI environments
if (process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS) {
  console.log('CI environment detected, skipping Husky installation.');
  process.exit(0);
}

// Try to install Husky in local development
try {
  const { execSync } = require('child_process');
  execSync('husky install', { stdio: 'inherit' });
} catch {
  console.log('Husky not available, skipping installation...');
}
