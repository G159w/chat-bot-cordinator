import type { AgentExecution, WorkflowExecution } from '$lib/server/db/schema';

import { inject, injectable } from '@needle-di/core';

import { AgentRepository } from '../agent/agent.repository';
import { CrewRepository } from '../crew/crew.repository';
import { BadRequest, NotFound } from '../utils/exceptions';
import {
  AgentExecutionRepository,
  ExecutionStepRepository,
  WorkflowRepository
} from './workflow.repository';

@injectable()
export class WorkflowService {
  constructor(
    private readonly agentRepository = inject(AgentRepository),
    private readonly crewRepository = inject(CrewRepository),
    private readonly workflowRepository = inject(WorkflowRepository),
    private readonly agentExecutionRepository = inject(AgentExecutionRepository),
    private readonly executionStepRepository = inject(ExecutionStepRepository)
  ) {}

  async executeWorkflow(
    userId: string,
    data: {
      crewId: string;
      input: string;
    }
  ): Promise<{ executionId: string }> {
    if (!data.input) {
      throw BadRequest('Input is required');
    }
    // Verify crew belongs to user
    const crew = await this.crewRepository.findById(data.crewId, userId);
    if (!crew || crew.userId !== userId) {
      throw NotFound('Crew not found');
    }

    // Get agents for the crew
    const agents = await this.agentRepository.findByCrewIdAndUser(data.crewId, userId);
    if (agents.length === 0) {
      throw BadRequest('No agents found in crew');
    }

    // Create workflow execution record
    const execution = await this.workflowRepository.create({
      crewId: data.crewId,
      input: data.input,
      status: 'running',
      userId
    });

    // Execute workflow asynchronously
    this.executeWorkflowAsync(
      execution.id,
      { description: crew.description || undefined, id: crew.id, name: crew.name },
      agents,
      data.input
    );

    return { executionId: execution.id };
  }

  async getExecutionStatus(id: string, userId: string): Promise<null | WorkflowExecution> {
    const result = await this.workflowRepository.findById(id, userId);
    if (!result || result.userId !== userId) {
      throw NotFound('Workflow execution not found');
    }
    return result;
  }

  async getExecutionWithDetails(
    id: string,
    userId: string
  ): Promise<null | {
    agentExecutions: (AgentExecution & { agent: { name: string; role: string } })[];
    execution: WorkflowExecution;
  }> {
    const execution = await this.workflowRepository.findById(id, userId);
    if (!execution || execution.userId !== userId) {
      throw NotFound('Workflow execution not found');
    }
    const result = await this.workflowRepository.getExecutionWithDetails(id);
    if (!result) {
      throw NotFound('Workflow execution not found');
    }
    return {
      agentExecutions: result,
      execution
    };
  }

  private async callLLM(agent: { name: string; role: string }, input: string): Promise<string> {
    // TODO: Implement actual LLM call
    // For now, return a mock response
    return `Mock response from ${agent.name} (${agent.role}): ${input}`;
  }

  private async executeAgent(
    workflowExecutionId: string,
    agent: { id: string; instructions: string; model: string; name: string; role: string },
    input: string
  ): Promise<AgentExecution & { output: string }> {
    // Create agent execution record
    const execution = await this.agentExecutionRepository.create({
      agentId: agent.id,
      input,
      status: 'running',
      workflowExecutionId
    });

    try {
      // Execute LLM call (placeholder for now)
      const startTime = Date.now();
      const output = await this.callLLM(agent, input);
      const duration = Date.now() - startTime;

      // Record execution step
      await this.executionStepRepository.create({
        agentExecutionId: execution.id,
        duration,
        input: { messages: [{ content: input, role: 'user' }] },
        metadata: {
          model: agent.model,
          tokensUsed: 0 // TODO: Get from actual LLM response
        },
        output: { response: output },
        stepType: 'llm_call'
      });

      // Update agent execution
      await this.agentExecutionRepository.updateStatus(
        execution.id,
        'completed',
        output,
        0, // tokensUsed
        0 // cost
      );

      return { ...execution, output };
    } catch (error) {
      await this.agentExecutionRepository.updateStatus(
        execution.id,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async executeWorkflowAsync(
    executionId: string,
    crew: { description?: string; id: string; name: string },
    agents: Array<{
      id: string;
      instructions: string;
      isCoordinator: boolean | null;
      model: string;
      name: string;
      role: string;
    }>,
    input: string
  ): Promise<void> {
    try {
      // Find coordinator agent
      const coordinator = agents.find((a) => a.isCoordinator);
      if (!coordinator) {
        throw new Error('No coordinator agent found');
      }

      // Execute coordinator first
      const coordinatorExecution = await this.executeAgent(executionId, coordinator, input);

      // Parse coordinator's plan and execute other agents
      const plan = this.parseCoordinatorPlan(coordinatorExecution.output);

      for (const task of plan.tasks) {
        const targetAgent = agents.find((a) => a.role === task.agentRole);
        if (targetAgent) {
          await this.executeAgent(executionId, targetAgent, task.input);
        }
      }

      // Update workflow status
      await this.workflowRepository.updateStatus(executionId, 'completed');
    } catch (error) {
      await this.workflowRepository.updateStatus(
        executionId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private parseCoordinatorPlan(output: string): {
    tasks: Array<{ agentRole: string; input: string }>;
  } {
    // TODO: Implement proper parsing of coordinator output
    // For now, return a simple structure
    try {
      return JSON.parse(output);
    } catch {
      return { tasks: [] };
    }
  }
}
