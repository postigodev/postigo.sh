export type WorkKind = 'professional-experience' | 'project';
export type ArtifactKind = 'release' | 'screenshot' | 'external-contribution' | 'pull-request';
export type CaseLayout = 'artifact-led' | 'evidence-trail';

export interface PublicIdentity {
  name: string;
  primaryIdentity: string;
  descriptor: string;
  thesis: string;
  links: { github: string; linkedin: string; email: string };
}

export interface WorkRecord {
  id: string;
  name: string;
  kind: WorkKind;
  signal: string;
  status: string;
  slug?: string;
}

export interface PublicArtifact {
  id: string;
  kind: ArtifactKind;
  label: string;
  href: string;
  evidenceRef: string;
  caption: string;
  external?: boolean;
  status?: string;
  category?: string;
}

export interface CaseSection {
  id: string;
  title: string;
  body: readonly string[];
  highlights?: readonly string[];
  artifactIds: readonly string[];
}

export interface LeadMedia {
  artifactId: string;
  alt: string;
}

export interface ProjectCase extends WorkRecord {
  slug: string;
  layout: CaseLayout;
  contextLabel: string;
  dateLabel?: string;
  roleLabel?: string;
  ownership: string;
  summary: string;
  technologies: readonly string[];
  sections: readonly CaseSection[];
  evidenceRefs: readonly string[];
  artifacts: readonly PublicArtifact[];
  leadMedia?: LeadMedia;
  links: { repository: string };
}

export const identity = {
  name: 'Piero Postigo Rocchetti',
  primaryIdentity: 'Software Engineer',
  descriptor: 'backend + product engineering',
  thesis: 'I build reliable software for real workflows, from APIs and data models to integrations, automation, and failure-aware product systems.',
  links: {
    github: 'https://github.com/postigodev',
    linkedin: 'https://linkedin.com/in/postigo',
    email: 'mailto:ppostigorocchetti@gmail.com',
  },
} as const satisfies PublicIdentity;

export const selectedWork: readonly WorkRecord[] = [
  { id: 'preppie', name: 'Preppie', kind: 'professional-experience', signal: 'Product + reliability', status: 'Completed', slug: 'preppie' },
  { id: 'cimax-modernization', name: 'Cimax Modernization', kind: 'project', signal: 'Backend modernization', status: 'Shipped public repository' },
  { id: 'koba', name: 'Koba', kind: 'project', signal: 'Developer tooling', status: 'Shipped' },
  { id: 'dm2text', name: 'DM2Text', kind: 'project', signal: 'Browser product', status: 'Shipped on GitHub' },
  { id: 'sendo', name: 'Sendo', kind: 'project', signal: 'Rust desktop + integrations', status: 'Shipped', slug: 'sendo' },
];

export const projectCases = [
  {
    id: 'preppie',
    name: 'Preppie',
    kind: 'professional-experience',
    signal: 'Product + reliability',
    status: 'Completed',
    slug: 'preppie',
    layout: 'evidence-trail',
    contextLabel: 'Professional Experience',
    dateLabel: '2026',
    roleLabel: 'Startup Software Engineer — Backend & Integration',
    ownership: 'Piero authored substantial backend, integration, database, and reliability work. Product ownership was shared.',
    summary: 'Worked across backend product flows, PostgreSQL contracts, deployment isolation, release safety, and database recovery as the product matured.',
    technologies: ['TypeScript', 'NestJS', 'Prisma', 'PostgreSQL', 'SQL', 'Railway', 'Vercel', 'GitHub Actions'],
    sections: [
      {
        id: 'product-flows',
        title: 'Product flows',
        body: [
          'Cart behavior had to stay coherent across API, database, and product state.',
          'Built the backend contract around the cart lifecycle and its associated database changes.',
        ],
        artifactIds: ['preppie-pr-44'],
      },
      {
        id: 'database-contracts',
        title: 'Database contracts',
        body: [
          'Moved application assumptions into enforceable PostgreSQL contracts across grants, RLS, constraints, foreign keys, and indexes.',
        ],
        artifactIds: ['preppie-pr-61'],
      },
      {
        id: 'safe-promotion',
        title: 'Safe promotion',
        body: [
          'Deployment safety became a separate engineering problem from feature behavior.',
          'The trail moved from repository verification to isolated environments, fail-closed readiness, and migration gates.',
        ],
        artifactIds: ['preppie-pr-125', 'preppie-pr-127', 'preppie-pr-128', 'preppie-pr-129'],
      },
      {
        id: 'recovery-as-product-work',
        title: 'Recovery as product work',
        body: [
          'Backups only matter if the restore path is understood.',
          'Added guarded logical recovery, twice-daily restore configuration, rehearsal tooling, and runbooks.',
        ],
        artifactIds: ['preppie-pr-131'],
      },
    ],
    evidenceRefs: [
      'EV_PREPPIE_PR_44_CART_LIFECYCLE',
      'EV_PREPPIE_PR_61_POSTGRES_HARDENING',
      'EV_PREPPIE_PR_125_TRUNK_SAFEGUARDS',
      'EV_PREPPIE_PR_127_ENV_ISOLATION',
      'EV_PREPPIE_PR_128_READINESS',
      'EV_PREPPIE_PR_129_DB_RELEASES',
      'EV_PREPPIE_PR_131_DB_RECOVERY',
    ],
    artifacts: [
      { id: 'preppie-pr-44', kind: 'pull-request', label: 'PR #44 — Cart lifecycle', href: 'https://github.com/AxiomaSystems/Chef/pull/44', evidenceRef: 'EV_PREPPIE_PR_44_CART_LIFECYCLE', caption: 'Cart lifecycle backend contract and associated database migration design.', external: true, status: 'Merged', category: 'Product/backend' },
      { id: 'preppie-pr-61', kind: 'pull-request', label: 'PR #61 — PostgreSQL application hardening', href: 'https://github.com/AxiomaSystems/Chef/pull/61', evidenceRef: 'EV_PREPPIE_PR_61_POSTGRES_HARDENING', caption: 'Application-owned schema contracts, grants, RLS, constraints, and index hygiene.', external: true, status: 'Merged', category: 'Database' },
      { id: 'preppie-pr-125', kind: 'pull-request', label: 'PR #125 — Trunk safeguards', href: 'https://github.com/AxiomaSystems/Chef/pull/125', evidenceRef: 'EV_PREPPIE_PR_125_TRUNK_SAFEGUARDS', caption: 'Repository verification, trunk safeguards, and commit-policy checks.', external: true, status: 'Merged', category: 'Release safety' },
      { id: 'preppie-pr-127', kind: 'pull-request', label: 'PR #127 — Environment isolation', href: 'https://github.com/AxiomaSystems/Chef/pull/127', evidenceRef: 'EV_PREPPIE_PR_127_ENV_ISOLATION', caption: 'Preview and staging isolation with non-destructive verification.', external: true, status: 'Merged', category: 'Release safety' },
      { id: 'preppie-pr-128', kind: 'pull-request', label: 'PR #128 — Fail-closed readiness', href: 'https://github.com/AxiomaSystems/Chef/pull/128', evidenceRef: 'EV_PREPPIE_PR_128_READINESS', caption: 'Readiness contracts that reject incomplete production configuration.', external: true, status: 'Merged', category: 'Release safety' },
      { id: 'preppie-pr-129', kind: 'pull-request', label: 'PR #129 — Database release gates', href: 'https://github.com/AxiomaSystems/Chef/pull/129', evidenceRef: 'EV_PREPPIE_PR_129_DB_RELEASES', caption: 'Migration history checksums and schema compatibility gates.', external: true, status: 'Merged', category: 'Release safety' },
      { id: 'preppie-pr-131', kind: 'pull-request', label: 'PR #131 — Database recovery + rehearsal', href: 'https://github.com/AxiomaSystems/Chef/pull/131', evidenceRef: 'EV_PREPPIE_PR_131_DB_RECOVERY', caption: 'Guarded logical recovery, restore configuration, rehearsal tooling, and runbooks.', external: true, status: 'Merged', category: 'Recovery' },
    ],
    links: { repository: 'https://github.com/AxiomaSystems/Chef' },
  },
  {
    id: 'sendo',
    name: 'Sendo',
    kind: 'project',
    signal: 'Rust desktop + integrations',
    status: 'Shipped',
    slug: 'sendo',
    layout: 'artifact-led',
    contextLabel: 'Shipped software',
    ownership: 'Solo-maintained with external contributors',
    summary: 'A Rust/Tauri Windows utility coordinating Fire TV ADB/TCP control with Spotify Connect.',
    technologies: ['Rust', 'Tauri', 'Spotify Web API/Connect', 'ADB/TCP', 'OAuth'],
    sections: [{
      id: 'selected-contributions',
      title: 'Selected contributions',
      body: [],
      highlights: [
        'Requires an exact Spotify playback target identity and refuses ambiguous device matches.',
        'Implements Spotify OAuth token lifecycle and bounded ADB subprocess handling.',
        'Maintains the public project and has merged external contributor pull requests.',
      ],
      artifactIds: [],
    }],
    evidenceRefs: ['EV_SENDO_RELEASE_010', 'EV_SENDO_EXTERNAL_PR_AGGREGATE_20260812'],
    artifacts: [
      { id: 'sendo-release', kind: 'release', label: 'Sendo v0.1.0 release', href: 'https://github.com/postigodev/sendo/releases/tag/v0.1.0', evidenceRef: 'EV_SENDO_RELEASE_010', caption: 'Public NSIS/MSI release and distribution record.', external: true },
      { id: 'sendo-screenshot', kind: 'screenshot', label: 'Sendo product screenshot', href: '/images/sendo/sendo-home.png', evidenceRef: 'EV_SENDO_RELEASE_010', caption: 'The public Windows desktop interface.' },
      { id: 'sendo-contributors', kind: 'external-contribution', label: 'Merged external pull requests', href: 'https://github.com/postigodev/sendo/pulls?q=is%3Apr+is%3Amerged', evidenceRef: 'EV_SENDO_EXTERNAL_PR_AGGREGATE_20260812', caption: 'Four merged pull requests from three external contributors at the 2026-08-13 refresh.', external: true },
    ],
    leadMedia: { artifactId: 'sendo-screenshot', alt: 'Sendo Windows desktop application home screen' },
    links: { repository: 'https://github.com/postigodev/sendo' },
  },
] as const satisfies readonly ProjectCase[];

export function getProjectCase(slug: string): ProjectCase | undefined {
  return projectCases.find((project) => project.slug === slug);
}
