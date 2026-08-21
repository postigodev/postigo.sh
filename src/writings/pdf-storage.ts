import { randomUUID } from 'node:crypto';
import {
  BlobNotFoundError,
  del,
  get as getBlob,
  head as headBlob,
  put,
} from '@vercel/blob';
import type { WritingPdfMetadata } from './domain';
import { validateWritingPdf } from './schemas';

export interface WritingPdfStorage {
  upload(input: UploadWritingPdfInput): Promise<WritingPdfMetadata>;
  delete(input: DeleteWritingPdfInput): Promise<void>;
  get(input: ReadWritingPdfInput): Promise<WritingPdfBody | null>;
  head(input: ReadWritingPdfInput): Promise<WritingPdfHead | null>;
}

export type WritingPdfMutationStorage = Pick<
  WritingPdfStorage,
  'upload' | 'delete'
>;

export type WritingPdfReadStorage = Pick<WritingPdfStorage, 'get' | 'head'>;

export interface UploadWritingPdfInput {
  writingId: string;
  file: File;
  token: string;
}

export interface DeleteWritingPdfInput {
  pathname: string;
  token: string;
}

export interface ReadWritingPdfInput {
  pathname: string;
  token: string;
}

export interface WritingPdfHead {
  size: number;
  contentDisposition: string;
}

export interface WritingPdfBody extends WritingPdfHead {
  stream: ReadableStream<Uint8Array>;
}

function requireToken(token: string): string {
  if (!token.trim()) {
    throw new Error('A Vercel Blob read/write token is required.');
  }
  return token;
}

function requirePathname(pathname: string): string {
  if (!pathname.trim()) {
    throw new Error('A blob pathname is required for a writing PDF.');
  }
  return pathname;
}

export async function uploadWritingPdf({
  writingId,
  file,
  token,
}: UploadWritingPdfInput): Promise<WritingPdfMetadata> {
  const validFile = await validateWritingPdf(file);
  const pathname = `writings/${writingId}/paper-${randomUUID()}.pdf`;
  const blob = await put(pathname, validFile, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/pdf',
    token: requireToken(token),
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    filename: validFile.name,
    size: validFile.size,
    mimeType: 'application/pdf',
  };
}

export async function deleteWritingPdf({
  pathname,
  token,
}: DeleteWritingPdfInput): Promise<void> {
  await del(requirePathname(pathname), { token: requireToken(token) });
}

export async function getWritingPdf({
  pathname,
  token,
}: ReadWritingPdfInput): Promise<WritingPdfBody | null> {
  const result = await getBlob(requirePathname(pathname), {
    access: 'private',
    token: requireToken(token),
  });
  if (!result) return null;
  if (result.statusCode !== 200) {
    throw new Error(`Unexpected Vercel Blob response status ${result.statusCode}.`);
  }

  return {
    stream: result.stream,
    size: result.blob.size,
    contentDisposition: result.blob.contentDisposition,
  };
}

export async function headWritingPdf({
  pathname,
  token,
}: ReadWritingPdfInput): Promise<WritingPdfHead | null> {
  try {
    const blob = await headBlob(requirePathname(pathname), {
      token: requireToken(token),
    });
    return {
      size: blob.size,
      contentDisposition: blob.contentDisposition,
    };
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

export const vercelBlobWritingPdfStorage: WritingPdfStorage = {
  upload: uploadWritingPdf,
  delete: deleteWritingPdf,
  get: getWritingPdf,
  head: headWritingPdf,
};
