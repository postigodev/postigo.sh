import { describe, expect, it } from 'vitest';
import { identity, projectCases, selectedWork } from './portfolio';

describe('public portfolio projection', () => {
  it('keeps the approved identity and flagship order', () => {
    expect(identity.primaryIdentity).toBe('Software Engineer');
    expect(selectedWork.map((record) => record.id)).toEqual([
      'preppie', 'cimax-modernization', 'koba', 'dm2text', 'sendo',
    ]);
  });

  it('publishes an evidence-backed Sendo case with first-class artifacts', () => {
    expect(projectCases.map((project) => project.slug)).toEqual(['sendo']);
    expect(projectCases[0]?.evidenceRefs).toContain('EV_SENDO_RELEASE_010');
    expect(projectCases[0]?.artifacts.map((artifact) => artifact.kind)).toEqual([
      'release', 'screenshot', 'external-contribution',
    ]);
  });
});
