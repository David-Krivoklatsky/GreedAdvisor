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
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/greed-advisor.git',
      path: '/var/www/greed-advisor',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
