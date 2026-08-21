import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getBlobConfig } from '../../../lib/server-env';
import {
  vercelBlobWritingPdfStorage,
  type WritingPdfHead,
  type WritingPdfReadStorage,
} from '../../../writings/pdf-storage';
import { getPublishedWritingBySlug } from '../../../writings/service';

export const prerender = false;

type PublishedWritingReader = typeof getPublishedWritingBySlug;
type PdfRequestMethod = 'GET' | 'HEAD';

export interface WritingPdfRouteDependencies {
  getWriting: PublishedWritingReader;
  storage: WritingPdfReadStorage;
  getBlobToken(): Promise<string>;
}

const defaultDependencies: WritingPdfRouteDependencies = {
  getWriting: getPublishedWritingBySlug,
  storage: vercelBlobWritingPdfStorage,
  async getBlobToken() {
    return (await getBlobConfig()).BLOB_READ_WRITE_TOKEN;
  },
};

function plainResponse(
  status: 404 | 503,
  message: string,
  method: PdfRequestMethod,
): Response {
  return new Response(method === 'HEAD' ? null : message, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

function pdfHeaders(metadata: WritingPdfHead): Headers {
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/pdf',
    'x-content-type-options': 'nosniff',
  });
  if (Number.isSafeInteger(metadata.size) && metadata.size >= 0) {
    headers.set('content-length', String(metadata.size));
  }
  if (metadata.contentDisposition.trim()) {
    headers.set('content-disposition', metadata.contentDisposition);
  }
  return headers;
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
  method: PdfRequestMethod,
  dependencies: WritingPdfRouteDependencies = defaultDependencies,
): Promise<Response> {
  try {
    const writing = await dependencies.getWriting(slug);
    if (!writing?.pdf) return plainResponse(404, 'PDF not found.', method);

    const token = await dependencies.getBlobToken();
    const input = { pathname: writing.pdf.pathname, token };

    if (method === 'HEAD') {
      const metadata = await dependencies.storage.head(input);
      if (!metadata) return plainResponse(404, 'PDF not found.', method);
      return new Response(null, {
        status: 200,
        headers: pdfHeaders(metadata),
      });
    }

    const pdf = await dependencies.storage.get(input);
    if (!pdf) return plainResponse(404, 'PDF not found.', method);
    return new Response(pdf.stream, {
      status: 200,
      headers: pdfHeaders(pdf),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return plainResponse(404, 'PDF not found.', method);
    }
    console.error('Unable to deliver the published writing PDF.', { slug, error });
    return plainResponse(503, 'PDF unavailable.', method);
  }
}

export const GET: APIRoute = ({ params }) =>
  resolvePublishedWritingPdf(params.slug ?? '', 'GET');

export const HEAD: APIRoute = ({ params }) =>
  resolvePublishedWritingPdf(params.slug ?? '', 'HEAD');

export const ALL: APIRoute = () => methodNotAllowedResponse();
