import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobMocks = vi.hoisted(() => ({
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@vercel/blob', () => blobMocks);

import { deleteWritingPdf, uploadWritingPdf } from './pdf-storage';

describe('writing PDF blob storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a validated PDF to an organized versioned public pathname', async () => {
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
      access: 'public',
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
});
