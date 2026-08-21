import { ActionError, defineAction } from 'astro:actions';
import { createWritingActionHandlers, WritingActionFailure } from './writing-handlers';
import {
  createWritingActionInputSchema,
  deleteWritingActionInputSchema,
  updateWritingActionInputSchema,
  uploadWritingPdfActionInputSchema,
  writingIdActionInputSchema,
} from './writing-input';

const handlers = createWritingActionHandlers();

async function asAstroAction<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof WritingActionFailure) {
      throw new ActionError({ code: error.code, message: error.message });
    }
    throw error;
  }
}

export const server = {
  createWriting: defineAction({
    accept: 'form',
    input: createWritingActionInputSchema,
    handler: (input, context) =>
      asAstroAction(() => handlers.createWriting(input, context)),
  }),
  updateWriting: defineAction({
    accept: 'form',
    input: updateWritingActionInputSchema,
    handler: (input, context) =>
      asAstroAction(() => handlers.updateWriting(input, context)),
  }),
  publishWriting: defineAction({
    accept: 'form',
    input: writingIdActionInputSchema,
    handler: (input, context) =>
      asAstroAction(() => handlers.publishWriting(input, context)),
  }),
  unpublishWriting: defineAction({
    accept: 'form',
    input: writingIdActionInputSchema,
    handler: (input, context) =>
      asAstroAction(() => handlers.unpublishWriting(input, context)),
  }),
  deleteWriting: defineAction({
    accept: 'form',
    input: deleteWritingActionInputSchema,
    handler: (input, context) =>
      asAstroAction(() => handlers.deleteWriting(input, context)),
  }),
  uploadWritingPdf: defineAction({
    accept: 'form',
    input: uploadWritingPdfActionInputSchema,
    handler: (input, context) =>
      asAstroAction(() => handlers.uploadWritingPdf(input, context)),
  }),
  removeWritingPdf: defineAction({
    accept: 'form',
    input: writingIdActionInputSchema,
    handler: (input, context) =>
      asAstroAction(() => handlers.removeWritingPdf(input, context)),
  }),
};
