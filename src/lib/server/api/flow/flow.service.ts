import type { Flow, FlowExecution, Task, TaskExecution } from '$lib/server/db/schema';

import { CrewRepository } from '$server/api/crew/crew.repository';
import {
  FlowExecutionRepository,
  FlowRepository,
  TaskExecutionRepository,
  TaskRepository
} from '$server/api/flow/flow.repository';
import { opentelemetry } from '$server/api/utils/opentelemetry.decorator';
import { inject, injectable } from '@needle-di/core';
import { err, ok, Result } from 'neverthrow';

@injectable()
@opentelemetry()
export class FlowService {
  constructor(
    private readonly crewRepository = inject(CrewRepository),
    private readonly flowRepository = inject(FlowRepository),
    private readonly taskRepository = inject(TaskRepository),
    private readonly flowExecutionRepository = inject(FlowExecutionRepository),
    private readonly taskExecutionRepository = inject(TaskExecutionRepository)
  ) {}

  // Flow management methods
  async createFlow(
    userId: string,
    data: {
      crewId: string;
      description?: string;
      name: string;
    }
  ): Promise<Result<Flow, 'CREW_NOT_FOUND'>> {
    // Verify crew belongs to user
    const crew = await this.crewRepository.findById(data.crewId, userId);
    if (!crew || crew.userId !== userId) {
      return err('CREW_NOT_FOUND');
    }

    const flow = await this.flowRepository.create(data);
    return ok(flow);
  }

  // Task management methods
  async createTask(
    userId: string,
    data: {
      config?: Record<string, unknown>;
      description?: string;
      flowId: string;
      name: string;
      order: number;
      taskType: string;
    }
  ): Promise<Result<Task, 'FLOW_NOT_FOUND'>> {
    // Verify flow belongs to user's crew
    const flow = await this.flowRepository.findById(data.flowId, userId);
    if (!flow) {
      return err('FLOW_NOT_FOUND');
    }

    const task = await this.taskRepository.create(data);
    return ok(task);
  }

  async deleteFlow(id: string, userId: string): Promise<Result<void, 'FLOW_NOT_FOUND'>> {
    const flow = await this.flowRepository.findById(id, userId);
    if (!flow) {
      return err('FLOW_NOT_FOUND');
    }

    await this.flowRepository.delete(id);
    return ok(undefined);
  }

  async deleteTask(id: string): Promise<Result<void, 'TASK_NOT_FOUND'>> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      return err('TASK_NOT_FOUND');
    }

    await this.taskRepository.delete(id);
    return ok(undefined);
  }

  async executeFlow(
    userId: string,
    data: {
      flowId: string;
      input?: Record<string, unknown>;
    }
  ): Promise<
    Result<{ executionId: string }, 'FLOW_INACTIVE' | 'FLOW_NOT_FOUND' | 'NO_TASKS_FOUND_IN_FLOW'>
  > {
    // Verify flow exists and belongs to user's crew
    const flow = await this.flowRepository.findById(data.flowId, userId);
    if (!flow) {
      return err('FLOW_NOT_FOUND');
    }

    if (!flow.isActive) {
      return err('FLOW_INACTIVE');
    }

    // Get tasks for the flow
    const tasks = await this.taskRepository.findByFlowId(data.flowId);
    if (tasks.length === 0) {
      return err('NO_TASKS_FOUND_IN_FLOW');
    }

    // Create flow execution record
    const execution = await this.flowExecutionRepository.create({
      flowId: data.flowId,
      input: data.input,
      status: 'running',
      userId
    });

    // Execute flow asynchronously
    this.executeFlowAsync(execution.id, flow, tasks, data.input);

    return ok({ executionId: execution.id });
  }

  async getExecutionStatus(
    id: string,
    userId: string
  ): Promise<Result<FlowExecution, 'FLOW_EXECUTION_NOT_FOUND'>> {
    const result = await this.flowExecutionRepository.findById(id, userId);
    if (!result || result.userId !== userId) {
      return err('FLOW_EXECUTION_NOT_FOUND');
    }
    return ok(result);
  }

  async getExecutionWithDetails(
    id: string,
    userId: string
  ): Promise<
    Result<
      {
        execution: FlowExecution;
        taskExecutions: TaskExecution[];
      },
      'FLOW_EXECUTION_NOT_FOUND'
    >
  > {
    const execution = await this.flowExecutionRepository.findById(id, userId);
    if (!execution || execution.userId !== userId) {
      return err('FLOW_EXECUTION_NOT_FOUND');
    }

    const taskExecutions = await this.taskExecutionRepository.findByFlowExecutionId(id);

    return ok({
      execution,
      taskExecutions
    });
  }

  async getFlowsByCrewId(crewId: string): Promise<Flow[]> {
    return this.flowRepository.findByCrewId(crewId);
  }

  async getTasksByFlowId(
    flowId: string,
    userId: string
  ): Promise<Result<Task[], 'FLOW_NOT_FOUND'>> {
    const flow = await this.flowRepository.findById(flowId, userId);
    if (!flow) {
      return err('FLOW_NOT_FOUND');
    }

    const tasks = await this.taskRepository.findByFlowId(flowId);
    return ok(tasks);
  }

  async updateFlow(
    id: string,
    userId: string,
    data: {
      description?: string;
      isActive?: boolean;
      name?: string;
    }
  ): Promise<Result<Flow, 'FLOW_NOT_FOUND'>> {
    const flow = await this.flowRepository.findById(id, userId);
    if (!flow) {
      return err('FLOW_NOT_FOUND');
    }

    const updatedFlow = await this.flowRepository.update(id, data);
    if (!updatedFlow) {
      return err('FLOW_NOT_FOUND');
    }

    return ok(updatedFlow);
  }

  async updateTask(
    id: string,
    data: {
      config?: Record<string, unknown>;
      description?: string;
      name?: string;
      order?: number;
      taskType?: string;
    }
  ): Promise<Result<Task, 'TASK_NOT_FOUND'>> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      return err('TASK_NOT_FOUND');
    }

    const updatedTask = await this.taskRepository.update(id, data);
    if (!updatedTask) {
      return err('TASK_NOT_FOUND');
    }

    return ok(updatedTask);
  }

  private async executeAgentTask(
    task: {
      config?: null | Record<string, unknown>;
      name: string;
    },
    input?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // TODO: Implement actual agent execution
    // For now, return a mock response
    return {
      config: task.config,
      input: input,
      response: `Mock response from ${task.name}`
    };
  }

  private async executeConditionTask(
    task: {
      config?: null | Record<string, unknown>;
      name: string;
    },
    input?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // TODO: Implement condition evaluation
    // For now, return a mock response
    return {
      condition: true,
      config: task.config,
      input: input,
      result: `Condition ${task.name} evaluated to true`
    };
  }

  private async executeFlowAsync(
    executionId: string,
    flow: { id: string; name: string },
    tasks: Array<{
      config?: null | Record<string, unknown>;
      id: string;
      name: string;
      order: number;
      taskType: string;
    }>,
    input?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Sort tasks by order
      const sortedTasks = tasks.sort((a, b) => a.order - b.order);

      // Execute tasks in order
      for (const task of sortedTasks) {
        await this.executeTask(executionId, task, input);
      }

      // Update flow status
      await this.flowExecutionRepository.updateStatus(executionId, 'completed');
    } catch (error) {
      await this.flowExecutionRepository.updateStatus(executionId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async executeInputTask(
    task: {
      config?: null | Record<string, unknown>;
      name: string;
    },
    input?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // TODO: Implement input processing
    // For now, return the input as is
    return {
      config: task.config,
      processed: input,
      taskName: task.name
    };
  }

  private async executeTask(
    flowExecutionId: string,
    task: {
      config?: null | Record<string, unknown>;
      id: string;
      name: string;
      taskType: string;
    },
    input?: Record<string, unknown>
  ): Promise<TaskExecution & { output: Record<string, unknown> }> {
    // Create task execution record
    const execution = await this.taskExecutionRepository.create({
      flowExecutionId,
      input,
      status: 'running',
      taskId: task.id
    });

    try {
      // Execute task based on type
      const startTime = Date.now();
      const output = await this.executeTaskByType(task, input);
      const duration = Date.now() - startTime;

      // Update task execution
      await this.taskExecutionRepository.updateStatus(
        execution.id,
        'completed',
        output,
        0, // tokensUsed
        0, // cost
        duration
      );

      return { ...execution, output };
    } catch (error) {
      await this.taskExecutionRepository.updateStatus(
        execution.id,
        'failed',
        undefined,
        undefined,
        undefined,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async executeTaskByType(
    task: {
      config?: null | Record<string, unknown>;
      name: string;
      taskType: string;
    },
    input?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    switch (task.taskType) {
      case 'agent':
        return this.executeAgentTask(task, input);
      case 'condition':
        return this.executeConditionTask(task, input);
      case 'input':
        return this.executeInputTask(task, input);
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
}
