// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      session: import('$lib/server/session/auth.service').SessionValidationResult['session'];
      user: import('$lib/server/session/auth.service').SessionValidationResult['user'];
    }
  } // interface Error {}
  // interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export {};
