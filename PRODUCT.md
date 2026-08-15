# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters and hiring managers evaluating Piero Postigo Rocchetti for software engineering roles are the primary audience. Engineers and founders are a secondary audience who need enough technical depth to inspect ownership, implementation boundaries, and evidence.

## Product Purpose

`postigo.sh` is Piero's public professional portfolio and personal homepage. It must make his software engineering identity legible quickly, lead visitors into selected work, and preserve credible technical depth without inventing claims.

## Positioning

Primary identity: Software Engineer. Directional descriptor: backend + product engineering. Supported differentiators are reliability and operational thinking, workflow automation and integrations, bounded applied AI, and explicit state, identity, and side-effect boundaries.

## Operating Context

Visitors arrive from applications, recruiter outreach, GitHub, LinkedIn, and shared project links. They may scan the homepage, inspect a project case, review a resume, or use public evidence links. The site also exposes small public-presence surfaces for GitHub and Spotify.

## Capabilities and Constraints

- Astro owns stable routes, static HTML, metadata, and no-JavaScript fallbacks.
- Preact is progressive enhancement for project windows and live presence widgets.
- Project cases are evidence-led and use shared typed content.
- Public language is English.
- A future writings backend will publish Markdown, but authentication, uploads, persistence, and administration are not part of the current redesign.
- Professional facts follow `docs/career/`; unsupported or blocked claims must not appear.

## Brand Commitments

- The public name is `postigo.sh` and the recurring goat is a personal signature.
- `references/preview.html` is the binding visual and compositional reference for this redesign.
- The homepage should feel like a personal, maintained corner of the web rather than a generic startup portfolio.
- Project cases are the only draggable and resizable windows.

## Evidence on Hand

- Career evidence, positioning, and editorial policy in `docs/career/`.
- Typed identity, work, cases, ownership, and public artifacts in `src/data/portfolio.ts`.
- Project screenshots and evidence assets in `public/images/`.
- Public GitHub and Spotify integrations with honest unavailable states.
- No published writings or photo-album content is currently available; these surfaces must not fabricate entries.

## Product Principles

- Put professional identity and selected work ahead of decorative exploration.
- Show real artifacts and attribution before abstract technical language.
- Keep stable, shareable routes useful without JavaScript.
- Use personal-web character without compromising accessibility or recruiter comprehension.
- Keep dynamic behavior bounded and progressively enhanced.

## Accessibility & Inclusion

Primary navigation and project links remain semantic and keyboard accessible. Project windows require explicit focus management, modern contrast, reduced-motion support, and a non-drag mobile mode.
