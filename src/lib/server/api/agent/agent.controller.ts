import { inject, injectable } from '@needle-di/core';

import type { AuthGuardedApp } from '../api';

import {
  agentListQuerySchema,
  agentListResponseSchema,
  agentResponseSchema,
  createAgentRequestSchema
} from './agent.dto';
import { AgentService } from './agent.service';

@injectable()
export class AgentController {
  constructor(private readonly agentService = inject(AgentService)) {
    this.getControllerApp = this.getControllerApp.bind(this);
  }

  getControllerApp(app: AuthGuardedApp) {
    return app
      .get(
        '/agents',
        async ({ query }) => {
          return this.agentService.listAgents(query.crewId);
        },
        {
          detail: {
            description:
              'Retrieves all agents for a specific crew. Returns agents ordered by their execution order in the workflow.',
            summary: 'List all agents for a crew',
            tags: ['Agents']
          },
          query: agentListQuerySchema,
          response: agentListResponseSchema
        }
      )
      .post(
        '/agents',
        async ({ body }) => {
          return this.agentService.createAgent(body);
        },
        {
          body: createAgentRequestSchema,
          detail: {
            description:
              'Creates a new agent and adds it to the specified crew. The agent will be assigned the next available order number.',
            summary: 'Create a new agent',
            tags: ['Agents']
          },
          response: agentResponseSchema
        }
      );
  }
}
