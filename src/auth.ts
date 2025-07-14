import { db } from '$lib/server/api/api';
import {
  accountTable,
  sessionTable,
  userTable,
  verificationTokenTable
} from '$lib/server/db/schema';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: DrizzleAdapter(db, {
    accountsTable: accountTable,
    sessionsTable: sessionTable,
    usersTable: userTable,
    verificationTokensTable: verificationTokenTable
  }),
  providers: [Google],
  trustHost: true
});
