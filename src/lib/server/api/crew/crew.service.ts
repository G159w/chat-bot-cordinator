import type { Agent, Crew } from '$lib/server/db/schema';

import { AgentRepository } from '$server/api/agent/agent.repository';
import { CrewRepository } from '$server/api/crew/crew.repository';
import { opentelemetry } from '$server/api/utils/opentelemetry.decorator';
import { inject, injectable } from '@needle-di/core';
import { err, ok, Result } from 'neverthrow';

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
@opentelemetry()
export class CrewService {
  constructor(
    private readonly agentRepository = inject(AgentRepository),
    private readonly crewRepository = inject(CrewRepository)
  ) {}

  async addAgentToCrew(
    crewId: string,
    userId: string,
    agentData: CreateAgentData
  ): Promise<Result<Agent, 'CREW_NOT_FOUND_OR_ACCESS_DENIED'>> {
    // Verify crew belongs to user
    const crew = await this.crewRepository.findById(crewId, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND_OR_ACCESS_DENIED');
    }

    if (crew.userId !== userId) {
      return err('CREW_NOT_FOUND_OR_ACCESS_DENIED');
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

    const agent = await this.agentRepository.create(dbAgentData);
    return ok(agent);
  }

  async createCrew(
    userId: string,
    data: CreateCrewData
  ): Promise<Result<Crew, 'ONLY_ONE_AGENT_CAN_BE_COORDINATOR'>> {
    if (data.agents && data.agents.length > 0) {
      // Validate that only one agent is coordinator
      const coordinators = data.agents.filter((agent: CreateAgentData) => agent.isCoordinator);
      if (coordinators.length > 1) {
        return err('ONLY_ONE_AGENT_CAN_BE_COORDINATOR');
      }

      // Transform agents data for database
      const dbAgents = data.agents.map((agent: CreateAgentData) => ({
        ...agent,
        description: agent.description ?? null,
        isCoordinator: agent.isCoordinator ?? null,
        order: agent.order ?? null,
        temperature: agent.temperature ?? null,
        tools: agent.tools ?? null
      }));

      const crew = await this.crewRepository.createWithAgents({
        agents: dbAgents,
        description: data.description,
        name: data.name,
        userId
      });
      return ok(crew);
    } else {
      const crew = await this.crewRepository.create({
        description: data.description,
        name: data.name,
        userId
      });
      return ok(crew);
    }
  }

  async deleteCrew(id: string, userId: string): Promise<Result<boolean, 'CREW_NOT_FOUND'>> {
    const crew = await this.crewRepository.findById(id, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND');
    }

    const result = await this.crewRepository.delete(id, userId);
    return ok(result);
  }

  async getCrewAgents(crewId: string, userId: string): Promise<Result<Agent[], 'CREW_NOT_FOUND'>> {
    const crew = await this.crewRepository.findById(crewId, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND');
    }

    if (crew.userId !== userId) {
      return err('CREW_NOT_FOUND');
    }

    const agents = await this.agentRepository.findByCrewIdAndUser(crewId, userId);
    return ok(agents);
  }

  async getCrewById(id: string, userId: string): Promise<Result<Crew, 'CREW_NOT_FOUND'>> {
    const crew = await this.crewRepository.findById(id, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND');
    }

    return ok(crew);
  }

  async getCrewWithAgents(
    id: string,
    userId: string
  ): Promise<Result<Crew & { agents: Agent[] }, 'CREW_NOT_FOUND'>> {
    const crew = await this.crewRepository.getCrewWithAgents(id, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND');
    }

    return ok(crew);
  }

  async listCrews(userId: string): Promise<Result<Crew[], void>> {
    const crews = await this.crewRepository.findByUserId(userId);
    return ok(crews);
  }

  async removeAgentFromCrew(
    crewId: string,
    agentId: string,
    userId: string
  ): Promise<Result<boolean, 'AGENT_NOT_FOUND_IN_CREW' | 'CREW_NOT_FOUND_OR_ACCESS_DENIED'>> {
    // Verify crew belongs to user
    const crew = await this.crewRepository.findById(crewId, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND_OR_ACCESS_DENIED');
    }

    if (crew.userId !== userId) {
      return err('CREW_NOT_FOUND_OR_ACCESS_DENIED');
    }

    // Verify agent belongs to crew
    const agent = await this.agentRepository.findById(agentId);
    if (!agent || agent.crewId !== crewId) {
      return err('AGENT_NOT_FOUND_IN_CREW');
    }

    const result = await this.agentRepository.delete(agentId);
    return ok(result);
  }

  async updateCrew(
    id: string,
    userId: string,
    data: {
      description?: string;
      isActive?: boolean;
      name?: string;
    }
  ): Promise<Result<Crew, 'CREW_NOT_FOUND'>> {
    // Only include provided fields
    const dbData: { description?: string; isActive?: boolean; name?: string } = {};
    if (data.description !== undefined) dbData.description = data.description;
    if (data.isActive !== undefined) dbData.isActive = data.isActive;
    if (data.name !== undefined) dbData.name = data.name;

    // check if crew exists
    const crew = await this.crewRepository.findById(id, userId);
    if (!crew) {
      return err('CREW_NOT_FOUND');
    }

    // check if crew belongs to user
    if (crew.userId !== userId) {
      return err('CREW_NOT_FOUND');
    }

    const updatedCrew = await this.crewRepository.update(id, userId, dbData);
    return ok(updatedCrew);
  }
}
