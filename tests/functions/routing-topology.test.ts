import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('server route topology', () => {
  it('keeps the public API namespace under Astro', () => {
    const rootApiDirectory = resolve(process.cwd(), 'api');
    const rootApiFiles = existsSync(rootApiDirectory)
      ? readdirSync(rootApiDirectory, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
      : [];

    expect(rootApiFiles).toEqual([]);
    expect(existsSync(resolve(process.cwd(), 'src/pages/api/auth/[...all].ts'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'src/pages/api/github-snapshot.ts'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'src/pages/api/now-playing.ts'))).toBe(true);
  });
});
