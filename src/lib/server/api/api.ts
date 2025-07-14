import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { Container } from '@needle-di/core';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { Elysia } from 'elysia';

import { DbService } from '../db/db.service';
import * as schema from '../db/schema';
import { userTable } from '../db/schema';
import { TestDbService } from '../test/mock.service';
import { ApiController } from './api.controller';
import { UserRepository } from './user/user.repository';
import { AuthGuard } from './utils/auth';

const container = new Container().bind({
	provide: DbService,
	useClass: TestDbService
});
const apiController = container.get(ApiController);

const db = container.get(DbService).db as PgliteDatabase<typeof schema>;

console.time('✅ Migrated database');
await migrate(db, { migrationsFolder: './drizzle' });
const userRepository = container.get(UserRepository);
await userRepository.db.insert(userTable).values({
	id: 'test_user_id',
	name: 'test_user'
});
console.timeEnd('✅ Migrated database');

const _authGuardedApp = () => new Elysia().use(container.get(AuthGuard).useGuard);
export type AuthGuardedApp = ReturnType<typeof _authGuardedApp>;

const app = apiController.app;

type App = typeof app;

export { app, type App, db };
