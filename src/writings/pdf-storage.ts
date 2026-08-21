import { randomUUID } from 'node:crypto';
import { del, put } from '@vercel/blob';
import type { WritingPdfMetadata } from './domain';
import { validateWritingPdf } from './schemas';

export interface WritingPdfStorage {
  upload(input: UploadWritingPdfInput): Promise<WritingPdfMetadata>;
  delete(input: DeleteWritingPdfInput): Promise<void>;
}

export interface UploadWritingPdfInput {
  writingId: string;
  file: File;
  token: string;
}

export interface DeleteWritingPdfInput {
  pathname: string;
  token: string;
}

function requireToken(token: string): string {
  if (!token.trim()) {
    throw new Error('A Vercel Blob read/write token is required.');
  }
  return token;
}

export async function uploadWritingPdf({
  writingId,
  file,
  token,
}: UploadWritingPdfInput): Promise<WritingPdfMetadata> {
  const validFile = await validateWritingPdf(file);
  const pathname = `writings/${writingId}/paper-${randomUUID()}.pdf`;
  const blob = await put(pathname, validFile, {
    access: 'public',
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
  if (!pathname.trim()) {
    throw new Error('A blob pathname is required to delete a writing PDF.');
  }
  await del(pathname, { token: requireToken(token) });
}

export const vercelBlobWritingPdfStorage: WritingPdfStorage = {
  upload: uploadWritingPdf,
  delete: deleteWritingPdf,
};
