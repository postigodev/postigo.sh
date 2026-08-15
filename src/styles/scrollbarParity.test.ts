import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const normalizeLines = (value: string) => value.replace(/\r\n/g, '\n');
const referenceCss = normalizeLines(
  readFileSync(new URL('../../references/WIN98-template/style.css', import.meta.url), 'utf8'),
);
const desktopCss = normalizeLines(readFileSync(new URL('./desktop.css', import.meta.url), 'utf8'));
const globalCss = normalizeLines(readFileSync(new URL('./global.css', import.meta.url), 'utf8'));
const tokensCss = normalizeLines(readFileSync(new URL('./tokens.css', import.meta.url), 'utf8'));

const referenceBlock = referenceCss.match(
  /::-webkit-scrollbar \{[\s\S]*?::-webkit-scrollbar-button:hover \{[\s\S]*?\n\}/,
)?.[0];

describe('scrollbar styling boundaries', () => {
  it('keeps the unused desktop implementation pinned to its behavior reference', () => {
    expect(referenceBlock).toBeTruthy();
    expect(desktopCss).toContain(referenceBlock);
    expect(desktopCss).not.toContain('.window-body::-webkit-scrollbar');
    expect(desktopCss).not.toContain('::-webkit-scrollbar-thumb:active');
    expect(desktopCss).not.toContain('::-webkit-scrollbar-button:active');
    expect(desktopCss).not.toContain('::-webkit-scrollbar-corner');
  });

  it('pins the exact Win98 face and hover colors', () => {
    expect(tokensCss).toContain('--window-bg: #c0c0c0;');
    expect(tokensCss).toContain('--button-hover: #e0e0e0;');
  });

  it('themes the production document scrollbar for the preview-native surface', () => {
    expect(globalCss).toContain('scrollbar-color: #5e6d8a #11151d;');
    expect(globalCss).toContain('::-webkit-scrollbar-thumb');
    expect(globalCss).toContain('::-webkit-scrollbar-corner');
  });
});
