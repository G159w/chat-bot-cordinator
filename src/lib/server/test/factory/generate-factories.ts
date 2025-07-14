import { TestDbService } from '../mock.service';
import { AgentFactory } from './agent.factory';
import { CrewFactory } from './crew.factory';
import { UserFactory } from './user.factory';
import { WorkflowFactory } from './workflow.factory';

export const generateFactories = (dbService: TestDbService) => {
	const agentFactory = new AgentFactory(dbService);
	const crewFactory = new CrewFactory(dbService);
	const userFactory = new UserFactory(dbService);
	const workflowFactory = new WorkflowFactory(dbService);

	return {
		agentFactory,
		crewFactory,
		userFactory,
		workflowFactory
	};
};
