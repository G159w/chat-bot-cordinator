import { treaty } from '@elysiajs/eden';
import { Container } from '@needle-di/core';
import { Elysia } from 'elysia';

import { DbService, PgDbService } from '../db/db.service';
import { ApiController } from './api.controller';
import { AuthGuard } from './utils/auth';

const container = new Container().bind({
  provide: DbService,
  useClass: PgDbService
});

const apiController = container.get(ApiController);
const db = container.get(DbService).db;

// For typing purposes
const _authGuardedApp = () => new Elysia().use(container.get(AuthGuard).useGuard);
export type AuthGuardedApp = ReturnType<typeof _authGuardedApp>;

const app = apiController.app;

const serverApiClient = treaty(app);

type App = typeof app;

export { app, type App, db, serverApiClient };
