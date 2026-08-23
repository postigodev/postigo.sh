import { defineMiddleware } from 'astro:middleware';
import {
  adminLoginRedirect,
  authorizeAdminRequest,
  isProtectedAdminPath,
} from './lib/authorization';
import { ServerConfigurationError } from './lib/server-env';
import { captureAdminLocation } from './location/service';

export const onRequest = defineMiddleware(async (context, next) => {
  if (!isProtectedAdminPath(context.url.pathname)) return next();

  try {
    const authorization = await authorizeAdminRequest(context.request.headers);

    if (authorization.status === 'unauthenticated') {
      return context.redirect(adminLoginRedirect(context.url));
    }

    if (authorization.status === 'forbidden') {
      return new Response('Forbidden', {
        status: 403,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    context.locals.authSession = authorization.session;
    try {
      await captureAdminLocation(context.request.headers);
    } catch (error) {
      console.error('Unable to update the portfolio location.', { error });
    }
    return next();
  } catch (error) {
    if (error instanceof ServerConfigurationError) {
      return new Response('Administrator access is unavailable.', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
    throw error;
  }
});
