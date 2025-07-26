import type { Agent, Crew } from '$lib/server/db/schema';

import { DbRepository, DbService } from '$lib/server/db/db.service';
import { agentTable, crewTable, crewUpdateSchema } from '$lib/server/db/schema';
import { opentelemetry } from '$server/api/utils/opentelemetry.decorator';
import { inject, injectable } from '@needle-di/core';
import { Value } from '@sinclair/typebox/value';
import { and, eq } from 'drizzle-orm';

@injectable()
@opentelemetry()
export class CrewRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: { description?: string; name: string; userId: string }): Promise<Crew> {
    const [result] = await this.db.insert(crewTable).values(data).returning();

    return result;
  }

  async createWithAgents(data: {
    agents: Omit<Agent, 'createdAt' | 'crewId' | 'id'>[];
    description?: string;
    name: string;
    userId: string;
  }): Promise<Crew> {
    return this.db.transaction(async (tx) => {
      const [crewResult] = await tx
        .insert(crewTable)
        .values({
          description: data.description,
          name: data.name,
          userId: data.userId
        })
        .returning();

      if (data.agents.length > 0) {
        await tx.insert(agentTable).values(
          data.agents.map((agentData, index) => ({
            ...agentData,
            crewId: crewResult.id,
            order: index
          }))
        );
      }

      return crewResult;
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const [result] = await this.db
      .delete(crewTable)
      .where(and(eq(crewTable.id, id), eq(crewTable.userId, userId)))
      .returning();

    return !!result;
  }

  async findById(id: string, userId: string): Promise<Crew | null> {
    const [result] = await this.db
      .select()
      .from(crewTable)
      .where(and(eq(crewTable.id, id), eq(crewTable.userId, userId)))
      .limit(1);

    return result || null;
  }

  async findByUserId(userId: string): Promise<Crew[]> {
    return this.db
      .select()
      .from(crewTable)
      .where(eq(crewTable.userId, userId))
      .orderBy(crewTable.createdAt);
  }

  async getCrewWithAgents(
    id: string,
    userId: string
  ): Promise<(Crew & { agents: Agent[] }) | null> {
    const crewResult = await this.findById(id, userId);
    if (!crewResult) return null;

    const agents = await this.db
      .select()
      .from(agentTable)
      .where(eq(agentTable.crewId, id))
      .orderBy(agentTable.order);

    return {
      ...crewResult,
      agents
    };
  }

  async update(
    id: string,
    userId: string,
    data: {
      description?: string;
      isActive?: boolean;
      name?: string;
    }
  ): Promise<Crew> {
    const updatedCrew = Value.Parse(crewUpdateSchema, data);
    const [result] = await this.db
      .update(crewTable)
      .set({ ...updatedCrew, updatedAt: new Date() })
      .where(and(eq(crewTable.id, id), eq(crewTable.userId, userId)))
      .returning();

    return result;
  }
}
