// PM2 process definitions for the BrainX Lab production deployment.
//
// This file intentionally contains NO secrets. Runtime secrets (GITHUB_PAT,
// DEPLOY_SECRET, ADMIN_PASSWORD, SESSION_SECRET, ...) live only in
// /home/ubuntu/brainx-lab/shared/.env.local, which is read by the app and by
// the deploy hook at runtime.
//
// Two processes are defined:
//   * brainx-lab       - the Next.js production server (loopback port 3101)
//   * brainx-lab-hook  - the deploy webhook/status server (loopback port 3102)
//
// The app runs from the `current` symlink, which points at the active release
// under releases/<sha>. Because PM2 can cache an absolute script path across
// reloads, deploy-vps.sh deliberately does `pm2 delete` + `pm2 start` for the
// app so the fresh `current` target is always resolved.

const path = require('node:path');

const BASE_DIR = process.env.BRAINX_BASE_DIR || '/home/ubuntu/brainx-lab';

module.exports = {
  apps: [
    {
      name: 'brainx-lab',
      cwd: path.join(BASE_DIR, 'current'),
      // Stable path through the `current` symlink, resolved at (re)start time.
      script: path.join(BASE_DIR, 'current', 'node_modules', 'next', 'dist', 'bin', 'next'),
      args: 'start --hostname 127.0.0.1 --port 3101',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '20s',
      max_memory_restart: '768M',
      kill_timeout: 10000,
      listen_timeout: 15000,
      env: {
        NODE_ENV: 'production',
        PORT: '3101',
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
        UPLOAD_DIR: '.uploads',
      },
    },
    {
      name: 'brainx-lab-hook',
      // Runs from the stable project root (not `current`) so it survives every
      // release switch. Only Node built-ins are required.
      cwd: BASE_DIR,
      script: path.join(BASE_DIR, 'deploy-hook.mjs'),
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        HOOK_HOST: '127.0.0.1',
        HOOK_PORT: '3102',
        BRAINX_BASE_DIR: BASE_DIR,
        BRAINX_HOOK_AUTOSTART: '1',
      },
    },
  ],
};
