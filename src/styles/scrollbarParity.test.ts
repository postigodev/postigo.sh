import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const normalizeLines = (value: string) => value.replace(/\r\n/g, '\n');
const globalCss = normalizeLines(readFileSync(new URL('./global.css', import.meta.url), 'utf8'));

describe('scrollbar styling boundaries', () => {
  it('themes the production document scrollbar for the preview-native surface', () => {
    expect(globalCss).toContain('scrollbar-color: #5e6d8a #11151d;');
    expect(globalCss).toContain('::-webkit-scrollbar-thumb');
    expect(globalCss).toContain('::-webkit-scrollbar-corner');
  });
});
