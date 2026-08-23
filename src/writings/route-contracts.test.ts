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
    expect(homeSurface).toContain('writingsAvailable === undefined');
    expect(homeSurface).toContain('Writing availability is checked live.');
    expect(homepage).toContain('getPublishedWritingsOrFallback()');
    expect(homepage).toContain('writingsAvailable={writingsLoad.available}');
    expect(homepage).toContain('export const prerender = false');
    expect(projectRoute).toContain('export const prerender = true');
    expect(projectRoute).not.toContain('writingsAvailable=');
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

  it('streams private PDFs through the stable same-origin GET/HEAD route', () => {
    const pdf = read('../pages/writings/[slug]/paper.pdf.ts');

    expect(pdf).toContain('dependencies.storage.get(input)');
    expect(pdf).toContain('dependencies.storage.head(input)');
    expect(pdf).toContain('getBlobConfig()');
    expect(pdf).toContain("'content-type': 'application/pdf'");
    expect(pdf).toContain("'cache-control': 'no-store'");
    expect(pdf).toContain('export const HEAD: APIRoute');
    expect(pdf).toContain('export const ALL: APIRoute');
    expect(pdf).toContain("allow: 'GET, HEAD'");
    expect(pdf).not.toContain("from '@vercel/blob'");
    expect(pdf).not.toContain('writing.pdf.url');
    expect(pdf).not.toContain('status: 307');
    expect(pdf).not.toContain('location:');
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
    expect(controls).toContain('finally');
    expect(controls).toContain('GitHub sign-in could not be started.');
    expect(controls).toContain('Sign-out failed.');
    expect(shell).toContain('AdminAuthControls mode="sign-out" client:load');
  });
});
