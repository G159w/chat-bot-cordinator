import type { Agent } from '$lib/server/db/schema';

import { inject, injectable } from '@needle-di/core';
import { err, ok, Result } from 'neverthrow';

import { CrewRepository } from '../crew/crew.repository';
import { AgentRepository } from './agent.repository';

// Type for creating an agent that matches the DTO
type CreateAgentData = {
  crewId?: string;
  description?: string;
  instructions: string;
  isCoordinator?: boolean;
  model: string;
  name: string;
  order?: number;
  role: string;
  temperature?: number;
  tools?: string[];
};

@injectable()
export class AgentService {
  constructor(
    private readonly agentRepository = inject(AgentRepository),
    private readonly crewRepository = inject(CrewRepository)
  ) {}

  async createAgent(
    data: CreateAgentData
  ): Promise<Result<Agent, 'ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW'>> {
    // Validate that only one agent is coordinator per crew
    if (data.isCoordinator && data.crewId) {
      const existingCoordinator = await this.agentRepository.findCoordinatorByCrewId(data.crewId);
      if (existingCoordinator) {
        return err('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW');
      }
    }

    // Transform undefined to null for database
    const dbData = {
      crewId: data.crewId ?? null,
      description: data.description ?? null,
      instructions: data.instructions,
      isCoordinator: data.isCoordinator ?? null,
      model: data.model,
      name: data.name,
      order: data.order ?? null,
      role: data.role,
      temperature: data.temperature ?? null,
      tools: data.tools ?? null
    };

    const agent = await this.agentRepository.create(dbData);
    return ok(agent);
  }

  async deleteAgent(id: string, userId: string): Promise<Result<boolean, 'AGENT_NOT_FOUND'>> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      return err('AGENT_NOT_FOUND');
    }

    if (agent.crew.userId !== userId) {
      return err('AGENT_NOT_FOUND');
    }

    const result = await this.agentRepository.delete(id);
    return ok(result);
  }

  async getAgentById(id: string): Promise<Result<Agent, 'AGENT_NOT_FOUND'>> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      return err('AGENT_NOT_FOUND');
    }

    return ok(agent);
  }

  async getAgentsByCrewAndUser(
    crewId: string,
    userId: string
  ): Promise<Result<Agent[], 'CREW_NOT_FOUND' | 'CREW_NOT_FOUND_OR_ACCESS_DENIED'>> {
    // Note: This method assumes the crew exists and user has access
    // The actual validation should be done at a higher level
    const agents = await this.agentRepository.findByCrewIdAndUser(crewId, userId);
    return ok(agents);
  }

  async listAgents(crewId: string, userId: string): Promise<Result<Agent[], 'CREW_NOT_FOUND'>> {
    const crew = await this.crewRepository.findById(crewId, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND');
    }

    const agents = await this.agentRepository.findByCrewId(crewId);
    return ok(agents);
  }

  async updateAgent(
    id: string,
    data: Partial<CreateAgentData>
  ): Promise<Result<Agent, 'AGENT_NOT_FOUND' | 'ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW'>> {
    // If updating coordinator status, validate only one coordinator
    if (data.isCoordinator) {
      const agent = await this.agentRepository.findById(id);
      if (!agent) {
        return err('AGENT_NOT_FOUND');
      }

      if (agent.crewId) {
        const existingCoordinator = await this.agentRepository.findCoordinatorByCrewId(
          agent.crewId
        );
        if (existingCoordinator && existingCoordinator.id !== id) {
          return err('ONLY_ONE_AGENT_CAN_BE_COORDINATOR_PER_CREW');
        }
      }
    }

    // Check if agent exists
    const existingAgent = await this.agentRepository.findById(id);
    if (!existingAgent) {
      return err('AGENT_NOT_FOUND');
    }

    // Transform undefined to null for database, only include provided fields
    const dbData: Partial<Omit<Agent, 'createdAt' | 'id'>> = {};
    if (data.crewId !== undefined) dbData.crewId = data.crewId ?? null;
    if (data.description !== undefined) dbData.description = data.description ?? null;
    if (data.instructions !== undefined) dbData.instructions = data.instructions;
    if (data.isCoordinator !== undefined) dbData.isCoordinator = data.isCoordinator ?? null;
    if (data.model !== undefined) dbData.model = data.model;
    if (data.name !== undefined) dbData.name = data.name;
    if (data.order !== undefined) dbData.order = data.order ?? null;
    if (data.role !== undefined) dbData.role = data.role;
    if (data.temperature !== undefined) dbData.temperature = data.temperature ?? null;
    if (data.tools !== undefined) dbData.tools = data.tools ?? null;

    const updatedAgent = await this.agentRepository.update(id, dbData);
    if (!updatedAgent) {
      return err('AGENT_NOT_FOUND');
    }
    return ok(updatedAgent);
  }
}
