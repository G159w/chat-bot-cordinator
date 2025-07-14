import { DbRepository, DbService } from '$lib/server/db/db.service';
import * as schema from '$lib/server/db/schema';
import { inject, injectable } from '@needle-di/core';
import { eq } from 'drizzle-orm';

@injectable()
export class UserRepository extends DbRepository {
	constructor(dbService = inject(DbService)) {
		super(dbService);
	}

	async findUserById(id: string) {
		const [result] = await this.db
			.select()
			.from(schema.userTable)
			.where(eq(schema.userTable.id, id));
		return result;
	}

	async findUserBySessionToken(token: string) {
		const [result] = await this.db
			.select()
			.from(schema.sessionTable)
			.where(eq(schema.sessionTable.sessionToken, token))
			.innerJoin(schema.userTable, eq(schema.sessionTable.userId, schema.userTable.id));
		return result?.user;
	}

	async listUsers() {
		return this.db.select().from(schema.userTable);
	}
}
