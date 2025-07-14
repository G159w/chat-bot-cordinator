import type { AgentExecution, ExecutionStep, WorkflowExecution } from '$lib/server/db/schema';

import { DbRepository } from '$lib/server/db/db.service';
import { DbService } from '$lib/server/db/db.service';
import {
  agentExecutionTable,
  agentTable,
  executionStepTable,
  workflowExecutionTable
} from '$lib/server/db/schema';
import { inject, injectable } from '@needle-di/core';
import { and, eq } from 'drizzle-orm';

@injectable()
export class AgentExecutionRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    agentId: string;
    input: string;
    status?: string;
    workflowExecutionId: string;
  }): Promise<AgentExecution> {
    const [result] = await this.db.insert(agentExecutionTable).values(data).returning();

    return result;
  }

  async findById(id: string): Promise<AgentExecution | null> {
    const [result] = await this.db
      .select()
      .from(agentExecutionTable)
      .where(eq(agentExecutionTable.id, id))
      .limit(1);

    return result || null;
  }

  async updateStatus(
    id: string,
    status: string,
    output?: string,
    tokensUsed?: number,
    cost?: number
  ): Promise<AgentExecution | null> {
    const [result] = await this.db
      .update(agentExecutionTable)
      .set({
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
        cost,
        output,
        status,
        tokensUsed
      })
      .where(eq(agentExecutionTable.id, id))
      .returning();

    return result || null;
  }
}

@injectable()
export class ExecutionStepRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    agentExecutionId: string;
    duration?: number;
    input?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    output?: Record<string, unknown>;
    stepType: string;
  }): Promise<ExecutionStep> {
    const [result] = await this.db.insert(executionStepTable).values(data).returning();

    return result;
  }

  async findByAgentExecutionId(agentExecutionId: string): Promise<ExecutionStep[]> {
    return this.db
      .select()
      .from(executionStepTable)
      .where(eq(executionStepTable.agentExecutionId, agentExecutionId))
      .orderBy(executionStepTable.timestamp);
  }
}

@injectable()
export class WorkflowRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: {
    crewId: string;
    input: string;
    status?: string;
    userId: string;
  }): Promise<WorkflowExecution> {
    const [result] = await this.db.insert(workflowExecutionTable).values(data).returning();

    return result;
  }

  async findById(id: string, userId: string): Promise<null | WorkflowExecution> {
    const [result] = await this.db
      .select()
      .from(workflowExecutionTable)
      .where(and(eq(workflowExecutionTable.id, id), eq(workflowExecutionTable.userId, userId)))
      .limit(1);

    return result || null;
  }

  async findByUserId(userId: string): Promise<WorkflowExecution[]> {
    return this.db
      .select()
      .from(workflowExecutionTable)
      .where(eq(workflowExecutionTable.userId, userId))
      .orderBy(workflowExecutionTable.startedAt);
  }

  async getExecutionWithDetails(
    id: string
  ): Promise<(AgentExecution & { agent: { name: string; role: string } })[]> {
    const agentExecutionsResults = await this.db
      .select({
        agent: {
          name: agentTable.name,
          role: agentTable.role
        },
        agentId: agentExecutionTable.agentId,
        completedAt: agentExecutionTable.completedAt,
        cost: agentExecutionTable.cost,
        id: agentExecutionTable.id,
        input: agentExecutionTable.input,
        metadata: agentExecutionTable.metadata,
        output: agentExecutionTable.output,
        startedAt: agentExecutionTable.startedAt,
        status: agentExecutionTable.status,
        tokensUsed: agentExecutionTable.tokensUsed,
        workflowExecutionId: agentExecutionTable.workflowExecutionId
      })
      .from(agentExecutionTable)
      .innerJoin(agentTable, eq(agentExecutionTable.agentId, agentTable.id))
      .where(eq(agentExecutionTable.workflowExecutionId, id))
      .orderBy(agentExecutionTable.startedAt);

    const agentExecutions = agentExecutionsResults.map((result) => ({
      agent: result.agent,
      agentId: result.agentId,
      completedAt: result.completedAt,
      cost: result.cost,
      id: result.id,
      input: result.input,
      metadata: result.metadata,
      output: result.output,
      startedAt: result.startedAt,
      status: result.status,
      tokensUsed: result.tokensUsed,
      workflowExecutionId: result.workflowExecutionId
    }));

    return agentExecutions;
  }

  async updateStatus(
    id: string,
    status: string,
    result?: string
  ): Promise<null | WorkflowExecution> {
    const [updatedResult] = await this.db
      .update(workflowExecutionTable)
      .set({
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
        result,
        status
      })
      .where(eq(workflowExecutionTable.id, id))
      .returning();

    return updatedResult || null;
  }
}
