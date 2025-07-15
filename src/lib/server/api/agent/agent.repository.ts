import type { Agent, Crew } from '$lib/server/db/schema';

import { DbRepository, DbService } from '$lib/server/db/db.service';
import { agentTable, crewTable } from '$lib/server/db/schema';
import { inject, injectable } from '@needle-di/core';
import { and, eq } from 'drizzle-orm';

type AgentWithCrew = Agent & {
  crew: Crew;
};

@injectable()
export class AgentRepository extends DbRepository {
  constructor(dbService = inject(DbService)) {
    super(dbService);
  }

  async create(data: Omit<Agent, 'createdAt' | 'id'>): Promise<Agent> {
    const [result] = await this.db.insert(agentTable).values(data).returning();

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await this.db.delete(agentTable).where(eq(agentTable.id, id)).returning();

    return !!result;
  }

  async findByCrewId(crewId: string): Promise<Agent[]> {
    return this.db
      .select()
      .from(agentTable)
      .where(eq(agentTable.crewId, crewId))
      .orderBy(agentTable.order);
  }

  async findByCrewIdAndUser(crewId: string, userId: string): Promise<Agent[]> {
    const results = await this.db
      .select({ agent: agentTable })
      .from(agentTable)
      .innerJoin(crewTable, eq(agentTable.crewId, crewTable.id))
      .where(and(eq(agentTable.crewId, crewId), eq(crewTable.userId, userId)))
      .orderBy(agentTable.order);

    return results.map((r) => r.agent);
  }

  async findById(id: string): Promise<AgentWithCrew | null> {
    const [result] = await this.db
      .select({ agent: agentTable, crew: crewTable })
      .from(agentTable)
      .innerJoin(crewTable, eq(agentTable.crewId, crewTable.id))
      .where(eq(agentTable.id, id))
      .limit(1);

    return result ? { ...result.agent, crew: result.crew } : null;
  }

  async findCoordinatorByCrewId(crewId: string): Promise<AgentWithCrew | null> {
    const [result] = await this.db
      .select({ agent: agentTable, crew: crewTable })
      .from(agentTable)
      .innerJoin(crewTable, eq(agentTable.crewId, crewTable.id))
      .where(and(eq(agentTable.crewId, crewId), eq(agentTable.isCoordinator, true)))
      .limit(1);

    return result ? { ...result.agent, crew: result.crew } : null;
  }

  async update(id: string, data: Partial<Omit<Agent, 'createdAt' | 'id'>>): Promise<Agent | null> {
    const [result] = await this.db
      .update(agentTable)
      .set(data)
      .where(eq(agentTable.id, id))
      .returning();

    return result || null;
  }

  async updateOrder(crewId: string, agentOrders: { id: string; order: number }[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const { id, order } of agentOrders) {
        await tx
          .update(agentTable)
          .set({ order })
          .where(and(eq(agentTable.id, id), eq(agentTable.crewId, crewId)));
      }
    });
  }
}
