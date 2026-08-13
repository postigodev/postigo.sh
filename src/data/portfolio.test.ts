import { describe, expect, it } from 'vitest';
import { homeProjectPreviews, identity, projectCases, selectedWork } from './portfolio';

describe('public portfolio projection', () => {
  it('keeps the approved identity and flagship order', () => {
    expect(identity.primaryIdentity).toBe('Software Engineer');
    expect(selectedWork.map((record) => record.id)).toEqual([
      'preppie', 'cimax-modernization', 'koba', 'dm2text', 'sendo',
    ]);
    expect(selectedWork.find((record) => record.id === 'preppie')?.slug).toBe('preppie');
  });

  it('publishes the four-chapter Preppie evidence trail', () => {
    const preppie = projectCases.find((project) => project.slug === 'preppie');
    expect(preppie).toMatchObject({
      kind: 'professional-experience',
      contextLabel: 'Professional Experience',
      dateLabel: '2026',
      roleLabel: 'Startup Software Engineer — Backend & Integration',
      ownershipLabel: 'Collaborative product team',
      layout: 'evidence-trail',
    });
    expect(preppie?.sections.map((section) => section.id)).toEqual([
      'product-flows', 'database-contracts', 'safe-promotion', 'recovery-as-product-work',
    ]);
    expect(preppie?.artifacts.filter((artifact) => artifact.kind === 'pull-request')).toHaveLength(7);
    expect(preppie?.artifacts.filter((artifact) => artifact.kind !== 'pull-request')).toHaveLength(0);
  });

  it('resolves every chapter artifact and preserves provenance internally', () => {
    const preppie = projectCases.find((project) => project.slug === 'preppie')!;
    const artifactIds = new Set(preppie.artifacts.map((artifact) => artifact.id));
    expect(preppie.sections.flatMap((section) => section.artifactIds).every((id) => artifactIds.has(id))).toBe(true);
    expect(preppie.artifacts.every((artifact) => artifact.evidenceRef.startsWith('EV_PREPPIE_'))).toBe(true);
    expect(preppie.ownership).toContain('Product ownership was shared');
    expect(JSON.stringify(preppie)).not.toMatch(/I built Preppie|69 features shipped|platform engineer|SRE ownership/i);
  });

  it('retains the evidence-backed Sendo artifact-led case', () => {
    const sendo = projectCases.find((project) => project.slug === 'sendo');
    expect(sendo?.layout).toBe('artifact-led');
    expect(sendo?.evidenceRefs).toContain('EV_SENDO_RELEASE_010');
    expect(sendo?.artifacts.map((artifact) => artifact.kind)).toEqual([
      'release', 'screenshot', 'external-contribution',
    ]);
  });

  it('makes the three home previews routable evidence-backed cases', () => {
    expect(homeProjectPreviews.map((preview) => preview.slug)).toEqual([
      'preppie', 'cimax-modernization', 'koba',
    ]);
    expect(selectedWork.slice(0, 3).every((record) => record.slug)).toBe(true);
    expect(projectCases.find((project) => project.slug === 'cimax-modernization')).toMatchObject({
      contextLabel: 'Sanitized modernization',
      ownership: expect.stringMatching(/separate from the 2023 contract/i),
    });
    expect(projectCases.find((project) => project.slug === 'koba')).toMatchObject({
      contextLabel: 'Shipped developer tool',
      ownership: 'Solo project',
    });
  });

  it('keeps blocked Cimax and Koba claims out of public data', () => {
    const serialized = JSON.stringify(projectCases.filter(({ slug }) =>
      ['cimax-modernization', 'koba'].includes(slug),
    ));
    expect(serialized).not.toMatch(/exactly-once|latency improvement|rollback|JWT|autonomous Git|commits for users/i);
  });

  it('pins identity media to Piero public GitHub profile', () => {
    expect(identity.avatarUrl).toMatch(/^https:\/\/avatars\.githubusercontent\.com\//);
    expect(identity.links.github).toBe('https://github.com/postigodev');
  });
});
