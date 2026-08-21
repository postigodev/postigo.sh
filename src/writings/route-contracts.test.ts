import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');

describe('writing route boundaries', () => {
  it('keeps the homepage component service-free and data-driven', () => {
    const homeSurface = read('../components/HomeSurface.astro');
    const homepage = read('../pages/index.astro');
    const projectRoute = read('../pages/work/[slug].astro');

    expect(homeSurface).not.toContain("../writings/service");
    expect(homeSurface).not.toContain('getPublishedWritings(');
    expect(homeSurface).toContain('writings = []');
    expect(homepage).toContain('await getPublishedWritingsOrFallback()');
    expect(homepage).toContain('export const prerender = false');
    expect(projectRoute).toContain('export const prerender = true');
  });

  it('uses only the publication-safe service query on public detail routes', () => {
    const detail = read('../pages/writings/[slug].astro');
    const pdf = read('../pages/writings/[slug]/paper.pdf.ts');

    for (const source of [detail, pdf]) {
      expect(source).toContain('getPublishedWritingBySlug');
      expect(source).not.toContain('getWritingById');
      expect(source).not.toContain('listWritingsForAdmin');
    }
    expect(detail).toContain('status = 404');
    expect(detail).toContain('status = 503');
  });

  it('keeps the PDF route a GET/HEAD redirect rather than a byte proxy', () => {
    const pdf = read('../pages/writings/[slug]/paper.pdf.ts');

    expect(pdf).toContain('status: 307');
    expect(pdf).toContain('location: blobUrl.toString()');
    expect(pdf).toContain('export const HEAD = GET');
    expect(pdf).not.toContain('arrayBuffer(');
  });
});

describe('admin document contracts', () => {
  it('provides no-JavaScript forms for every approved writing action', () => {
    const create = read('../pages/admin/writings/new.astro');
    const edit = read('../pages/admin/writings/[id].astro');

    expect(create).toContain('method="POST" action={actions.createWriting}');
    for (const action of [
      'updateWriting',
      'publishWriting',
      'unpublishWriting',
      'uploadWritingPdf',
      'removeWritingPdf',
      'deleteWriting',
    ]) {
      expect(edit).toContain(`action={actions.${action}}`);
    }
    expect(edit).toContain('name="expectedSlug"');
    expect(edit).toContain('enctype="multipart/form-data"');
  });

  it('uses the lone hydrated admin control only for GitHub authentication', () => {
    const controls = read('../components/AdminAuthControls.tsx');
    const shell = read('../components/AdminShell.astro');

    expect(controls).toContain("provider: 'github'");
    expect(controls).toContain('safeAdminNextPath(next)');
    expect(shell).toContain('AdminAuthControls mode="sign-out" client:load');
  });
});
