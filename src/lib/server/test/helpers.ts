import { ApiController } from '$server/api/api.controller';
import { Logger } from '$server/api/logger';
import { DbService } from '$server/db/db.service';
import { generateFactories } from '$server/test/factory/generate-factories';
import { TestDbService, TestLogger } from '$server/test/mock.service';
import { treaty } from '@elysiajs/eden';
import { Container } from '@needle-di/core';
import { migrate } from 'drizzle-orm/pglite/migrator';

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

  return { apiClient, container, db, dbService, ...factories };
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
