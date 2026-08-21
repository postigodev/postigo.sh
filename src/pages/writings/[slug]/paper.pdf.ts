import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getPublishedWritingBySlug } from '../../../writings/service';

export const prerender = false;

function plainResponse(status: 404 | 503, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  try {
    const writing = await getPublishedWritingBySlug(slug);
    if (!writing?.pdf) return plainResponse(404, 'PDF not found.');

    const blobUrl = new URL(writing.pdf.url);
    if (blobUrl.protocol !== 'https:') {
      console.error('Refusing to redirect to an invalid writing PDF URL.', {
        slug,
        protocol: blobUrl.protocol,
      });
      return plainResponse(503, 'PDF unavailable.');
    }

    return new Response(null, {
      status: 307,
      headers: {
        location: blobUrl.toString(),
        'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return plainResponse(404, 'PDF not found.');
    }
    console.error('Unable to resolve the published writing PDF.', { slug, error });
    return plainResponse(503, 'PDF unavailable.');
  }
};

export const HEAD = GET;
