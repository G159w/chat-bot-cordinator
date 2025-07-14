import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { ConsoleTransport, LogLayer } from 'loglayer';

import { DbService } from '../db/db.service';
import * as schema from '../db/schema';

export class TestDbService extends DbService {
	constructor() {
		const pglite = new PGlite();
		const db = drizzle(pglite, { schema });

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
