import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getPublishedWritingBySlug } from '../../../writings/service';

export const prerender = false;

type PublishedWritingReader = typeof getPublishedWritingBySlug;

function plainResponse(status: 404 | 503, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

function methodNotAllowedResponse(): Response {
  return new Response('Method not allowed.', {
    status: 405,
    headers: {
      allow: 'GET, HEAD',
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

export async function resolvePublishedWritingPdf(
  slug: string,
  getWriting: PublishedWritingReader = getPublishedWritingBySlug,
): Promise<Response> {
  try {
    const writing = await getWriting(slug);
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
        'cache-control': 'no-store',
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
}

export const GET: APIRoute = ({ params }) =>
  resolvePublishedWritingPdf(params.slug ?? '');

export const HEAD: APIRoute = async ({ params }) => {
  const response = await resolvePublishedWritingPdf(params.slug ?? '');
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const ALL: APIRoute = () => methodNotAllowedResponse();
