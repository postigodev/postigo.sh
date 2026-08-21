import { ActionError, defineAction } from 'astro:actions';
import { createWritingActionHandlers, WritingActionFailure } from './writing-handlers';

type WritingActionHandlers = ReturnType<typeof createWritingActionHandlers>;

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

export function createAstroWritingActions(handlers: WritingActionHandlers) {
  return {
    createWriting: defineAction({
      accept: 'form',
      handler: (input, context) =>
        asAstroAction(() => handlers.createWriting(input, context)),
    }),
    updateWriting: defineAction({
      accept: 'form',
      handler: (input, context) =>
        asAstroAction(() => handlers.updateWriting(input, context)),
    }),
    publishWriting: defineAction({
      accept: 'form',
      handler: (input, context) =>
        asAstroAction(() => handlers.publishWriting(input, context)),
    }),
    unpublishWriting: defineAction({
      accept: 'form',
      handler: (input, context) =>
        asAstroAction(() => handlers.unpublishWriting(input, context)),
    }),
    deleteWriting: defineAction({
      accept: 'form',
      handler: (input, context) =>
        asAstroAction(() => handlers.deleteWriting(input, context)),
    }),
    uploadWritingPdf: defineAction({
      accept: 'form',
      handler: (input, context) =>
        asAstroAction(() => handlers.uploadWritingPdf(input, context)),
    }),
    removeWritingPdf: defineAction({
      accept: 'form',
      handler: (input, context) =>
        asAstroAction(() => handlers.removeWritingPdf(input, context)),
    }),
  };
}

export const server = createAstroWritingActions(createWritingActionHandlers());
