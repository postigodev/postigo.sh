import { describe, expect, it } from 'vitest';
import { projectCases } from '../data/portfolio';
import { buildAppRegistry, nearColdBoot } from './appRegistry';

describe('desktop app registry', () => {
  const registry = buildAppRegistry(projectCases);

  it('defines complete unique metadata for every app', () => {
    const apps = [...registry.values()];
    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length);
    expect(new Set(apps.flatMap((app) => app.route ? [app.route] : [])).size)
      .toBe(apps.filter((app) => app.route).length);

    for (const app of apps) {
      expect(app.title).toMatch(/^[A-Z]/);
      expect(app.defaultBounds.width).toBeGreaterThanOrEqual(app.minSize.width);
      expect(app.defaultBounds.height).toBeGreaterThanOrEqual(app.minSize.height);
      expect(app.kind).toBeTruthy();
      expect(typeof app.showOnDesktop).toBe('boolean');
      expect(typeof app.showInStart).toBe('boolean');
      if (app.showOnDesktop) expect(app.desktopLabel ?? app.title).toBeTruthy();
      if (app.showInStart) expect(app.startLabel ?? app.title).toBeTruthy();
    }
  });

  it('uses the approved near-cold boot and only creates implemented project apps', () => {
    expect(nearColdBoot).toEqual(['identity']);
    expect(registry.has('project:preppie')).toBe(true);
    expect(registry.has('project:cimax-modernization')).toBe(true);
    expect(registry.has('project:koba')).toBe(true);
    expect(registry.has('project:sendo')).toBe(true);
    expect(registry.has('project:dm2text')).toBe(true);
  });

  it('maps About Piero to Identity and exposes Player twice without duplicate apps', () => {
    const identity = registry.get('identity');
    expect(identity).toMatchObject({
      route: '/', showOnDesktop: true, showInStart: true,
      desktopLabel: 'About Piero', startLabel: 'About Piero', startGroup: 'portfolio',
    });
    expect([...registry.keys()]).not.toContain('about');
    expect(registry.get('now-playing')).toMatchObject({
      showOnDesktop: true, showInStart: true,
      desktopLabel: 'Player', startLabel: 'Now playing', startGroup: 'utilities',
    });
  });

  it('assigns content width and a Start group to every exposed app', () => {
    for (const app of registry.values()) {
      expect(['editorial', 'case', 'utility']).toContain(app.contentWidth);
      if (app.showInStart) expect(['portfolio', 'utilities', 'policy']).toContain(app.startGroup);
    }
  });
});
