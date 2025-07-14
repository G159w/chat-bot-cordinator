import { faker } from '@faker-js/faker';

import * as schema from '../../db/schema';
// Types for agent factory
import { TestDbService } from '../mock.service';

export type Agent = typeof schema.agentTable.$inferSelect;

export interface CreateAgentData {
  crewId?: string;
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

export class AgentFactory {
  private dbService: TestDbService;

  constructor(dbService: TestDbService) {
    this.dbService = dbService;
  }

  /**
   * Creates agents for a specific crew
   */
  async createAgentsForCrew(
    crewId: string,
    overrides: Partial<CreateAgentData> = {}
  ): Promise<Agent[]> {
    const agentDataArray = [
      this.createCoordinatorAgentData({ crewId, ...overrides }),
      this.createResearchAgentData({ crewId, order: 1, ...overrides }),
      this.createWriterAgentData({ crewId, order: 2, ...overrides })
    ];

    const createdAgents: Agent[] = [];
    for (const agentData of agentDataArray) {
      const result = await this.dbService.db
        .insert(schema.agentTable)
        .values(agentData)
        .returning();
      createdAgents.push(result[0]);
    }

    return createdAgents;
  }

  /**
   * Creates an analyst agent
   */
  async createAnalystAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createAnalystAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates a basic agent with minimal required data
   */
  async createBasicAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createBasicAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates a content creation team of agents
   */
  async createContentTeam(
    crewId: string,
    overrides: Partial<CreateAgentData> = {}
  ): Promise<Agent[]> {
    const agentDataArray = [
      this.createCoordinatorAgentData({
        crewId,
        name: 'Content Strategist',
        ...overrides
      }),
      this.createResearchAgentData({
        crewId,
        name: 'Content Researcher',
        order: 1,
        ...overrides
      }),
      this.createWriterAgentData({
        crewId,
        name: 'Content Writer',
        order: 2,
        ...overrides
      }),
      this.createEditorAgentData({
        crewId,
        name: 'Content Editor',
        order: 3,
        ...overrides
      })
    ];

    const createdAgents: Agent[] = [];
    for (const agentData of agentDataArray) {
      const result = await this.dbService.db
        .insert(schema.agentTable)
        .values(agentData)
        .returning();
      createdAgents.push(result[0]);
    }

    return createdAgents;
  }

  /**
   * Creates a coordinator agent
   */
  async createCoordinatorAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createCoordinatorAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates a creative agent
   */
  async createCreativeAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createCreativeAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates an editor agent
   */
  async createEditorAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createEditorAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates multiple agents for testing
   */
  async createMultipleAgents(
    count: number = 3,
    overrides: Partial<CreateAgentData> = {}
  ): Promise<Agent[]> {
    const agents: Agent[] = [];

    for (let i = 0; i < count; i++) {
      const agentData: CreateAgentData = {
        description: faker.lorem.sentence(),
        instructions: faker.lorem.paragraph(),
        isCoordinator: i === 0,
        model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
        name: faker.person.fullName(),
        order: i,
        role: faker.person.jobTitle(),
        temperature: faker.number.int({ max: 100, min: 0 }),
        tools: faker.helpers.arrayElements(['web_search', 'file_reader', 'calculator'], {
          max: 3,
          min: 0
        }),
        ...overrides
      };

      const result = await this.dbService.db
        .insert(schema.agentTable)
        .values(agentData)
        .returning();
      agents.push(result[0]);
    }

    return agents;
  }

  /**
   * Creates a research agent
   */
  async createResearchAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createResearchAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates a research team of agents
   */
  async createResearchTeam(
    crewId: string,
    overrides: Partial<CreateAgentData> = {}
  ): Promise<Agent[]> {
    const agentDataArray = [
      this.createCoordinatorAgentData({
        crewId,
        name: 'Research Coordinator',
        ...overrides
      }),
      this.createResearchAgentData({
        crewId,
        name: 'Data Researcher',
        order: 1,
        ...overrides
      }),
      this.createAnalystAgentData({
        crewId,
        name: 'Data Analyst',
        order: 2,
        ...overrides
      }),
      this.createWriterAgentData({
        crewId,
        name: 'Report Writer',
        order: 3,
        ...overrides
      })
    ];

    const createdAgents: Agent[] = [];
    for (const agentData of agentDataArray) {
      const result = await this.dbService.db
        .insert(schema.agentTable)
        .values(agentData)
        .returning();
      createdAgents.push(result[0]);
    }

    return createdAgents;
  }

  /**
   * Creates a technical agent
   */
  async createTechnicalAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createTechnicalAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates a writer agent
   */
  async createWriterAgent(overrides: Partial<CreateAgentData> = {}): Promise<Agent> {
    const agentData = this.createWriterAgentData(overrides);
    const result = await this.dbService.db.insert(schema.agentTable).values(agentData).returning();
    return result[0];
  }

  /**
   * Creates analyst agent data (without database operation)
   */
  private createAnalystAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: false,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 1,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['analyze', 'visualize', 'report'], { max: 3, min: 0 }),
      ...overrides
    };
  }

  /**
   * Creates basic agent data (without database operation)
   */
  private createBasicAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: false,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 0,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['web_search', 'file_reader', 'calculator'], {
        max: 3,
        min: 0
      }),
      ...overrides
    };
  }

  /**
   * Creates coordinator agent data (without database operation)
   */
  private createCoordinatorAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: true,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 0,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['delegate', 'monitor', 'synthesize'], { max: 3, min: 0 }),
      ...overrides
    };
  }

  /**
   * Creates creative agent data (without database operation)
   */
  private createCreativeAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: false,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 1,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['brainstorm', 'innovate', 'create'], { max: 3, min: 0 }),
      ...overrides
    };
  }

  /**
   * Creates editor agent data (without database operation)
   */
  private createEditorAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: false,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 3,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['review', 'edit', 'validate'], { max: 3, min: 0 }),
      ...overrides
    };
  }

  /**
   * Creates research agent data (without database operation)
   */
  private createResearchAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: false,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 1,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['search', 'analyze', 'summarize'], { max: 3, min: 0 }),
      ...overrides
    };
  }

  /**
   * Creates technical agent data (without database operation)
   */
  private createTechnicalAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: false,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 1,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['debug', 'optimize', 'implement'], { max: 3, min: 0 }),
      ...overrides
    };
  }

  /**
   * Creates writer agent data (without database operation)
   */
  private createWriterAgentData(overrides: Partial<CreateAgentData> = {}): CreateAgentData {
    return {
      description: faker.lorem.sentence(),
      instructions: faker.lorem.paragraph(),
      isCoordinator: false,
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3']),
      name: faker.person.fullName(),
      order: 2,
      role: faker.person.jobTitle(),
      temperature: faker.number.int({ max: 100, min: 0 }),
      tools: faker.helpers.arrayElements(['write', 'edit', 'format'], { max: 3, min: 0 }),
      ...overrides
    };
  }
}
