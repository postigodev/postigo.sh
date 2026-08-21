import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobMocks = vi.hoisted(() => ({
  put: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
  BlobNotFoundError: class BlobNotFoundError extends Error {},
}));

vi.mock('@vercel/blob', () => blobMocks);

import {
  deleteWritingPdf,
  getWritingPdf,
  headWritingPdf,
  uploadWritingPdf,
} from './pdf-storage';

describe('writing PDF blob storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a validated PDF to an organized versioned private pathname', async () => {
    blobMocks.put.mockResolvedValue({
      url: 'https://blob.example/paper.pdf',
      pathname: 'writings/writing-id/paper-version.pdf',
    });
    const file = new File(['%PDF-content'], 'original.pdf', {
      type: 'application/pdf',
    });

    const metadata = await uploadWritingPdf({
      writingId: 'writing-id',
      file,
      token: 'blob-token',
    });

    const [pathname, body, options] = blobMocks.put.mock.calls[0];
    expect(pathname).toMatch(
      /^writings\/writing-id\/paper-[0-9a-f-]{36}\.pdf$/,
    );
    expect(body).toBe(file);
    expect(options).toMatchObject({
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/pdf',
      token: 'blob-token',
    });
    expect(metadata).toEqual({
      url: 'https://blob.example/paper.pdf',
      pathname: 'writings/writing-id/paper-version.pdf',
      filename: 'original.pdf',
      size: file.size,
      mimeType: 'application/pdf',
    });
  });

  it('passes the caller token when deleting and rejects missing tokens', async () => {
    blobMocks.del.mockResolvedValue(undefined);
    await deleteWritingPdf({ pathname: 'writings/id/paper.pdf', token: 'token' });
    expect(blobMocks.del).toHaveBeenCalledWith('writings/id/paper.pdf', {
      token: 'token',
    });

    await expect(
      deleteWritingPdf({ pathname: 'writings/id/paper.pdf', token: ' ' }),
    ).rejects.toThrow('token is required');
  });

  it('streams private PDF bytes with authenticated get metadata', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('%PDF-private'));
        controller.close();
      },
    });
    blobMocks.get.mockResolvedValue({
      statusCode: 200,
      stream,
      headers: new Headers(),
      blob: {
        size: 12,
        contentDisposition: 'inline; filename="paper.pdf"',
      },
    });

    await expect(
      getWritingPdf({ pathname: 'writings/id/paper.pdf', token: 'token' }),
    ).resolves.toEqual({
      stream,
      size: 12,
      contentDisposition: 'inline; filename="paper.pdf"',
    });
    expect(blobMocks.get).toHaveBeenCalledWith('writings/id/paper.pdf', {
      access: 'private',
      token: 'token',
    });
  });

  it('reads private PDF metadata with head and normalizes missing blobs', async () => {
    blobMocks.head.mockResolvedValueOnce({
      size: 12,
      contentDisposition: 'inline; filename="paper.pdf"',
    });

    await expect(
      headWritingPdf({ pathname: 'writings/id/paper.pdf', token: 'token' }),
    ).resolves.toEqual({
      size: 12,
      contentDisposition: 'inline; filename="paper.pdf"',
    });
    expect(blobMocks.head).toHaveBeenCalledWith('writings/id/paper.pdf', {
      token: 'token',
    });

    blobMocks.head.mockRejectedValueOnce(new blobMocks.BlobNotFoundError());
    await expect(
      headWritingPdf({ pathname: 'writings/id/missing.pdf', token: 'token' }),
    ).resolves.toBeNull();
  });
});
