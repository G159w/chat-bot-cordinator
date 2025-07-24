import {
  boolean,
  maxValue,
  minLength,
  minValue,
  number,
  object,
  optional,
  picklist,
  pipe,
  string,
  trim
} from 'valibot';

export const agentModels = ['gemini-2.0-flash', 'gpt-4', 'gpt-3.5-turbo', 'claude-3'] as const;

export const upsertAgentSchema = object({
  description: optional(string()),
  instructions: pipe(string(), trim(), minLength(1, 'Instructions are required')),
  isCoordinator: optional(boolean(), false),
  model: picklist(agentModels, 'Please select a model'),
  name: pipe(string(), trim(), minLength(1, 'Name is required')),
  role: pipe(string(), trim(), minLength(1, 'Role is required')),
  temperature: pipe(number(), minValue(0), maxValue(100))
});

export type UpsertAgentSchema = typeof upsertAgentSchema;
