import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'astro:actions': fileURLToPath(
        new URL('./tests/support/astro-actions.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/functions/**/*.test.ts'],
  },
});
