import { AgentFactory } from '$server/test/factory/agent.factory';
import { CrewFactory } from '$server/test/factory/crew.factory';
import { FlowFactory } from '$server/test/factory/flow.factory';
import { UserFactory } from '$server/test/factory/user.factory';
import { TestDbService } from '$server/test/mock.service';

export const generateFactories = (dbService: TestDbService) => {
  const userFactory = new UserFactory(dbService);
  const crewFactory = new CrewFactory(dbService, userFactory);
  const agentFactory = new AgentFactory(dbService);
  const flowFactory = new FlowFactory(dbService, crewFactory, userFactory);

  return {
    agentFactory,
    crewFactory,
    flowFactory,
    userFactory
  };
};
