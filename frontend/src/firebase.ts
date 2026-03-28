// Legacy Vite firebase init - mocked out to prevent Next.js build errors.
// The new App router uses its own Firebase logic or backend JWTs.
// frontend/src/firebase.ts  ← update this to re-export from the new location
export { app, auth } from '../lib/firebase';
export const auth = null as any;
export const app = null as any;
