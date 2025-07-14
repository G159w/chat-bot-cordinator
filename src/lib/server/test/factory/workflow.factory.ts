import { faker } from '@faker-js/faker';

import * as schema from '../../db/schema';
// Types for workflow factory
import { TestDbService } from '../mock.service';

export type AgentExecution = typeof schema.agentExecutionTable.$inferSelect;

export interface CreateAgentExecutionData {
	agentId: string;
	input: string;
	metadata?: Record<string, unknown>;
	status?: string;
	workflowExecutionId: string;
}

export interface CreateExecutionStepData {
	agentExecutionId: string;
	duration?: number;
	input?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	output?: Record<string, unknown>;
	stepType: string;
}

export interface CreateWorkflowExecutionData {
	crewId: string;
	input: string;
	metadata?: Record<string, unknown>;
	status?: string;
	userId: string;
}
export type ExecutionStep = typeof schema.executionStepTable.$inferSelect;
export type WorkflowExecution = typeof schema.workflowExecutionTable.$inferSelect;

export class WorkflowFactory {
	private dbService: TestDbService;

	constructor(dbService: TestDbService) {
		this.dbService = dbService;
	}

	/**
	 * Creates agent executions for a workflow
	 */
	async createAgentExecutionsForWorkflow(
		workflowExecutionId: string,
		agentIds: string[],
		overrides: Partial<CreateAgentExecutionData> = {}
	): Promise<AgentExecution[]> {
		const agentExecutions: AgentExecution[] = [];

		for (let i = 0; i < agentIds.length; i++) {
			const agentExecutionData: CreateAgentExecutionData = {
				agentId: agentIds[i],
				input: faker.lorem.paragraph(),
				metadata: {
					executionType: faker.helpers.arrayElement(['research', 'analysis', 'creation']),
					order: i
				},
				status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
				workflowExecutionId,
				...overrides
			};

			const result = await this.dbService.db
				.insert(schema.agentExecutionTable)
				.values(agentExecutionData)
				.returning();
			agentExecutions.push(result[0]);
		}

		return agentExecutions;
	}

	/**
	 * Creates an analysis workflow execution
	 */
	async createAnalysisWorkflow(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): Promise<WorkflowExecution> {
		const workflowData = this.createAnalysisWorkflowData(overrides);
		const result = await this.dbService.db
			.insert(schema.workflowExecutionTable)
			.values(workflowData)
			.returning();
		return result[0];
	}

	/**
	 * Creates a basic agent execution
	 */
	async createBasicAgentExecution(
		overrides: Partial<CreateAgentExecutionData> = {}
	): Promise<AgentExecution> {
		const agentExecutionData = this.createBasicAgentExecutionData(overrides);
		const result = await this.dbService.db
			.insert(schema.agentExecutionTable)
			.values(agentExecutionData)
			.returning();
		return result[0];
	}

	/**
	 * Creates a basic execution step
	 */
	async createBasicExecutionStep(
		overrides: Partial<CreateExecutionStepData> = {}
	): Promise<ExecutionStep> {
		const executionStepData = this.createBasicExecutionStepData(overrides);
		const result = await this.dbService.db
			.insert(schema.executionStepTable)
			.values(executionStepData)
			.returning();
		return result[0];
	}

	/**
	 * Creates a basic workflow execution with minimal required data
	 */
	async createBasicWorkflowExecution(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): Promise<WorkflowExecution> {
		const workflowData = this.createBasicWorkflowExecutionData(overrides);
		const result = await this.dbService.db
			.insert(schema.workflowExecutionTable)
			.values(workflowData)
			.returning();
		return result[0];
	}

	/**
	 * Creates a research workflow with complete data
	 */
	async createCompleteResearchWorkflow(
		crewId: string,
		userId: string,
		agentIds: string[],
		overrides: Partial<CreateWorkflowExecutionData> = {}
	) {
		const workflow = await this.createResearchWorkflow({
			crewId,
			userId,
			...overrides
		});

		const agentExecutions = await this.createAgentExecutionsForWorkflow(workflow.id, agentIds, {
			metadata: { workflowType: 'research' }
		});

		return {
			agentExecutions,
			workflow
		};
	}

	/**
	 * Creates a complete workflow with all related data
	 */
	async createCompleteWorkflow(
		crewId: string,
		userId: string,
		agentIds: string[],
		overrides: {
			agentExecutions?: Partial<CreateAgentExecutionData>;
			executionSteps?: Partial<CreateExecutionStepData>;
			workflow?: Partial<CreateWorkflowExecutionData>;
		} = {}
	) {
		const workflow = await this.createBasicWorkflowExecution({
			crewId,
			userId,
			...overrides.workflow
		});

		const agentExecutions = await this.createAgentExecutionsForWorkflow(
			workflow.id,
			agentIds,
			overrides.agentExecutions
		);

		const executionSteps: ExecutionStep[] = [];
		for (const agentExecution of agentExecutions) {
			const steps = await this.createExecutionStepsForAgent(
				agentExecution.id,
				['initialize', 'process', 'finalize'],
				{
					metadata: { agentIndex: agentExecutions.indexOf(agentExecution) },
					...overrides.executionSteps
				}
			);
			executionSteps.push(...steps);
		}

		return {
			agentExecutions,
			executionSteps,
			workflow
		};
	}

	/**
	 * Creates a content creation workflow execution
	 */
	async createContentWorkflow(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): Promise<WorkflowExecution> {
		const workflowData = this.createContentWorkflowData(overrides);
		const result = await this.dbService.db
			.insert(schema.workflowExecutionTable)
			.values(workflowData)
			.returning();
		return result[0];
	}

	/**
	 * Creates a creative workflow execution
	 */
	async createCreativeWorkflow(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): Promise<WorkflowExecution> {
		const workflowData = this.createCreativeWorkflowData(overrides);
		const result = await this.dbService.db
			.insert(schema.workflowExecutionTable)
			.values(workflowData)
			.returning();
		return result[0];
	}

	/**
	 * Creates execution steps for an agent execution
	 */
	async createExecutionStepsForAgent(
		agentExecutionId: string,
		stepTypes: string[],
		overrides: Partial<CreateExecutionStepData> = {}
	): Promise<ExecutionStep[]> {
		const executionSteps: ExecutionStep[] = [];

		for (let i = 0; i < stepTypes.length; i++) {
			const stepData: CreateExecutionStepData = {
				agentExecutionId,
				duration: 500 + i * 100,
				input: { step: i + 1, type: stepTypes[i] },
				metadata: { order: i + 1 },
				output: { result: `Step ${i + 1} completed` },
				stepType: stepTypes[i],
				...overrides
			};

			const result = await this.dbService.db
				.insert(schema.executionStepTable)
				.values(stepData)
				.returning();
			executionSteps.push(result[0]);
		}

		return executionSteps;
	}

	/**
	 * Creates multiple workflow executions for testing
	 */
	async createMultipleWorkflows(
		count: number = 3,
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): Promise<WorkflowExecution[]> {
		const workflows: WorkflowExecution[] = [];

		for (let i = 0; i < count; i++) {
			const workflowData: CreateWorkflowExecutionData = {
				crewId: faker.string.uuid(),
				input: faker.lorem.paragraph(),
				metadata: {
					testIndex: i + 1,
					workflowType: faker.helpers.arrayElement(['research', 'content', 'analysis'])
				},
				status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
				userId: faker.string.uuid(),
				...overrides
			};

			const result = await this.dbService.db
				.insert(schema.workflowExecutionTable)
				.values(workflowData)
				.returning();
			workflows.push(result[0]);
		}

		return workflows;
	}

	/**
	 * Creates a research workflow execution
	 */
	async createResearchWorkflow(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): Promise<WorkflowExecution> {
		const workflowData = this.createResearchWorkflowData(overrides);
		const result = await this.dbService.db
			.insert(schema.workflowExecutionTable)
			.values(workflowData)
			.returning();
		return result[0];
	}

	/**
	 * Creates a technical workflow execution
	 */
	async createTechnicalWorkflow(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): Promise<WorkflowExecution> {
		const workflowData = this.createTechnicalWorkflowData(overrides);
		const result = await this.dbService.db
			.insert(schema.workflowExecutionTable)
			.values(workflowData)
			.returning();
		return result[0];
	}

	/**
	 * Creates analysis workflow data (without database operation)
	 */
	private createAnalysisWorkflowData(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): CreateWorkflowExecutionData {
		return {
			crewId: faker.string.uuid(),
			input: faker.lorem.paragraph(),
			metadata: {
				datasetSize: faker.helpers.arrayElement(['small', 'medium', 'large']),
				taskType: 'data_analysis',
				visualizationRequired: faker.datatype.boolean()
			},
			status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
			userId: faker.string.uuid(),
			...overrides
		};
	}

	/**
	 * Creates basic agent execution data (without database operation)
	 */
	private createBasicAgentExecutionData(
		overrides: Partial<CreateAgentExecutionData> = {}
	): CreateAgentExecutionData {
		return {
			agentId: faker.string.uuid(),
			input: faker.lorem.paragraph(),
			metadata: {},
			status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
			workflowExecutionId: faker.string.uuid(),
			...overrides
		};
	}

	/**
	 * Creates basic execution step data (without database operation)
	 */
	private createBasicExecutionStepData(
		overrides: Partial<CreateExecutionStepData> = {}
	): CreateExecutionStepData {
		return {
			agentExecutionId: faker.string.uuid(),
			duration: faker.number.int({ max: 5000, min: 100 }),
			input: { data: faker.lorem.sentence() },
			metadata: {},
			output: { result: faker.lorem.sentence() },
			stepType: faker.helpers.arrayElement(['initialize', 'process', 'finalize']),
			...overrides
		};
	}

	/**
	 * Creates basic workflow execution data (without database operation)
	 */
	private createBasicWorkflowExecutionData(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): CreateWorkflowExecutionData {
		return {
			crewId: faker.string.uuid(),
			input: faker.lorem.paragraph(),
			metadata: {},
			status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
			userId: faker.string.uuid(),
			...overrides
		};
	}

	/**
	 * Creates content workflow data (without database operation)
	 */
	private createContentWorkflowData(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): CreateWorkflowExecutionData {
		return {
			crewId: faker.string.uuid(),
			input: faker.lorem.paragraph(),
			metadata: {
				contentType: faker.helpers.arrayElement(['blog_post', 'article', 'report', 'guide']),
				keywords: faker.helpers.arrayElements(
					['sustainability', 'technology', 'practices', 'innovation', 'development'],
					{ max: 5, min: 2 }
				),
				targetLength: faker.number.int({ max: 2000, min: 500 }),
				taskType: 'content_creation'
			},
			status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
			userId: faker.string.uuid(),
			...overrides
		};
	}

	/**
	 * Creates creative workflow data (without database operation)
	 */
	private createCreativeWorkflowData(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): CreateWorkflowExecutionData {
		return {
			crewId: faker.string.uuid(),
			input: faker.lorem.paragraph(),
			metadata: {
				industry: faker.helpers.arrayElement([
					'technology',
					'healthcare',
					'finance',
					'education',
					'retail'
				]),
				targetAudience: faker.helpers.arrayElement([
					'young professionals',
					'seniors',
					'students',
					'business owners'
				]),
				taskType: 'creative_brainstorming'
			},
			status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
			userId: faker.string.uuid(),
			...overrides
		};
	}

	/**
	 * Creates research workflow data (without database operation)
	 */
	private createResearchWorkflowData(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): CreateWorkflowExecutionData {
		return {
			crewId: faker.string.uuid(),
			input: faker.lorem.paragraph(),
			metadata: {
				expectedDuration: faker.helpers.arrayElement([
					'30 minutes',
					'1 hour',
					'2 hours',
					'4 hours'
				]),
				priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
				taskType: 'research'
			},
			status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
			userId: faker.string.uuid(),
			...overrides
		};
	}

	/**
	 * Creates technical workflow data (without database operation)
	 */
	private createTechnicalWorkflowData(
		overrides: Partial<CreateWorkflowExecutionData> = {}
	): CreateWorkflowExecutionData {
		return {
			crewId: faker.string.uuid(),
			input: faker.lorem.paragraph(),
			metadata: {
				language: faker.helpers.arrayElement(['typescript', 'javascript', 'python', 'java', 'go']),
				performanceFocus: faker.datatype.boolean(),
				taskType: 'technical_debugging'
			},
			status: faker.helpers.arrayElement(['pending', 'running', 'completed', 'failed']),
			userId: faker.string.uuid(),
			...overrides
		};
	}
}
