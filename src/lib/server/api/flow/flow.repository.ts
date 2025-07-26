import type {
  Flow,
  FlowExecution,
  Task,
  TaskConnection,
  TaskExecution,
  TaskInput,
  TaskOutput
} from '$lib/server/db/schema';

import { DbRepository } from '$lib/server/db/db.service';
import { DbService } from '$lib/server/db/db.service';
import {
  crewTable,
  flowExecutionTable,
  flowTable,
  taskConnectionTable,
  taskExecutionTable,
  taskInputTable,
  taskOutputTable,
  taskTable
} from '$lib/server/db/schema';
import { opentelemetry } from '$server/api/utils/opentelemetry.decorator';
import { inject, injectable } from '@needle-di/core';
import { and, asc, desc, eq } from 'drizzle-orm';

@injectable()
@opentelemetry()
export class FlowRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: { crewId: string; description?: string; name: string }): Promise<Flow> {
    const [result] = await this.db.insert(flowTable).values(data).returning();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(flowTable).where(eq(flowTable.id, id));
  }

  async findByCrewId(crewId: string): Promise<Flow[]> {
    return this.db
      .select()
      .from(flowTable)
      .where(eq(flowTable.crewId, crewId))
      .orderBy(desc(flowTable.createdAt));
  }

  async findById(id: string, userId: string): Promise<Flow | null> {
    // Join with crew table to check if the flow belongs to a crew owned by the user
    const [result] = await this.db
      .select()
      .from(flowTable)
      .innerJoin(crewTable, eq(flowTable.crewId, crewTable.id))
      .where(and(eq(flowTable.id, id), eq(crewTable.userId, userId)))
      .limit(1);

    return result?.flow || null;
  }

  async update(
    id: string,
    data: {
      description?: string;
      isActive?: boolean;
      name?: string;
    }
  ): Promise<Flow | null> {
    const [result] = await this.db
      .update(flowTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(flowTable.id, id))
      .returning();

    return result || null;
  }
}

@injectable()
export class TaskRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    config?: Record<string, unknown>;
    description?: string;
    flowId: string;
    name: string;
    order: number;
    taskType: string;
  }): Promise<Task> {
    const [result] = await this.db.insert(taskTable).values(data).returning();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(taskTable).where(eq(taskTable.id, id));
  }

  async findByFlowId(flowId: string): Promise<Task[]> {
    return this.db
      .select()
      .from(taskTable)
      .where(eq(taskTable.flowId, flowId))
      .orderBy(asc(taskTable.order));
  }

  async findById(id: string): Promise<null | Task> {
    const [result] = await this.db.select().from(taskTable).where(eq(taskTable.id, id)).limit(1);

    return result || null;
  }

  async update(
    id: string,
    data: {
      config?: Record<string, unknown>;
      description?: string;
      name?: string;
      order?: number;
      taskType?: string;
    }
  ): Promise<null | Task> {
    const [result] = await this.db
      .update(taskTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskTable.id, id))
      .returning();

    return result || null;
  }
}

@injectable()
export class TaskInputRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    inputType: string;
    name: string;
    required?: boolean;
    taskId: string;
    value?: string;
  }): Promise<TaskInput> {
    const [result] = await this.db.insert(taskInputTable).values(data).returning();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(taskInputTable).where(eq(taskInputTable.id, id));
  }

  async findByTaskId(taskId: string): Promise<TaskInput[]> {
    return this.db
      .select()
      .from(taskInputTable)
      .where(eq(taskInputTable.taskId, taskId))
      .orderBy(asc(taskInputTable.name));
  }

  async update(
    id: string,
    data: {
      inputType?: string;
      name?: string;
      required?: boolean;
      value?: string;
    }
  ): Promise<null | TaskInput> {
    const [result] = await this.db
      .update(taskInputTable)
      .set({ ...data, createdAt: new Date() })
      .where(eq(taskInputTable.id, id))
      .returning();

    return result || null;
  }
}

@injectable()
export class TaskOutputRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: { name: string; outputType: string; taskId: string }): Promise<TaskOutput> {
    const [result] = await this.db.insert(taskOutputTable).values(data).returning();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(taskOutputTable).where(eq(taskOutputTable.id, id));
  }

  async findByTaskId(taskId: string): Promise<TaskOutput[]> {
    return this.db
      .select()
      .from(taskOutputTable)
      .where(eq(taskOutputTable.taskId, taskId))
      .orderBy(asc(taskOutputTable.name));
  }

  async update(
    id: string,
    data: {
      name?: string;
      outputType?: string;
    }
  ): Promise<null | TaskOutput> {
    const [result] = await this.db
      .update(taskOutputTable)
      .set({ ...data, createdAt: new Date() })
      .where(eq(taskOutputTable.id, id))
      .returning();

    return result || null;
  }
}

@injectable()
export class TaskConnectionRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    sourceOutputId: string;
    sourceTaskId: string;
    targetInputId: string;
    targetTaskId: string;
  }): Promise<TaskConnection> {
    const [result] = await this.db.insert(taskConnectionTable).values(data).returning();
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(taskConnectionTable).where(eq(taskConnectionTable.id, id));
  }

  async findByFlowId(flowId: string): Promise<TaskConnection[]> {
    return this.db
      .select({
        createdAt: taskConnectionTable.createdAt,
        id: taskConnectionTable.id,
        sourceOutputId: taskConnectionTable.sourceOutputId,
        sourceTaskId: taskConnectionTable.sourceTaskId,
        targetInputId: taskConnectionTable.targetInputId,
        targetTaskId: taskConnectionTable.targetTaskId
      })
      .from(taskConnectionTable)
      .innerJoin(taskTable, eq(taskConnectionTable.sourceTaskId, taskTable.id))
      .where(eq(taskTable.flowId, flowId));
  }
}

@injectable()
export class FlowExecutionRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    flowId: string;
    input?: Record<string, unknown>;
    status?: string;
    userId: string;
  }): Promise<FlowExecution> {
    const [result] = await this.db.insert(flowExecutionTable).values(data).returning();
    return result;
  }

  async findById(id: string, userId: string): Promise<FlowExecution | null> {
    const [result] = await this.db
      .select()
      .from(flowExecutionTable)
      .where(and(eq(flowExecutionTable.id, id), eq(flowExecutionTable.userId, userId)))
      .limit(1);

    return result || null;
  }

  async findByUserId(userId: string): Promise<FlowExecution[]> {
    return this.db
      .select()
      .from(flowExecutionTable)
      .where(eq(flowExecutionTable.userId, userId))
      .orderBy(desc(flowExecutionTable.createdAt));
  }

  async updateStatus(
    id: string,
    status: string,
    result?: Record<string, unknown>
  ): Promise<FlowExecution | null> {
    const [updatedResult] = await this.db
      .update(flowExecutionTable)
      .set({
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
        result,
        status
      })
      .where(eq(flowExecutionTable.id, id))
      .returning();

    return updatedResult || null;
  }
}

@injectable()
export class TaskExecutionRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    flowExecutionId: string;
    input?: Record<string, unknown>;
    status?: string;
    taskId: string;
  }): Promise<TaskExecution> {
    const [result] = await this.db.insert(taskExecutionTable).values(data).returning();
    return result;
  }

  async findByFlowExecutionId(flowExecutionId: string): Promise<TaskExecution[]> {
    return this.db
      .select()
      .from(taskExecutionTable)
      .where(eq(taskExecutionTable.flowExecutionId, flowExecutionId))
      .orderBy(asc(taskExecutionTable.startedAt));
  }

  async findById(id: string): Promise<null | TaskExecution> {
    const [result] = await this.db
      .select()
      .from(taskExecutionTable)
      .where(eq(taskExecutionTable.id, id))
      .limit(1);

    return result || null;
  }

  async updateStatus(
    id: string,
    status: string,
    output?: Record<string, unknown>,
    tokensUsed?: number,
    cost?: number,
    duration?: number,
    error?: string
  ): Promise<null | TaskExecution> {
    const [result] = await this.db
      .update(taskExecutionTable)
      .set({
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
        cost,
        duration,
        error,
        output,
        status,
        tokensUsed
      })
      .where(eq(taskExecutionTable.id, id))
      .returning();

    return result || null;
  }
}
