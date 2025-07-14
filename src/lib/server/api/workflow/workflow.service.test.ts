import { testingModule } from '$lib/server/test/setup';
import { describe, expect, it } from 'bun:test';

import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
	const { agentFactory, container, crewFactory, userFactory, workflowFactory } = testingModule;
	const workflowService = container.get(WorkflowService);

	describe('executeWorkflow', () => {
		it('should execute workflow successfully', async () => {
			const createUser = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createUser.createdUser.id
			});

			// Create agents for the crew
			await agentFactory.createCoordinatorAgent({
				crewId: createdCrew.id,
				instructions: 'You coordinate the workflow',
				model: 'gpt-4',
				name: 'Coordinator',
				role: 'Coordinator'
			});

			await agentFactory.createBasicAgent({
				crewId: createdCrew.id,
				instructions: 'You are a researcher',
				model: 'gpt-4',
				name: 'Researcher',
				role: 'Researcher'
			});

			const executionData = {
				crewId: createdCrew.id,
				input: 'Research the latest AI developments'
			};

			const result = await workflowService.executeWorkflow(
				createUser.createdUser.id,
				executionData
			);

			expect(result).toBeDefined();
			expect(result.executionId).toBeDefined();
			expect(typeof result.executionId).toBe('string');
		});

		it('should throw error for crew not owned by user', async () => {
			const { createdUser: createUser1 } = await userFactory.createBasicUser();
			const { createdUser: createUser2 } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createUser1.id
			});

			const executionData = {
				crewId: createdCrew.id,
				input: 'Research the latest AI developments'
			};

			expect(workflowService.executeWorkflow(createUser2.id, executionData)).rejects.toThrow(
				'Crew not found'
			);
		});

		it('should throw error for non-existent crew', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const executionData = {
				crewId: '00000000-0000-0000-0000-000000000000',
				input: 'Research the latest AI developments'
			};

			await expect(workflowService.executeWorkflow(createdUser.id, executionData)).rejects.toThrow(
				'Crew not found'
			);
		});

		it('should throw error for crew with no agents', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			const executionData = {
				crewId: createdCrew.id,
				input: 'Research the latest AI developments'
			};

			await expect(workflowService.executeWorkflow(createdUser.id, executionData)).rejects.toThrow(
				'No agents found in crew'
			);
		});

		it('should create workflow execution with correct data', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Create a coordinator agent
			await agentFactory.createCoordinatorAgent({
				crewId: createdCrew.id,
				instructions: 'You coordinate the workflow',
				model: 'gpt-4',
				name: 'Coordinator',
				role: 'Coordinator'
			});

			const executionData = {
				crewId: createdCrew.id,
				input: 'Research the latest AI developments'
			};

			const result = await workflowService.executeWorkflow(createdUser.id, executionData);

			// Verify execution was created
			const execution = await workflowService.getExecutionStatus(
				result.executionId,
				createdUser.id
			);
			expect(execution).toBeDefined();
			expect(execution?.crewId).toBe(createdCrew.id);
			expect(execution?.input).toBe(executionData.input);
			expect(execution?.userId).toBe(createdUser.id);
			expect(execution?.status).toBe('running');
		});
	});

	describe('getExecutionStatus', () => {
		it('should return execution status for owner', async () => {
			const createUser = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createUser.createdUser.id
			});

			// Create a workflow execution
			const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
				crewId: createdCrew.id,
				status: 'completed',
				userId: createUser.createdUser.id
			});

			const result = await workflowService.getExecutionStatus(
				workflowExecution.id,
				createUser.createdUser.id
			);

			expect(result).toBeDefined();
			expect(result?.id).toBe(workflowExecution.id);
			expect(result?.crewId).toBe(createdCrew.id);
			expect(result?.userId).toBe(createUser.createdUser.id);
			expect(result?.status).toBe('completed');
		});

		it('should throw error for execution not owned by user', async () => {
			const createUser1 = await userFactory.createBasicUser();
			const createUser2 = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createUser1.createdUser.id
			});

			const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
				crewId: createdCrew.id,
				userId: createUser1.createdUser.id
			});

			await expect(
				workflowService.getExecutionStatus(workflowExecution.id, createUser2.createdUser.id)
			).rejects.toThrow('Workflow execution not found');
		});

		it('should throw error for non-existent execution', async () => {
			const createUser = await userFactory.createBasicUser();

			await expect(
				workflowService.getExecutionStatus(
					'00000000-0000-0000-0000-000000000000',
					createUser.createdUser.id
				)
			).rejects.toThrow('Workflow execution not found');
		});
	});

	describe('getExecutionWithDetails', () => {
		it('should return execution with agent details for owner', async () => {
			const createUser = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createUser.createdUser.id
			});

			// Create agents
			const agent1 = await agentFactory.createBasicAgent({
				crewId: createdCrew.id,
				name: 'Agent 1',
				role: 'Researcher'
			});

			const agent2 = await agentFactory.createBasicAgent({
				crewId: createdCrew.id,
				name: 'Agent 2',
				role: 'Writer'
			});

			// Create workflow execution
			const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
				crewId: createdCrew.id,
				userId: createUser.createdUser.id
			});

			// Create agent executions
			await workflowFactory.createBasicAgentExecution({
				agentId: agent1.id,
				workflowExecutionId: workflowExecution.id
			});

			await workflowFactory.createBasicAgentExecution({
				agentId: agent2.id,
				workflowExecutionId: workflowExecution.id
			});

			const result = await workflowService.getExecutionWithDetails(
				workflowExecution.id,
				createUser.createdUser.id
			);

			expect(result).toBeDefined();
			expect(result?.execution.id).toBe(workflowExecution.id);
			expect(result?.execution.crewId).toBe(createdCrew.id);
			expect(result?.execution.userId).toBe(createUser.createdUser.id);
			expect(result?.agentExecutions).toHaveLength(2);
			expect(result?.agentExecutions[0].agent.name).toBe('Agent 1');
			expect(result?.agentExecutions[0].agent.role).toBe('Researcher');
			expect(result?.agentExecutions[1].agent.name).toBe('Agent 2');
			expect(result?.agentExecutions[1].agent.role).toBe('Writer');
		});

		it('should throw error for execution not owned by user', async () => {
			const createUser1 = await userFactory.createBasicUser();
			const createUser2 = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createUser1.createdUser.id
			});

			const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
				crewId: createdCrew.id,
				userId: createUser1.createdUser.id
			});

			await expect(
				workflowService.getExecutionWithDetails(workflowExecution.id, createUser2.createdUser.id)
			).rejects.toThrow('Workflow execution not found');
		});

		it('should throw error for non-existent execution', async () => {
			const createUser = await userFactory.createBasicUser();

			await expect(
				workflowService.getExecutionWithDetails(
					'00000000-0000-0000-0000-000000000000',
					createUser.createdUser.id
				)
			).rejects.toThrow('Workflow execution not found');
		});

		it('should return empty agent executions for new workflow', async () => {
			const createUser = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createUser.createdUser.id
			});

			// Create workflow execution without agent executions
			const workflowExecution = await workflowFactory.createBasicWorkflowExecution({
				crewId: createdCrew.id,
				userId: createUser.createdUser.id
			});

			const result = await workflowService.getExecutionWithDetails(
				workflowExecution.id,
				createUser.createdUser.id
			);

			expect(result).toBeDefined();
			expect(result?.execution.id).toBe(workflowExecution.id);
			expect(result?.agentExecutions).toHaveLength(0);
		});
	});

	describe('workflow execution lifecycle', () => {
		it('should handle workflow execution from start to completion', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Create a coordinator agent
			await agentFactory.createCoordinatorAgent({
				crewId: createdCrew.id,
				instructions: 'You coordinate the workflow',
				model: 'gpt-4',
				name: 'Coordinator',
				role: 'Coordinator'
			});

			const executionData = {
				crewId: createdCrew.id,
				input: 'Research the latest AI developments'
			};

			// Start workflow execution
			const result = await workflowService.executeWorkflow(createdUser.id, executionData);

			// Check initial status
			const initialStatus = await workflowService.getExecutionStatus(
				result.executionId,
				createdUser.id
			);
			expect(initialStatus?.status).toBe('running');

			// Wait a bit for async execution to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check final status
			const finalStatus = await workflowService.getExecutionStatus(
				result.executionId,
				createdUser.id
			);
			expect(['completed', 'failed', 'running']).toContain(finalStatus?.status);
		});

		it('should handle workflow with multiple agents', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Create multiple agents
			await agentFactory.createCoordinatorAgent({
				crewId: createdCrew.id,
				instructions: 'You coordinate the workflow',
				model: 'gpt-4',
				name: 'Coordinator',
				role: 'Coordinator'
			});

			await agentFactory.createBasicAgent({
				crewId: createdCrew.id,
				instructions: 'You research topics',
				model: 'gpt-4',
				name: 'Researcher',
				role: 'Researcher'
			});

			await agentFactory.createBasicAgent({
				crewId: createdCrew.id,
				instructions: 'You write content',
				model: 'gpt-4',
				name: 'Writer',
				role: 'Writer'
			});

			const executionData = {
				crewId: createdCrew.id,
				input: 'Create a comprehensive report on AI trends'
			};

			const result = await workflowService.executeWorkflow(createdUser.id, executionData);

			// Wait for execution to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get execution details
			const details = await workflowService.getExecutionWithDetails(
				result.executionId,
				createdUser.id
			);
			expect(details).toBeDefined();
			expect(details?.agentExecutions.length).toBeGreaterThan(0);
		});
	});

	describe('error handling', () => {
		it('should handle workflow execution errors gracefully', async () => {
			const { createdUser } = await userFactory.createBasicUser();
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			// Create a coordinator agent
			await agentFactory.createCoordinatorAgent({
				crewId: createdCrew.id,
				instructions: 'You coordinate the workflow',
				model: 'gpt-4',
				name: 'Coordinator',
				role: 'Coordinator'
			});

			const executionData = {
				crewId: createdCrew.id,
				input: 'Research the latest AI developments'
			};

			const result = await workflowService.executeWorkflow(createdUser.id, executionData);

			// Wait for execution to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check that execution completed (even if with errors)
			const status = await workflowService.getExecutionStatus(result.executionId, createdUser.id);
			expect(status).toBeDefined();
			expect(['completed', 'failed', 'running']).toContain(status?.status);
		});

		it('should handle invalid crew ID gracefully', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			const executionData = {
				crewId: '00000000-0000-0000-0000-000000000000',
				input: 'Research the latest AI developments'
			};

			await expect(workflowService.executeWorkflow(createdUser.id, executionData)).rejects.toThrow(
				'Crew not found'
			);
		});
	});

	describe('execution data validation', () => {
		it('should validate required fields', async () => {
			const { createdUser } = await userFactory.createBasicUser();

			// Test missing crewId
			await expect(
				workflowService.executeWorkflow(createdUser.id, {
					crewId: '00000000-0000-0000-0000-000000000000',
					input: 'Test input'
				})
			).rejects.toThrow('Crew not found');

			// Test missing input
			const createdCrew = await crewFactory.createBasicCrew({
				userId: createdUser.id
			});

			await agentFactory.createCoordinatorAgent({
				crewId: createdCrew.id,
				instructions: 'You coordinate the workflow',
				model: 'gpt-4',
				name: 'Coordinator',
				role: 'Coordinator'
			});

			await expect(
				workflowService.executeWorkflow(createdUser.id, {
					crewId: createdCrew.id,
					input: ''
				})
			).rejects.toThrow('Input is required');
		});
	});
});
