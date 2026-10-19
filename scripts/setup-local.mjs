import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Local setup is disabled when NODE_ENV=production.');
}

let databaseUrl;
try {
  databaseUrl = new URL(process.env.DATABASE_URL ?? '');
} catch {
  throw new Error('Set a valid local DATABASE_URL in .env before setup.');
}

if (!['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname)) {
  throw new Error('Local setup only supports a loopback database.');
}

for (const key of ['DEMO_ADMIN_PASSWORD', 'DEMO_ORGANIZER_PASSWORD']) {
  const password = process.env[key] ?? '';
  if (password.length < 12 || password.startsWith('<')) {
    throw new Error(`${key} must be set to a local password of at least 12 characters.`);
  }
}

for (const args of [
  ['--filter', 'api', 'exec', 'prisma', 'migrate', 'deploy'],
  ['--filter', 'api', 'exec', 'prisma', 'generate'],
  ['--filter', 'api', 'run', 'seed:demo'],
  ['seed:events'],
]) {
  const result = spawnSync('corepack', ['pnpm', ...args], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}
