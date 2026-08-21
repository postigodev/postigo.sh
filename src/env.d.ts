/// <reference types="astro/client" />

import type { AuthorizationSession } from './lib/authorization';

declare global {
  namespace App {
    interface Locals {
      authSession?: AuthorizationSession;
    }
  }
}

export {};
