import { treaty } from '@elysiajs/eden';
import { Container } from '@needle-di/core';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { ApiController } from '../api/api.controller';
import { Logger } from '../api/logger';
import { DbService } from '../db/db.service';
import { generateFactories } from './factory/generate-factories';
import { TestDbService, TestLogger } from './mock.service';

// Mock the database module for testing
export const createTestApp = async () => {
  const container = new Container()
    .bind({
      provide: DbService,
      useClass: TestDbService
    })
    .bind({
      provide: Logger,
      useClass: TestLogger
    });

  const dbService = container.get(DbService) as TestDbService;
  const db = dbService.db;

  console.time('✅ Migrating database');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.timeEnd('✅ Migrating database');

  const apiController = container.get(ApiController);

  const baseApp = apiController.app;

  const apiClient = treaty(baseApp);

  const factories = generateFactories(dbService);

  return { apiClient, container, dbService, ...factories };
};

export type TestApi = Awaited<ReturnType<typeof createTestApp>>['apiClient'];

// Helper to create authenticated requests
export const createAuthenticatedRequest = ({ userToken }: { userToken: string }) => {
  return {
    headers: {
      authorization: `Bearer ${userToken}`
    }
  };
};
