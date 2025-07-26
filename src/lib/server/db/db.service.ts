import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { env } from '$env/dynamic/private';
import * as schema from '$server/db/schema';
import { record } from '@elysiajs/opentelemetry';
import { inject } from '@needle-di/core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type QueryArrayResult } from 'pg';

export abstract class DbRepository {
  public db: NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

  constructor(protected readonly dbService = inject(DbService)) {
    this.db = dbService.db;
  }
}

export abstract class DbService<
  T extends NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>
> {
  db: T;

  constructor(db: T) {
    this.db = db;
  }
}

export class PgDbService extends DbService<NodePgDatabase<typeof schema>> {
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

    // @ts-expect-error - client: pool is not typed correctly
    const db = drizzle({ client: pool, schema }) as NodePgDatabase<typeof schema>;

    super(db);
  }
}
