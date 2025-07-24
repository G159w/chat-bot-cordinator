import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { env } from '$env/dynamic/private';
import { record } from '@elysiajs/opentelemetry';
import { inject } from '@needle-di/core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type QueryArrayResult } from 'pg';

import * as schema from './schema';

export abstract class DbRepository {
  public db: NodePgDatabase<Record<string, never>> | PgliteDatabase<typeof schema>;

  constructor(protected readonly dbService = inject(DbService)) {
    this.db = dbService.db;
  }
}

export abstract class DbService<
  T extends NodePgDatabase<Record<string, never>> | PgliteDatabase<typeof schema>
> {
  db: T;

  constructor(db: T) {
    this.db = db;
  }
}

export class PgDbService extends DbService<NodePgDatabase<Record<string, never>>> {
  constructor() {
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      min: 0
    });

    const originalQuery = pool.query.bind(pool);

    pool.query = async function newQuery(...args: never[]): Promise<QueryArrayResult<never>> {
      const spanName = `pg.query`;
      return record(spanName, (span) => {
        span.setAttribute('query', JSON.stringify(args));
        // @ts-expect-error - we want to pass all the args to the original query
        return originalQuery(...args);
      });
    };

    const db = drizzle({ client: pool });

    super(db);
  }
}
