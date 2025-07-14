import type { Agent } from '$lib/server/db/schema';

import { inject, injectable } from '@needle-di/core';

import { BadRequest } from '../utils/exceptions';
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
	constructor(private readonly agentRepository = inject(AgentRepository)) {}

	async createAgent(data: CreateAgentData): Promise<Agent> {
		// Validate that only one agent is coordinator per crew
		if (data.isCoordinator && data.crewId) {
			const existingCoordinator = await this.agentRepository.findCoordinatorByCrewId(data.crewId);
			if (existingCoordinator) {
				throw BadRequest('Only one agent can be the coordinator per crew');
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

		return this.agentRepository.create(dbData);
	}

	async deleteAgent(id: string): Promise<boolean> {
		return this.agentRepository.delete(id);
	}

	async getAgentById(id: string): Promise<Agent | null> {
		return this.agentRepository.findById(id);
	}

	async getAgentsByCrewAndUser(crewId: string, userId: string): Promise<Agent[]> {
		return this.agentRepository.findByCrewIdAndUser(crewId, userId);
	}

	async listAgents(crewId: string): Promise<Agent[]> {
		return this.agentRepository.findByCrewId(crewId);
	}

	async updateAgent(id: string, data: Partial<CreateAgentData>): Promise<Agent | null> {
		// If updating coordinator status, validate only one coordinator
		if (data.isCoordinator) {
			const agent = await this.agentRepository.findById(id);
			if (!agent) {
				throw new Error('Agent not found');
			}

			if (agent.crewId) {
				const existingCoordinator = await this.agentRepository.findCoordinatorByCrewId(
					agent.crewId
				);
				if (existingCoordinator && existingCoordinator.id !== id) {
					throw new Error('Only one agent can be the coordinator per crew');
				}
			}
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

		return this.agentRepository.update(id, dbData);
	}
}
