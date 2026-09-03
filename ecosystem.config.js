module.exports = {
  apps: [
    {
      name: 'greed-advisor',
      cwd: './apps/web',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Restart settings
      watch: false,
      max_memory_restart: '1G',

      // Logging
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Health monitoring
      min_uptime: '10s',
      max_restarts: 5,

      // Process management
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Environment-specific settings
      node_args: '--max-old-space-size=1024'
    },
    {
      // Autonomous trading engine. MUST stay a single fork instance — the
      // engine uses Postgres advisory locks + persisted `nextRunAt`, but
      // running more than one scheduler would still be unsafe.
      name: 'greed-advisor-engine',
      cwd: './packages/engine',
      script: 'npm',
      args: 'run start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        ENGINE_ENABLED: '1'
      },
      watch: false,
      max_memory_restart: '512M',
      log_file: './logs/engine.log',
      out_file: './logs/engine-out.log',
      error_file: './logs/engine-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      min_uptime: '10s',
      max_restarts: 5,
      kill_timeout: 5000
    }
  ]
};
