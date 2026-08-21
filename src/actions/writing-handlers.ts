import { BlobError } from '@vercel/blob';
import { z } from 'zod';
import {
  authorizeAdminRequest,
  type AdminAuthorization,
} from '../lib/authorization';
import { getBlobConfig, ServerConfigurationError } from '../lib/server-env';
import type {
  CreateWritingInput,
  UpdateWritingInput,
  Writing,
  WritingServiceResult,
} from '../writings/domain';
import {
  WritingNotFoundError,
  WritingPdfAttachmentError,
  WritingSlugConflictError,
  attachWritingPdf,
  createWriting,
  deleteWriting,
  getWritingById,
  publishWriting,
  removeWritingPdf,
  unpublishWriting,
  updateWriting,
} from '../writings/service';
import {
  parseCreateWritingActionInput,
  parseDeleteWritingActionInput,
  parseUpdateWritingActionInput,
  parseUploadWritingPdfActionInput,
  parseWritingIdActionInput,
} from './writing-input';

export type WritingActionErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'CONTENT_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'FAILED_DEPENDENCY'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_SERVER_ERROR';

export class WritingActionFailure extends Error {
  readonly code: WritingActionErrorCode;

  constructor(
    code: WritingActionErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'WritingActionFailure';
    this.code = code;
  }
}

export interface WritingActionContext {
  request: Pick<Request, 'headers'>;
}

export interface WritingActionServices {
  createWriting(input: CreateWritingInput): Promise<Writing>;
  updateWriting(id: string, input: UpdateWritingInput): Promise<Writing | null>;
  publishWriting(id: string): Promise<Writing | null>;
  unpublishWriting(id: string): Promise<Writing | null>;
  getWritingById(id: string): Promise<Writing | null>;
  deleteWriting(
    id: string,
    options: { token?: string },
  ): Promise<WritingServiceResult<Writing | null>>;
  attachWritingPdf(
    id: string,
    file: File,
    options: { token: string },
  ): Promise<WritingServiceResult<Writing>>;
  removeWritingPdf(
    id: string,
    options: { token?: string },
  ): Promise<WritingServiceResult<Writing | null>>;
}

export interface WritingActionDependencies {
  authorize(headers: Headers): Promise<AdminAuthorization>;
  getBlobToken(): Promise<string>;
  services: WritingActionServices;
}

const productionDependencies: WritingActionDependencies = {
  authorize: authorizeAdminRequest,
  async getBlobToken() {
    return (await getBlobConfig()).BLOB_READ_WRITE_TOKEN;
  },
  services: {
    createWriting,
    updateWriting,
    publishWriting,
    unpublishWriting,
    getWritingById,
    deleteWriting,
    attachWritingPdf,
    removeWritingPdf,
  },
};

function notFound(id: string): WritingActionFailure {
  return new WritingActionFailure('NOT_FOUND', `Writing "${id}" was not found.`);
}

function mapFailure(error: unknown): WritingActionFailure {
  if (error instanceof WritingActionFailure) return error;
  if (error instanceof z.ZodError) {
    return new WritingActionFailure(
      'BAD_REQUEST',
      error.issues.map((issue) => issue.message).join('; '),
      { cause: error },
    );
  }
  if (error instanceof WritingSlugConflictError) {
    return new WritingActionFailure('CONFLICT', error.message, { cause: error });
  }
  if (error instanceof WritingNotFoundError) {
    return notFound(error.writingId);
  }
  if (error instanceof ServerConfigurationError) {
    return new WritingActionFailure('SERVICE_UNAVAILABLE', error.message, {
      cause: error,
    });
  }
  if (error instanceof WritingPdfAttachmentError) {
    const warningText = error.warnings.map((warning) => warning.message).join(' ');
    return new WritingActionFailure(
      'FAILED_DEPENDENCY',
      `${error.message}${warningText ? ` ${warningText}` : ''}`,
      { cause: error },
    );
  }
  if (error instanceof BlobError) {
    if (error.name === 'BlobFileTooLargeError') {
      return new WritingActionFailure('CONTENT_TOO_LARGE', error.message, {
        cause: error,
      });
    }
    if (error.name === 'BlobContentTypeNotAllowedError') {
      return new WritingActionFailure('UNSUPPORTED_MEDIA_TYPE', error.message, {
        cause: error,
      });
    }
    if (
      [
        'BlobAccessError',
        'BlobClientTokenExpiredError',
        'BlobStoreNotFoundError',
        'BlobStoreSuspendedError',
      ].includes(error.name)
    ) {
      return new WritingActionFailure('SERVICE_UNAVAILABLE', error.message, {
        cause: error,
      });
    }
    return new WritingActionFailure('BAD_GATEWAY', error.message, {
      cause: error,
    });
  }

  return new WritingActionFailure(
    'INTERNAL_SERVER_ERROR',
    'The writing operation failed unexpectedly.',
    { cause: error },
  );
}

async function runAuthorized<T>(
  context: WritingActionContext,
  dependencies: WritingActionDependencies,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    const authorization = await dependencies.authorize(context.request.headers);
    if (authorization.status === 'unauthenticated') {
      throw new WritingActionFailure(
        'UNAUTHORIZED',
        'Sign in is required to manage writings.',
      );
    }
    if (authorization.status === 'forbidden') {
      throw new WritingActionFailure(
        'FORBIDDEN',
        'This account is not authorized to manage writings.',
      );
    }
    return await operation();
  } catch (error) {
    throw mapFailure(error);
  }
}

function success<T>(data: T): WritingServiceResult<T> {
  return { data, warnings: [] };
}

function publicResult<T>(
  result: WritingServiceResult<T>,
): WritingServiceResult<T> {
  return {
    data: result.data,
    warnings: result.warnings.map(({ code, message }) => ({ code, message })),
  };
}

export function createWritingActionHandlers(
  dependencies: WritingActionDependencies = productionDependencies,
) {
  return {
    createWriting(input: FormData, context: WritingActionContext) {
      return runAuthorized(context, dependencies, async () =>
        success(
          await dependencies.services.createWriting(
            parseCreateWritingActionInput(input),
          ),
        ),
      );
    },

    updateWriting(input: FormData, context: WritingActionContext) {
      return runAuthorized(context, dependencies, async () => {
        const { id, values } = parseUpdateWritingActionInput(input);
        const updated = await dependencies.services.updateWriting(id, values);
        if (!updated) throw notFound(id);
        return success(updated);
      });
    },

    publishWriting(input: FormData, context: WritingActionContext) {
      return runAuthorized(context, dependencies, async () => {
        const { id } = parseWritingIdActionInput(input);
        const published = await dependencies.services.publishWriting(id);
        if (!published) throw notFound(id);
        return success(published);
      });
    },

    unpublishWriting(input: FormData, context: WritingActionContext) {
      return runAuthorized(context, dependencies, async () => {
        const { id } = parseWritingIdActionInput(input);
        const unpublished = await dependencies.services.unpublishWriting(id);
        if (!unpublished) throw notFound(id);
        return success(unpublished);
      });
    },

    deleteWriting(input: FormData, context: WritingActionContext) {
      return runAuthorized(context, dependencies, async () => {
        const { id, expectedSlug } = parseDeleteWritingActionInput(input);
        const existing = await dependencies.services.getWritingById(id);
        if (!existing) throw notFound(id);
        if (existing.slug !== expectedSlug.trim()) {
          throw new WritingActionFailure(
            'PRECONDITION_FAILED',
            'The slug confirmation does not match the writing being deleted.',
          );
        }
        const options = existing.pdf
          ? { token: await dependencies.getBlobToken() }
          : {};
        const result = await dependencies.services.deleteWriting(id, options);
        if (!result.data) throw notFound(id);
        return publicResult(result);
      });
    },

    uploadWritingPdf(
      input: FormData,
      context: WritingActionContext,
    ) {
      return runAuthorized(context, dependencies, async () => {
        const { id, file } = parseUploadWritingPdfActionInput(input);
        const token = await dependencies.getBlobToken();
        return publicResult(
          await dependencies.services.attachWritingPdf(id, file, { token }),
        );
      });
    },

    removeWritingPdf(input: FormData, context: WritingActionContext) {
      return runAuthorized(context, dependencies, async () => {
        const { id } = parseWritingIdActionInput(input);
        const existing = await dependencies.services.getWritingById(id);
        if (!existing) throw notFound(id);
        const options = existing.pdf
          ? { token: await dependencies.getBlobToken() }
          : {};
        const result = await dependencies.services.removeWritingPdf(id, options);
        if (!result.data) throw notFound(id);
        return publicResult(result);
      });
    },
  };
}
