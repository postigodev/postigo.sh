import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import { sharedAstroConfig } from './astro.shared.config.mjs';

export default defineConfig({
  ...sharedAstroConfig,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  outDir: './.e2e-dist',
});
