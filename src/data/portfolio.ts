export type WorkKind = 'professional-experience' | 'project';
export type ArtifactKind = 'release' | 'screenshot' | 'external-contribution';

export interface PublicIdentity {
  name: string; primaryIdentity: string; descriptor: string; thesis: string;
  links: { github: string; linkedin: string; email: string };
}
export interface WorkRecord {
  id: string; name: string; kind: WorkKind; signal: string; status: string; slug?: string;
}
export interface PublicArtifact {
  kind: ArtifactKind; label: string; href: string; evidenceRef: string; caption: string;
  external?: boolean;
}
export interface ProjectCase extends WorkRecord {
  slug: string; ownership: string; summary: string; technologies: readonly string[];
  contributions: readonly string[]; evidenceRefs: readonly string[];
  artifacts: readonly PublicArtifact[]; links: { repository: string };
}

export const identity = {
  name: 'Piero Postigo Rocchetti', primaryIdentity: 'Software Engineer',
  descriptor: 'backend + product engineering',
  thesis: 'I build reliable software for real workflows, from APIs and data models to integrations, automation, and failure-aware product systems.',
  links: { github: 'https://github.com/postigodev', linkedin: 'https://linkedin.com/in/postigo', email: 'mailto:ppostigorocchetti@gmail.com' },
} as const satisfies PublicIdentity;

export const selectedWork: readonly WorkRecord[] = [
  { id: 'preppie', name: 'Preppie', kind: 'professional-experience', signal: 'Product + reliability', status: 'Completed' },
  { id: 'cimax-modernization', name: 'Cimax Modernization', kind: 'project', signal: 'Backend modernization', status: 'Shipped public repository' },
  { id: 'koba', name: 'Koba', kind: 'project', signal: 'Developer tooling', status: 'Shipped' },
  { id: 'dm2text', name: 'DM2Text', kind: 'project', signal: 'Browser product', status: 'Shipped on GitHub' },
  { id: 'sendo', name: 'Sendo', kind: 'project', signal: 'Rust desktop + integrations', status: 'Shipped', slug: 'sendo' },
];

export const projectCases = [{
  id: 'sendo', name: 'Sendo', kind: 'project', signal: 'Rust desktop + integrations', status: 'Shipped', slug: 'sendo',
  ownership: 'Solo-maintained with external contributors',
  summary: 'A Rust/Tauri Windows utility coordinating Fire TV ADB/TCP control with Spotify Connect.',
  technologies: ['Rust', 'Tauri', 'Spotify Web API/Connect', 'ADB/TCP', 'OAuth'],
  contributions: [
    'Requires an exact Spotify playback target identity and refuses ambiguous device matches.',
    'Implements Spotify OAuth token lifecycle and bounded ADB subprocess handling.',
    'Maintains the public project and has merged external contributor pull requests.',
  ],
  evidenceRefs: ['EV_SENDO_RELEASE_010', 'EV_SENDO_EXTERNAL_PR_AGGREGATE_20260812'],
  artifacts: [
    { kind: 'release', label: 'Sendo v0.1.0 release', href: 'https://github.com/postigodev/sendo/releases/tag/v0.1.0', evidenceRef: 'EV_SENDO_RELEASE_010', caption: 'Public NSIS/MSI release and distribution record.', external: true },
    { kind: 'screenshot', label: 'Sendo product screenshot', href: '/images/sendo/sendo-home.png', evidenceRef: 'EV_SENDO_RELEASE_010', caption: 'The public Windows desktop interface.' },
    { kind: 'external-contribution', label: 'Merged external pull requests', href: 'https://github.com/postigodev/sendo/pulls?q=is%3Apr+is%3Amerged', evidenceRef: 'EV_SENDO_EXTERNAL_PR_AGGREGATE_20260812', caption: 'Four merged pull requests from three external contributors at the 2026-08-13 refresh.', external: true },
  ],
  links: { repository: 'https://github.com/postigodev/sendo' },
}] as const satisfies readonly ProjectCase[];

export function getProjectCase(slug: string): ProjectCase | undefined {
  return projectCases.find((project) => project.slug === slug);
}
