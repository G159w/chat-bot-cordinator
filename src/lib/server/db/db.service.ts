import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { env } from '$env/dynamic/private';
import { inject } from '@needle-di/core';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export abstract class DbRepository {
  public db: PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

  constructor(protected readonly dbService = inject(DbService)) {
    this.db = dbService.db;
  }
}

export abstract class DbService<
  T extends PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>
> {
  db: T;

  constructor(db: T) {
    this.db = db;
  }
}

export class PgDbService extends DbService<PostgresJsDatabase<typeof schema>> {
  constructor() {
    if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

    const client = postgres(env.DATABASE_URL);

    const db = drizzle(client, { schema });

    super(db);
  }
}
