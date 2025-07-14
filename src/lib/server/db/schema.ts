import type { AdapterAccountType } from '@auth/core/adapters';

import {
	boolean,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
	email: text('email').unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date' }),
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	image: text('image'),
	name: text('name')
});

export const accountTable = pgTable(
	'account',
	{
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		id_token: text('id_token'),
		provider: text('provider').notNull(),
		providerAccountId: text('providerAccountId').notNull(),
		refresh_token: text('refresh_token'),
		scope: text('scope'),
		session_state: text('session_state'),
		token_type: text('token_type'),
		type: text('type').$type<AdapterAccountType>().notNull(),
		userId: text('userId')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' })
	},
	(account) => [
		{
			compoundKey: primaryKey({
				columns: [account.provider, account.providerAccountId]
			})
		}
	]
);

export const sessionTable = pgTable('session', {
	expires: timestamp('expires', { mode: 'date' }).notNull(),
	sessionToken: text('sessionToken').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' })
});

export const verificationTokenTable = pgTable(
	'verificationToken',
	{
		expires: timestamp('expires', { mode: 'date' }).notNull(),
		identifier: text('identifier').notNull(),
		token: text('token').notNull()
	},
	(verificationToken) => [
		{
			compositePk: primaryKey({
				columns: [verificationToken.identifier, verificationToken.token]
			})
		}
	]
);

export const authenticators = pgTable(
	'authenticator',
	{
		counter: integer('counter').notNull(),
		credentialBackedUp: boolean('credentialBackedUp').notNull(),
		credentialDeviceType: text('credentialDeviceType').notNull(),
		credentialID: text('credentialID').notNull().unique(),
		credentialPublicKey: text('credentialPublicKey').notNull(),
		providerAccountId: text('providerAccountId').notNull(),
		transports: text('transports'),
		userId: text('userId')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' })
	},
	(authenticator) => [
		{
			compositePK: primaryKey({
				columns: [authenticator.userId, authenticator.credentialID]
			})
		}
	]
);

// Agent Workflow Tables
export const crewTable = pgTable('crew', {
	createdAt: timestamp('created_at').defaultNow(),
	description: text('description'),
	id: uuid('id').primaryKey().defaultRandom(),
	isActive: boolean('is_active').default(true),
	name: text('name').notNull(),
	updatedAt: timestamp('updated_at').defaultNow(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id)
});

export const agentTable = pgTable('agent', {
	createdAt: timestamp('created_at').defaultNow(),
	crewId: uuid('crew_id').references(() => crewTable.id),
	description: text('description'),
	id: uuid('id').primaryKey().defaultRandom(),
	instructions: text('instructions').notNull(),
	isCoordinator: boolean('is_coordinator').default(false),
	model: text('model').notNull().default('gpt-4'),
	name: text('name').notNull(),
	order: integer('order').default(0),
	role: text('role').notNull(),
	temperature: integer('temperature').default(70),
	tools: jsonb('tools').$type<string[]>()
});

export const workflowExecutionTable = pgTable('workflow_execution', {
	completedAt: timestamp('completed_at'),
	crewId: uuid('crew_id')
		.notNull()
		.references(() => crewTable.id),
	id: uuid('id').primaryKey().defaultRandom(),
	input: text('input').notNull(),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	result: text('result'),
	startedAt: timestamp('started_at').defaultNow(),
	status: text('status').notNull().default('pending'),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id)
});

export const agentExecutionTable = pgTable('agent_execution', {
	agentId: uuid('agent_id')
		.notNull()
		.references(() => agentTable.id),
	completedAt: timestamp('completed_at'),
	cost: integer('cost'),
	id: uuid('id').primaryKey().defaultRandom(),
	input: text('input').notNull(),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	output: text('output'),
	startedAt: timestamp('started_at').defaultNow(),
	status: text('status').notNull().default('pending'),
	tokensUsed: integer('tokens_used'),
	workflowExecutionId: uuid('workflow_execution_id')
		.notNull()
		.references(() => workflowExecutionTable.id)
});

export const executionStepTable = pgTable('execution_step', {
	agentExecutionId: uuid('agent_execution_id')
		.notNull()
		.references(() => agentExecutionTable.id),
	duration: integer('duration'),
	id: uuid('id').primaryKey().defaultRandom(),
	input: jsonb('input'),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	output: jsonb('output'),
	stepType: text('step_type').notNull(),
	timestamp: timestamp('timestamp').defaultNow()
});

export type Agent = typeof agentTable.$inferSelect;
export type AgentExecution = typeof agentExecutionTable.$inferSelect;
export type Crew = typeof crewTable.$inferSelect;
export type ExecutionStep = typeof executionStepTable.$inferSelect;
export type Session = typeof sessionTable.$inferSelect;
export type User = typeof userTable.$inferSelect;
export type WorkflowExecution = typeof workflowExecutionTable.$inferSelect;
