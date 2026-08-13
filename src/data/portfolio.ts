export type WorkKind = 'professional-experience' | 'project';
export type ArtifactKind = 'release' | 'screenshot' | 'external-contribution' | 'pull-request' | 'source';
export type CaseLayout = 'artifact-led' | 'evidence-trail';

export interface PublicIdentity {
  name: string;
  primaryIdentity: string;
  descriptor: string;
  thesis: string;
  avatarUrl: string;
  links: { github: string; linkedin: string; email: string };
}

export interface HomeProjectPreview {
  slug: string;
  sequence: `0${1 | 2 | 3}`;
  name: string;
  signal: string;
  status: string;
  visualLabel: string;
  imageSrc: string;
  imageAlt: string;
  evidenceRef: string;
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
  ownershipLabel: string;
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
  avatarUrl: 'https://avatars.githubusercontent.com/u/247466788?v=4',
  links: {
    github: 'https://github.com/postigodev',
    linkedin: 'https://linkedin.com/in/postigo',
    email: 'mailto:ppostigorocchetti@gmail.com',
  },
} as const satisfies PublicIdentity;

export const selectedWork: readonly WorkRecord[] = [
  { id: 'preppie', name: 'Preppie', kind: 'professional-experience', signal: 'Product + reliability', status: 'Completed', slug: 'preppie' },
  { id: 'cimax-modernization', name: 'Cimax Modernization', kind: 'project', signal: 'Backend modernization', status: 'Shipped public repository', slug: 'cimax-modernization' },
  { id: 'koba', name: 'Koba', kind: 'project', signal: 'Developer tooling', status: 'Shipped', slug: 'koba' },
  { id: 'dm2text', name: 'DM2Text', kind: 'project', signal: 'Browser product', status: 'Shipped on GitHub' },
  { id: 'sendo', name: 'Sendo', kind: 'project', signal: 'Rust desktop + integrations', status: 'Shipped', slug: 'sendo' },
];

export const prominentWork: readonly WorkRecord[] = [
  { id: 'trama', name: 'Trama', kind: 'project', signal: 'Backend + state modeling', status: 'Unreleased' },
  { id: 'aeris', name: 'Aeris', kind: 'project', signal: 'Applied AI + backend', status: 'Hackathon project' },
  { id: 'urbanlens', name: 'UrbanLens', kind: 'project', signal: 'Applied AI + geospatial', status: 'Hackathon prototype' },
  { id: 'brumaire', name: 'Brumaire', kind: 'project', signal: 'Browser/media engineering', status: 'Prototype-stage' },
];

export const homeProjectPreviews = [
  { slug: 'preppie', sequence: '01', name: 'Preppie', signal: 'Product + reliability', status: 'Completed', visualLabel: 'RELEASE / RECOVERY TRAIL', imageSrc: '/images/projects/preppie-preview.svg', imageAlt: 'Release verification and recovery trail', evidenceRef: 'EV_PREPPIE_PR_131_DB_RECOVERY' },
  { slug: 'cimax-modernization', sequence: '02', name: 'Cimax Modernization', signal: 'Backend modernization', status: 'Shipped public repository', visualLabel: 'MONGO / CACHE / JOBS', imageSrc: '/images/projects/cimax-preview.svg', imageAlt: 'MongoDB, Redis cache, and background job boundaries', evidenceRef: 'EV_CIMAX_2026_MONGO_IDEMPOTENCY' },
  { slug: 'koba', sequence: '03', name: 'Koba', signal: 'Developer tooling', status: 'Shipped', visualLabel: 'READ / PREVIEW / APPLY', imageSrc: '/images/projects/koba-preview.svg', imageAlt: 'Read, preview, and explicit apply boundaries', evidenceRef: 'EV_KOBA_SAFETY_MODEL_SOURCE' },
] as const satisfies readonly HomeProjectPreview[];

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
    ownershipLabel: 'Collaborative product team',
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
    id: 'cimax-modernization',
    name: 'Cimax Modernization',
    kind: 'project',
    signal: 'Backend modernization',
    status: 'Shipped public repository',
    slug: 'cimax-modernization',
    layout: 'evidence-trail',
    contextLabel: 'Sanitized modernization',
    dateLabel: '2026',
    ownershipLabel: 'Project boundary',
    ownership: 'Solo audited public modernization, kept separate from the 2023 contract and its private operating context.',
    summary: 'Revisited a sanitized MERN application by moving data work into explicit database, cache, idempotency, migration, job, and authorization boundaries.',
    technologies: ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'Redis', 'BullMQ', 'Docker', 'OpenAPI'],
    sections: [
      {
        id: 'queries-and-cache',
        title: 'Queries and cache invalidation',
        body: [
          'Moved filtering, search, pagination, and bulk deletion toward MongoDB query operations.',
          'Added Redis read caching with explicit write invalidation and cache hit, miss, and bypass instrumentation.',
        ],
        artifactIds: ['cimax-query-source', 'cimax-cache-source'],
      },
      {
        id: 'request-and-schema-state',
        title: 'Request and schema state',
        body: [
          'Added Mongo-backed request idempotency using canonical request hashes, conflict states, and completed-response replay.',
          'Added ordered up-only MongoDB migrations with applied tracking and a stale-aware lock.',
        ],
        artifactIds: ['cimax-idempotency-source', 'cimax-migration-source'],
      },
      {
        id: 'jobs-and-operations',
        title: 'Jobs and operational surfaces',
        body: [
          'Added a BullMQ order-event worker with retry and backoff behavior plus durable audit-event persistence.',
          'Added viewer, operator, and admin API-key roles alongside health checks and Prometheus-style request and cache metrics.',
        ],
        artifactIds: ['cimax-job-source', 'cimax-operations-source'],
      },
    ],
    evidenceRefs: [
      'EV_CIMAX_2026_QUERY_REFACTOR',
      'EV_CIMAX_2026_REDIS_CACHE',
      'EV_CIMAX_2026_MONGO_IDEMPOTENCY',
      'EV_CIMAX_2026_MIGRATIONS',
      'EV_CIMAX_2026_BULLMQ_AUDIT',
      'EV_CIMAX_2026_AUTH_METRICS',
    ],
    artifacts: [
      { id: 'cimax-query-source', kind: 'source', label: 'MongoDB query refactor', href: 'https://github.com/postigodev/cimax-platform', evidenceRef: 'EV_CIMAX_2026_QUERY_REFACTOR', caption: 'Public source repository for query pushdown, pagination, and bulk-delete paths.', external: true, status: 'Public source', category: 'Data access' },
      { id: 'cimax-cache-source', kind: 'source', label: 'Redis cache boundary', href: 'https://github.com/postigodev/cimax-platform', evidenceRef: 'EV_CIMAX_2026_REDIS_CACHE', caption: 'Public source repository for read caching, write invalidation, and cache instrumentation.', external: true, status: 'Public source', category: 'Caching' },
      { id: 'cimax-idempotency-source', kind: 'source', label: 'Mongo-backed idempotency', href: 'https://github.com/postigodev/cimax-platform', evidenceRef: 'EV_CIMAX_2026_MONGO_IDEMPOTENCY', caption: 'Public source repository for request hashing, conflict states, and response replay.', external: true, status: 'Public source', category: 'Request state' },
      { id: 'cimax-migration-source', kind: 'source', label: 'Up-only migration runner', href: 'https://github.com/postigodev/cimax-platform', evidenceRef: 'EV_CIMAX_2026_MIGRATIONS', caption: 'Public source repository for ordered migrations, applied tracking, and stale-aware locking.', external: true, status: 'Public source', category: 'Schema state' },
      { id: 'cimax-job-source', kind: 'source', label: 'BullMQ audit worker', href: 'https://github.com/postigodev/cimax-platform', evidenceRef: 'EV_CIMAX_2026_BULLMQ_AUDIT', caption: 'Public source repository for bounded retries and durable audit-event persistence.', external: true, status: 'Public source', category: 'Background jobs' },
      { id: 'cimax-operations-source', kind: 'source', label: 'API roles and observability', href: 'https://github.com/postigodev/cimax-platform', evidenceRef: 'EV_CIMAX_2026_AUTH_METRICS', caption: 'Public source repository for API-key roles, health checks, and request/cache metrics.', external: true, status: 'Public source', category: 'Operations' },
    ],
    links: { repository: 'https://github.com/postigodev/cimax-platform' },
  },
  {
    id: 'koba',
    name: 'Koba',
    kind: 'project',
    signal: 'Developer tooling',
    status: 'Shipped',
    slug: 'koba',
    layout: 'evidence-trail',
    contextLabel: 'Shipped developer tool',
    dateLabel: '2026',
    ownershipLabel: 'Ownership',
    ownership: 'Solo project',
    summary: 'A Rust CLI that analyzes Git workflow state while keeping staging, commits, pushes, and history changes under explicit user control.',
    technologies: ['Rust', 'Git/GitHub', 'GitHub Actions', 'Scoop'],
    sections: [
      {
        id: 'safety-model',
        title: 'Explicit mutation boundaries',
        body: [
          'Separates read, recommend, preview, and apply behavior so file writes remain an explicit user decision.',
          'Does not commit, push, rewrite history, store GitHub tokens, call GitHub APIs, or open pull requests for the user.',
        ],
        artifactIds: ['koba-architecture'],
      },
      {
        id: 'working-tree-model',
        title: 'Working-tree model',
        body: [
          'Parses structured porcelain-v1 output and shares one working-tree analysis across commit, check, and pull-request planning surfaces.',
        ],
        artifactIds: ['koba-git-status'],
      },
      {
        id: 'release-engineering',
        title: 'Release engineering',
        body: [
          'Published v0.1.7 with multi-platform binaries, checksums, and Scoop distribution.',
        ],
        artifactIds: ['koba-release'],
      },
    ],
    evidenceRefs: ['EV_KOBA_SAFETY_MODEL_SOURCE', 'EV_KOBA_WORKTREE_ANALYSIS_SOURCE', 'EV_KOBA_RELEASE_017'],
    artifacts: [
      { id: 'koba-architecture', kind: 'source', label: 'Safety model architecture', href: 'https://github.com/postigodev/koba/blob/main/docs/architecture.md', evidenceRef: 'EV_KOBA_SAFETY_MODEL_SOURCE', caption: 'Read, preview, and apply boundaries documented in the public repository.', external: true, status: 'Public source', category: 'Safety model' },
      { id: 'koba-git-status', kind: 'source', label: 'Git porcelain parser', href: 'https://github.com/postigodev/koba/blob/main/crates/koba/src/git_status.rs', evidenceRef: 'EV_KOBA_WORKTREE_ANALYSIS_SOURCE', caption: 'Structured working-tree status parsing used by shared analysis.', external: true, status: 'Public source', category: 'Git state' },
      { id: 'koba-release', kind: 'release', label: 'Koba v0.1.7 release', href: 'https://github.com/postigodev/koba/releases/tag/v0.1.7', evidenceRef: 'EV_KOBA_RELEASE_017', caption: 'Multi-platform binaries, checksums, and Scoop distribution.', external: true, status: 'Released', category: 'Distribution' },
    ],
    links: { repository: 'https://github.com/postigodev/koba' },
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
    ownershipLabel: 'Ownership',
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
