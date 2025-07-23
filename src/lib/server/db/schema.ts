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
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-typebox';

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

// Flow System Tables
export const flowTable = pgTable('flow', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  crewId: uuid('crew_id')
    .notNull()
    .references(() => crewTable.id),
  description: text('description'),
  id: uuid('id').primaryKey().defaultRandom(),
  isActive: boolean('is_active').default(true).notNull(),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const taskTable = pgTable('task', {
  config: jsonb('config').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  description: text('description'),
  flowId: uuid('flow_id')
    .notNull()
    .references(() => flowTable.id, { onDelete: 'cascade' }),
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  taskType: text('task_type').notNull(), // 'agent', 'condition', 'input', etc.
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const taskInputTable = pgTable('task_input', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  inputType: text('input_type').notNull(), // 'manual', 'hook', 'previous_task', etc.
  name: text('name').notNull(),
  required: boolean('required').default(false),
  taskId: uuid('task_id')
    .notNull()
    .references(() => taskTable.id, { onDelete: 'cascade' }),
  value: text('value') // default value or configuration
});

export const taskOutputTable = pgTable('task_output', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  outputType: text('output_type').notNull(), // 'text', 'json', 'file', etc.
  taskId: uuid('task_id')
    .notNull()
    .references(() => taskTable.id, { onDelete: 'cascade' })
});

export const taskConnectionTable = pgTable('task_connection', {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  id: uuid('id').primaryKey().defaultRandom(),
  sourceOutputId: uuid('source_output_id')
    .notNull()
    .references(() => taskOutputTable.id, { onDelete: 'cascade' }),
  sourceTaskId: uuid('source_task_id')
    .notNull()
    .references(() => taskTable.id, { onDelete: 'cascade' }),
  targetInputId: uuid('target_input_id')
    .notNull()
    .references(() => taskInputTable.id, { onDelete: 'cascade' }),
  targetTaskId: uuid('target_task_id')
    .notNull()
    .references(() => taskTable.id, { onDelete: 'cascade' })
});

// Flow Execution Tables
export const flowExecutionTable = pgTable('flow_execution', {
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  flowId: uuid('flow_id')
    .notNull()
    .references(() => flowTable.id),
  id: uuid('id').primaryKey().defaultRandom(),
  input: jsonb('input').$type<Record<string, unknown>>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  result: jsonb('result').$type<Record<string, unknown>>(),
  status: text('status').notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id)
});

export const taskExecutionTable = pgTable('task_execution', {
  completedAt: timestamp('completed_at'),
  cost: integer('cost'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  duration: integer('duration'),
  error: text('error'),
  flowExecutionId: uuid('flow_execution_id')
    .notNull()
    .references(() => flowExecutionTable.id, { onDelete: 'cascade' }),
  id: uuid('id').primaryKey().defaultRandom(),
  input: jsonb('input').$type<Record<string, unknown>>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  output: jsonb('output').$type<Record<string, unknown>>(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  taskId: uuid('task_id')
    .notNull()
    .references(() => taskTable.id),
  tokensUsed: integer('tokens_used')
});

// Type exports
export type Agent = typeof agentTable.$inferSelect;
export const agentSelectSchema = createSelectSchema(agentTable);
export const agentInsertSchema = createInsertSchema(agentTable);
export const agentUpdateSchema = createUpdateSchema(agentTable);

export type Crew = typeof crewTable.$inferSelect;
export const crewSelectSchema = createSelectSchema(crewTable);
export const crewInsertSchema = createInsertSchema(crewTable);
export const crewUpdateSchema = createUpdateSchema(crewTable);

export type Flow = typeof flowTable.$inferSelect;
export const flowSelectSchema = createSelectSchema(flowTable);
export const flowInsertSchema = createInsertSchema(flowTable);
export const flowUpdateSchema = createUpdateSchema(flowTable);

export type Task = typeof taskTable.$inferSelect;
export const taskSelectSchema = createSelectSchema(taskTable);
export const taskInsertSchema = createInsertSchema(taskTable);
export const taskUpdateSchema = createUpdateSchema(taskTable);

export type TaskInput = typeof taskInputTable.$inferSelect;
export const taskInputSelectSchema = createSelectSchema(taskInputTable);
export const taskInputInsertSchema = createInsertSchema(taskInputTable);
export const taskInputUpdateSchema = createUpdateSchema(taskInputTable);

export type TaskOutput = typeof taskOutputTable.$inferSelect;
export const taskOutputSelectSchema = createSelectSchema(taskOutputTable);
export const taskOutputInsertSchema = createInsertSchema(taskOutputTable);
export const taskOutputUpdateSchema = createUpdateSchema(taskOutputTable);

export type TaskConnection = typeof taskConnectionTable.$inferSelect;
export const taskConnectionSelectSchema = createSelectSchema(taskConnectionTable);
export const taskConnectionInsertSchema = createInsertSchema(taskConnectionTable);
export const taskConnectionUpdateSchema = createUpdateSchema(taskConnectionTable);

export type FlowExecution = typeof flowExecutionTable.$inferSelect;
export const flowExecutionSelectSchema = createSelectSchema(flowExecutionTable);
export const flowExecutionInsertSchema = createInsertSchema(flowExecutionTable);
export const flowExecutionUpdateSchema = createUpdateSchema(flowExecutionTable);

export type TaskExecution = typeof taskExecutionTable.$inferSelect;
export const taskExecutionSelectSchema = createSelectSchema(taskExecutionTable);
export const taskExecutionInsertSchema = createInsertSchema(taskExecutionTable);
export const taskExecutionUpdateSchema = createUpdateSchema(taskExecutionTable);

export type Session = typeof sessionTable.$inferSelect;
export const sessionSelectSchema = createSelectSchema(sessionTable);
export const sessionInsertSchema = createInsertSchema(sessionTable);
export const sessionUpdateSchema = createUpdateSchema(sessionTable);

export type VerificationToken = typeof verificationTokenTable.$inferSelect;
export const verificationTokenSelectSchema = createSelectSchema(verificationTokenTable);
export const verificationTokenInsertSchema = createInsertSchema(verificationTokenTable);
export const verificationTokenUpdateSchema = createUpdateSchema(verificationTokenTable);

export type User = typeof userTable.$inferSelect;
export const userSelectSchema = createSelectSchema(userTable);
export const userInsertSchema = createInsertSchema(userTable);
export const userUpdateSchema = createUpdateSchema(userTable);
