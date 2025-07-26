import type { UserFactory } from '$server/test/factory/user.factory';

import * as schema from '$server/db/schema';
import { CrewFactory } from '$server/test/factory/crew.factory';
// Types for flow factory
import { TestDbService } from '$server/test/mock.service';
import { faker } from '@faker-js/faker';

export interface CreateFlowData {
  crewId: string;
  description?: string;
  isActive?: boolean;
  name: string;
}

export interface CreateFlowExecutionData {
  flowId: string;
  input?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status?: string;
  userId: string;
}

export interface CreateTaskData {
  config?: Record<string, unknown>;
  description?: string;
  flowId: string;
  name: string;
  order: number;
  taskType: string;
}

export interface CreateTaskExecutionData {
  flowExecutionId: string;
  input?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status?: string;
  taskId: string;
}

export type Flow = typeof schema.flowTable.$inferSelect;
export type FlowExecution = typeof schema.flowExecutionTable.$inferSelect;
export type TaskExecution = typeof schema.taskExecutionTable.$inferSelect;

export class FlowFactory {
  constructor(
    public dbService: TestDbService,
    public crewFactory: CrewFactory,
    public userFactory: UserFactory
  ) {
    this.createBasicFlow = this.createBasicFlow.bind(this);
    this.createBasicFlowExecution = this.createBasicFlowExecution.bind(this);
    this.createCompleteFlow = this.createCompleteFlow.bind(this);
    this.createMultipleFlowExecutions = this.createMultipleFlowExecutions.bind(this);
    this.createMultipleFlows = this.createMultipleFlows.bind(this);
    this.createTaskExecutionsForFlow = this.createTaskExecutionsForFlow.bind(this);
  }

  /**
   * Creates a basic flow with minimal required data
   */
  async createBasicFlow(overrides: Partial<CreateFlowData> = {}): Promise<Flow> {
    const flowData = await this.createBasicFlowData(overrides);
    const result = await this.dbService.db.insert(schema.flowTable).values(flowData).returning();
    return result[0];
  }

  /**
   * Creates a basic flow execution with minimal required data
   */
  async createBasicFlowExecution(
    overrides: Partial<CreateFlowExecutionData> = {},
    flowOverrides: Partial<CreateFlowData> = {}
  ): Promise<FlowExecution> {
    // First create a flow if flowId is not provided
    let flowId = overrides.flowId;
    if (!flowId) {
      const flow = await this.createBasicFlow(flowOverrides);
      flowId = flow.id;
    }

    const flowExecutionData = this.createBasicFlowExecutionData({
      flowId,
      ...overrides
    });

    const result = await this.dbService.db
      .insert(schema.flowExecutionTable)
      .values(flowExecutionData)
      .returning();
    return result[0];
  }

  async createBasicTask({ flowId }: { flowId: string }) {
    const taskData: CreateTaskData = {
      config: { agentId: faker.string.uuid() },
      description: faker.lorem.sentence(),
      flowId,
      name: faker.company.catchPhrase(),
      order: 1,
      taskType: 'agent'
    };

    const result = await this.dbService.db.insert(schema.taskTable).values(taskData).returning();
    return result[0];
  }

  /**
   * Creates a complete flow with all related data
   */
  async createCompleteFlow(
    flowId: string,
    userId: string,
    taskIds: string[],
    overrides: {
      flowExecution?: Partial<CreateFlowExecutionData>;
      taskExecutions?: Partial<CreateTaskExecutionData>;
    } = {}
  ) {
    const flowExecution = await this.createBasicFlowExecution({
      flowId,
      userId,
      ...overrides.flowExecution
    });

    const taskExecutions = await this.createTaskExecutionsForFlow(
      flowExecution.id,
      taskIds,
      overrides.taskExecutions
    );

    return {
      flowExecution,
      taskExecutions
    };
  }

  /**
   * Creates multiple flow executions for testing
   */
  async createMultipleFlowExecutions(
    count: number = 3,
    overrides: Partial<CreateFlowExecutionData> = {}
  ): Promise<FlowExecution[]> {
    const flowExecutions: FlowExecution[] = [];

    for (let i = 0; i < count; i++) {
      const flowExecution = await this.createBasicFlowExecution({
        input: { text: faker.lorem.paragraph() },
        metadata: {
          flowType: faker.helpers.arrayElement(['research', 'content', 'analysis']),
          testIndex: i + 1
        },
        status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
        ...overrides
      });
      flowExecutions.push(flowExecution);
    }

    return flowExecutions;
  }

  /**
   * Creates multiple flows for testing
   */
  async createMultipleFlows(
    count: number = 3,
    overrides: Partial<CreateFlowData> = {}
  ): Promise<Flow[]> {
    const flows: Flow[] = [];

    for (let i = 0; i < count; i++) {
      const flowData: CreateFlowData = {
        crewId: faker.string.uuid(),
        description: faker.lorem.sentence(),
        isActive: true, // Default to active for tests
        name: faker.company.catchPhrase(),
        ...overrides
      };

      const result = await this.dbService.db.insert(schema.flowTable).values(flowData).returning();
      flows.push(result[0]);
    }

    return flows;
  }

  /**
   * Creates task executions for a flow execution
   */
  async createTaskExecutionsForFlow(
    flowExecutionId: string,
    taskIds: string[],
    overrides: Partial<CreateTaskExecutionData> = {}
  ): Promise<TaskExecution[]> {
    const taskExecutions: TaskExecution[] = [];

    for (let i = 0; i < taskIds.length; i++) {
      const taskExecutionData: CreateTaskExecutionData = {
        flowExecutionId,
        input: { text: faker.lorem.paragraph() },
        metadata: {
          executionType: faker.helpers.arrayElement(['research', 'analysis', 'creation']),
          order: i
        },
        output: { result: faker.lorem.sentence() },
        status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
        taskId: taskIds[i],
        ...overrides
      };

      const result = await this.dbService.db
        .insert(schema.taskExecutionTable)
        .values(taskExecutionData)
        .returning();
      taskExecutions.push(result[0]);
    }

    return taskExecutions;
  }

  /**
   * Creates basic flow data (without database operation)
   */
  private async createBasicFlowData(
    overrides: Partial<CreateFlowData> = {}
  ): Promise<CreateFlowData> {
    // Create a crew first if crewId is not provided
    let crewId = overrides.crewId;
    if (!crewId) {
      // Create a valid user for the crew
      const { createdUser } = await this.userFactory.createBasicUser();
      const crew = await this.crewFactory.createBasicCrew({ userId: createdUser.id });
      crewId = crew.id;
    }

    return {
      crewId,
      description: faker.lorem.sentence(),
      isActive: true, // Default to active for tests
      name: faker.company.catchPhrase(),
      ...overrides
    };
  }

  /**
   * Creates basic flow execution data (without database operation)
   */
  private createBasicFlowExecutionData(
    overrides: Partial<CreateFlowExecutionData> = {}
  ): CreateFlowExecutionData {
    return {
      flowId: faker.string.uuid(),
      input: { text: faker.lorem.paragraph() },
      metadata: {},
      status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
      userId: faker.string.uuid(),
      ...overrides
    };
  }
}
