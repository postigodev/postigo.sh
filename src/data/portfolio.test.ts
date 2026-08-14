import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homeProjectPreviews, identity, projectCases, prominentWork, selectedWork } from './portfolio';

const publicAsset = (path: string) => fileURLToPath(new URL(`../../public${path}`, import.meta.url));
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

describe('public portfolio projection', () => {
  it('keeps the approved identity and flagship order', () => {
    expect(identity.primaryIdentity).toBe('Software Engineer');
    expect(selectedWork.map((record) => record.id)).toEqual([
      'preppie', 'cimax-modernization', 'koba', 'dm2text', 'sendo',
    ]);
    expect(selectedWork.find((record) => record.id === 'preppie')?.slug).toBe('preppie');
    expect(selectedWork.find((record) => record.id === 'dm2text')?.slug).toBe('dm2text');
  });

  it('keeps the approved additional featured Work records prominent and truthfully labeled', () => {
    expect(prominentWork.map((record) => record.id)).toEqual(['trama', 'aeris', 'urbanlens', 'brumaire']);
    expect(prominentWork.map((record) => record.status)).toEqual(['Unreleased', 'Hackathon project', 'Hackathon prototype', 'Prototype-stage']);
    expect(prominentWork.every((record) => record.slug === undefined)).toBe(true);
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

  it('publishes the three-act DM2Text interaction trace from verified artifacts', () => {
    const dm2text = projectCases.find((project) => project.slug === 'dm2text');
    const artifactMap = new Map(dm2text?.artifacts.map((artifact) => [artifact.id, artifact]));
    const sequence = dm2text?.artifactSequence?.artifactIds.map((id) => artifactMap.get(id));

    expect(dm2text).toMatchObject({
      layout: 'artifact-led',
      status: 'Shipped on GitHub',
      ownership: 'Solo project',
      artifactSequence: { label: 'Interaction trace' },
    });
    expect(dm2text?.sections.map((section) => section.title)).toEqual([
      'A bounded interaction', 'State that will not sit still', 'A local output boundary',
    ]);
    expect(sequence?.map((artifact) => artifact?.kind)).toEqual([
      'screenshot', 'screenshot', 'anonymized-example',
    ]);
    expect(sequence?.map((artifact) => artifact?.label)).toEqual([
      'Copy context', 'Choose the boundary', 'Anonymized output example',
    ]);
    expect(dm2text?.evidenceRefs).toEqual(expect.arrayContaining([
      'EV_DM2TEXT_PRODUCT_SCREENSHOTS', 'EV_DM2TEXT_TRANSCRIPT_FORMAT_DOCS',
    ]));
    expect(dm2text?.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ href: expect.stringContaining('/releases/tag/v0.1.1') }),
      expect.objectContaining({ href: expect.stringContaining('/src/collection/session.ts') }),
      expect.objectContaining({ href: 'https://dm2text.postigo.sh/privacy' }),
    ]));
    expect(JSON.stringify(dm2text)).not.toMatch(/chrome web store/i);
  });

  it('pins the approved DM2Text source snapshot and anonymized fixture', () => {
    expect(sha256(publicAsset('/images/dm2text/message-action.png'))).toBe(
      'd5f07cf16742c119391d2a81bd2bcd483dc9bd89c737e52d5f9151b9da0a8844',
    );
    expect(sha256(publicAsset('/images/dm2text/copy-dialog.png'))).toBe(
      '3d6db7253c47e5e9c2c4d1ca10c8482124600c274cec5b640b9d4487b900478f',
    );
    const transcript = readFileSync(publicAsset('/images/dm2text/transcript-example.svg'), 'utf8');
    expect(transcript).toContain('ANONYMIZED OUTPUT EXAMPLE');
    expect(transcript).toContain('Person A');
    expect(transcript).toContain('Person B');
    expect(transcript).not.toMatch(/EV_DM2TEXT|[a-f0-9]{64}/i);
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
