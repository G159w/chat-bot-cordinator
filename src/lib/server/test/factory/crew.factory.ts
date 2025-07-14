import { faker } from '@faker-js/faker';

import * as schema from '../../db/schema';
// Types for crew factory
import { TestDbService } from '../mock.service';

export interface CreateAgentData {
  description?: string;
  instructions: string;
  isCoordinator?: boolean;
  model?: string;
  name: string;
  order?: number;
  role: string;
  temperature?: number;
  tools?: string[];
}

export interface CreateCrewData {
  description?: string;
  isActive?: boolean;
  name: string;
  userId: string;
}

export type Crew = typeof schema.crewTable.$inferSelect;

export interface CrewWithAgentsData extends CreateCrewData {
  agents?: CreateAgentData[];
}

export class CrewFactory {
  private dbService: TestDbService;

  constructor(dbService: TestDbService) {
    this.dbService = dbService;
  }

  /**
   * Creates a basic crew with minimal required data
   */
  async createBasicCrew(overrides: Partial<CreateCrewData> = {}): Promise<Crew> {
    const crewData = this.createBasicCrewData(overrides);
    const result = await this.dbService.db.insert(schema.crewTable).values(crewData).returning();
    return result[0];
  }

  /**
   * Creates a content creation crew
   */
  async createContentCrew(overrides: Partial<CrewWithAgentsData> = {}): Promise<Crew> {
    const crewData = this.createContentCrewData(overrides);
    const result = await this.dbService.db.insert(schema.crewTable).values(crewData).returning();
    return result[0];
  }

  /**
   * Creates a crew for a specific user
   */
  async createCrewForUser(userId: string, overrides: Partial<CreateCrewData> = {}): Promise<Crew> {
    const crewData = this.createBasicCrewData({
      userId,
      ...overrides
    });
    const result = await this.dbService.db.insert(schema.crewTable).values(crewData).returning();
    return result[0];
  }

  /**
   * Creates a crew with agents
   */
  async createCrewWithAgents(overrides: Partial<CrewWithAgentsData> = {}): Promise<Crew> {
    const crewData = this.createCrewWithAgentsData(overrides);
    const result = await this.dbService.db.insert(schema.crewTable).values(crewData).returning();
    return result[0];
  }

  /**
   * Creates a crew with custom agents
   */
  async createCrewWithCustomAgents(
    agents: CreateAgentData[],
    overrides: Partial<CreateCrewData> = {}
  ): Promise<Crew> {
    const crewData = this.createCrewWithCustomAgentsData(agents, overrides);
    const result = await this.dbService.db.insert(schema.crewTable).values(crewData).returning();
    return result[0];
  }

  /**
   * Creates multiple crews for testing
   */
  async createMultipleCrews(
    count: number = 3,
    overrides: Partial<CreateCrewData> = {}
  ): Promise<Crew[]> {
    const crews: Crew[] = [];

    for (let i = 0; i < count; i++) {
      const crewData: CreateCrewData = {
        description: faker.lorem.sentence(),
        isActive: faker.datatype.boolean(),
        name: faker.company.name(),
        userId: faker.string.uuid(),
        ...overrides
      };

      const result = await this.dbService.db.insert(schema.crewTable).values(crewData).returning();
      crews.push(result[0]);
    }

    return crews;
  }

  /**
   * Creates a research-focused crew
   */
  async createResearchCrew(overrides: Partial<CrewWithAgentsData> = {}): Promise<Crew> {
    const crewData = this.createResearchCrewData(overrides);
    const result = await this.dbService.db.insert(schema.crewTable).values(crewData).returning();
    return result[0];
  }

  /**
   * Creates basic crew data (without database operation)
   */
  private createBasicCrewData(overrides: Partial<CreateCrewData> = {}): CreateCrewData {
    return {
      description: faker.lorem.sentence(),
      isActive: faker.datatype.boolean(),
      name: faker.company.name(),
      userId: faker.string.uuid(),
      ...overrides
    };
  }

  /**
   * Creates content crew data (without database operation)
   */
  private createContentCrewData(overrides: Partial<CrewWithAgentsData> = {}): CreateCrewData {
    return {
      description: faker.lorem.sentence(),
      isActive: faker.datatype.boolean(),
      name: faker.company.name(),
      userId: faker.string.uuid(),
      ...overrides
    };
  }

  /**
   * Creates crew with agents data (without database operation)
   */
  private createCrewWithAgentsData(overrides: Partial<CrewWithAgentsData> = {}): CreateCrewData {
    return {
      description: faker.lorem.sentence(),
      isActive: faker.datatype.boolean(),
      name: faker.company.name(),
      userId: faker.string.uuid(),
      ...overrides
    };
  }

  /**
   * Creates crew with custom agents data (without database operation)
   */
  private createCrewWithCustomAgentsData(
    agents: CreateAgentData[],
    overrides: Partial<CreateCrewData> = {}
  ): CreateCrewData {
    return {
      description: faker.lorem.sentence(),
      isActive: faker.datatype.boolean(),
      name: faker.company.name(),
      userId: faker.string.uuid(),
      ...overrides
    };
  }

  /**
   * Creates research crew data (without database operation)
   */
  private createResearchCrewData(overrides: Partial<CrewWithAgentsData> = {}): CreateCrewData {
    return {
      description: faker.lorem.sentence(),
      isActive: faker.datatype.boolean(),
      name: faker.company.name(),
      userId: faker.string.uuid(),
      ...overrides
    };
  }
}
