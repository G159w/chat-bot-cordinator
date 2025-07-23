import { TestDbService } from '../mock.service';
import { AgentFactory } from './agent.factory';
import { CrewFactory } from './crew.factory';
import { FlowFactory } from './flow.factory';
import { UserFactory } from './user.factory';

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
