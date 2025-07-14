import type { Agent, Crew } from '$lib/server/db/schema';

import { inject, injectable } from '@needle-di/core';

import { AgentRepository } from '../agent/agent.repository';
import { NotFound } from '../utils/exceptions';
import { CrewRepository } from './crew.repository';

// Type for creating an agent that matches the DTO
type CreateAgentData = {
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

// Type for creating a crew that matches the DTO
type CreateCrewData = {
  agents?: CreateAgentData[];
  description?: string;
  name: string;
};

@injectable()
export class CrewService {
  constructor(
    private readonly agentRepository = inject(AgentRepository),
    private readonly crewRepository = inject(CrewRepository)
  ) {}

  async addAgentToCrew(crewId: string, userId: string, agentData: CreateAgentData): Promise<Agent> {
    // Verify crew belongs to user
    const crew = await this.crewRepository.findById(crewId, userId);
    if (!crew) {
      throw NotFound('Crew not found or access denied');
    }

    if (crew.userId !== userId) {
      throw NotFound('Crew not found or access denied');
    }

    // Get current agents to determine order
    const existingAgents = await this.agentRepository.findByCrewId(crewId);
    const order = existingAgents.length;

    // Transform undefined to null for database
    const dbAgentData = {
      ...agentData,
      crewId,
      description: agentData.description ?? null,
      isCoordinator: agentData.isCoordinator ?? null,
      order,
      temperature: agentData.temperature ?? null,
      tools: agentData.tools ?? null
    };

    return this.agentRepository.create(dbAgentData);
  }

  async createCrew(userId: string, data: CreateCrewData): Promise<Crew> {
    if (data.agents && data.agents.length > 0) {
      // Validate that only one agent is coordinator
      const coordinators = data.agents.filter((agent) => agent.isCoordinator);
      if (coordinators.length > 1) {
        throw new Error('Only one agent can be the coordinator');
      }

      // Transform agents data for database
      const dbAgents = data.agents.map((agent) => ({
        ...agent,
        description: agent.description ?? null,
        isCoordinator: agent.isCoordinator ?? null,
        order: agent.order ?? null,
        temperature: agent.temperature ?? null,
        tools: agent.tools ?? null
      }));

      return this.crewRepository.createWithAgents({
        agents: dbAgents,
        description: data.description,
        name: data.name,
        userId
      });
    } else {
      return this.crewRepository.create({
        description: data.description,
        name: data.name,
        userId
      });
    }
  }

  async deleteCrew(id: string, userId: string): Promise<boolean> {
    const crew = await this.crewRepository.findById(id, userId);
    if (!crew) {
      throw NotFound('Crew not found');
    }

    return this.crewRepository.delete(id, userId);
  }

  async getCrewAgents(crewId: string, userId: string): Promise<Agent[]> {
    const crew = await this.crewRepository.findById(crewId, userId);
    if (!crew) {
      throw NotFound('Crew not found');
    }

    if (crew.userId !== userId) {
      throw NotFound('Crew not found or access denied');
    }

    return this.agentRepository.findByCrewIdAndUser(crewId, userId);
  }

  async getCrewById(id: string, userId: string): Promise<Crew> {
    const crew = await this.crewRepository.findById(id, userId);
    if (!crew) {
      throw NotFound('Crew not found');
    }

    return crew;
  }

  async getCrewWithAgents(
    id: string,
    userId: string
  ): Promise<null | {
    agents: Agent[];
    crew: Crew;
  }> {
    const crew = await this.crewRepository.getCrewWithAgents(id, userId);
    if (!crew) {
      throw NotFound('Crew not found');
    }

    return crew;
  }

  async listCrews(userId: string): Promise<Crew[]> {
    return this.crewRepository.findByUserId(userId);
  }

  async updateAgentOrder(
    crewId: string,
    userId: string,
    agentOrders: { id: string; order: number }[]
  ): Promise<void> {
    // Verify crew belongs to user
    const crew = await this.crewRepository.findById(crewId, userId);
    if (!crew) {
      throw new Error('Crew not found or access denied');
    }

    await this.agentRepository.updateOrder(crewId, agentOrders);
  }

  async updateCrew(
    id: string,
    userId: string,
    data: {
      description?: string;
      isActive?: boolean;
      name?: string;
    }
  ): Promise<Crew | null> {
    // Only include provided fields
    const dbData: { description?: string; isActive?: boolean; name?: string } = {};
    if (data.description !== undefined) dbData.description = data.description;
    if (data.isActive !== undefined) dbData.isActive = data.isActive;
    if (data.name !== undefined) dbData.name = data.name;

    // check if crew exists
    const crew = await this.crewRepository.findById(id, userId);
    if (!crew) {
      throw NotFound('Crew not found');
    }

    // check if crew belongs to user
    if (crew.userId !== userId) {
      throw NotFound('Crew not found or access denied');
    }

    return this.crewRepository.update(id, userId, dbData);
  }
}
