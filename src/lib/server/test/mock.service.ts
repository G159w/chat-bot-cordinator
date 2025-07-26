import { DbService } from '$server/db/db.service';
import * as schema from '$server/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, PgliteDatabase } from 'drizzle-orm/pglite';
import { ConsoleTransport, LogLayer } from 'loglayer';

export class TestDbService extends DbService<PgliteDatabase<typeof schema>> {
  constructor() {
    const pglite = new PGlite();
    // Don't know why drizzle type is not working here
    // @ts-expect-error - client: pglite is not typed correctly
    const db = drizzle({ client: pglite, schema: schema }) as PgliteDatabase<typeof schema>;

    super(db);
  }
}

export class TestLogger extends LogLayer {
  constructor() {
    super({
      transport: new ConsoleTransport({
        enabled: false,
        logger: console
      })
    });
  }
}
