import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staging = await mkdtemp(join(tmpdir(), 'postigo-vercel-local-'));
const globalConfig = join(staging, '.vercel-global');
const entries = ['api', 'public', 'src', 'astro.config.mjs', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json'];

for (const entry of entries) {
  await cp(join(repository, entry), join(staging, entry), { recursive: true });
}
await symlink(join(repository, 'node_modules'), join(staging, 'node_modules'), 'junction');
await mkdir(globalConfig);
await writeFile(join(staging, 'astro-vercel-dev.mjs'), `
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const port = process.env.PORT;
if (!port || !/^\\d+$/.test(port)) throw new Error('Vercel did not provide a valid PORT');
const cli = fileURLToPath(new URL('./node_modules/astro/bin/astro.mjs', import.meta.url));
const child = spawn(process.execPath, [cli, 'dev', '--ignore-lock', '--host', '127.0.0.1', '--port', port], { stdio: 'inherit', env: { ...process.env, ASTRO_DEV_BACKGROUND: '0' } });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.once('exit', (code) => { process.exitCode = code ?? 1; });
`);
await writeFile(join(staging, 'vercel.json'), JSON.stringify({
  framework: 'astro',
  installCommand: 'pnpm install --frozen-lockfile',
  buildCommand: 'pnpm build',
  devCommand: 'node astro-vercel-dev.mjs',
}, null, 2));

const cli = join(repository, 'node_modules', 'vercel', 'dist', 'vc.js');
const environment = { ...process.env };
delete environment.VERCEL_TOKEN;
delete environment.VERCEL_ORG_ID;
delete environment.VERCEL_PROJECT_ID;
environment.ASTRO_DEV_BACKGROUND = '0';

const child = spawn(process.execPath, [
  cli,
  'dev',
  '--local',
  '--global-config', globalConfig,
  '--listen', '127.0.0.1:3001',
], { cwd: staging, env: environment, stdio: 'inherit' });

let cleaning = false;
async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  const safePrefix = join(tmpdir(), 'postigo-vercel-local-');
  if (!staging.startsWith(safePrefix)) throw new Error('refusing to clean an unexpected staging path');
  await rm(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.once('error', async () => {
  await cleanup();
  process.exitCode = 1;
});
child.once('exit', async (code) => {
  await cleanup();
  process.exitCode = code ?? 1;
});
