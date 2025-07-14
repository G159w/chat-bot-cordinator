import swagger from '@elysiajs/swagger';
import { inject, injectable } from '@needle-di/core';
import { Elysia } from 'elysia';

import { AgentController } from './agent/agent.controller';
import { CrewController } from './crew/crew.controller';
import { Logger } from './logger';
import { AuthGuard } from './utils/auth';
import { HttpErrorHandler } from './utils/exceptions';
import { WorkflowController } from './workflow/workflow.controller';

@injectable()
export class ApiController {
  app: ReturnType<typeof this.getApp>;

  baseApp: ReturnType<typeof this.getBaseApp>;

  constructor(
    private readonly agentController = inject(AgentController),
    private readonly crewController = inject(CrewController),
    private readonly workflowController = inject(WorkflowController),
    private readonly logger = inject(Logger),
    private readonly httpErrorHandler = inject(HttpErrorHandler),
    private readonly authGuard = inject(AuthGuard)
  ) {
    this.baseApp = this.getBaseApp();
    this.app = this.getApp(this.baseApp);
  }

  getApp(app: typeof this.baseApp) {
    return app
      .use(this.httpErrorHandler.handle)
      .use(this.agentController.getControllerApp)
      .use(this.crewController.getControllerApp)
      .use(this.workflowController.getControllerApp);
  }

  getBaseApp() {
    return new Elysia({ prefix: '/api' })
      .use(
        swagger({
          documentation: {
            components: {
              securitySchemes: {
                apiKeyHeader: {
                  description: 'API key for authentication',
                  in: 'header',
                  name: 'Authorization',
                  type: 'apiKey'
                },
                bearerAuth: {
                  description: 'Bearer token for authentication',
                  scheme: 'bearer',
                  type: 'http'
                }
              }
            },
            info: {
              description: 'The complete API for the AoA project',
              title: 'AoA API',
              version: '1.0.0'
            },
            security: [
              {
                bearerAuth: []
              }
            ]
          },
          path: '/swagger',
          theme: 'deepSpace'
        })
      )
      .use(this.authGuard.useGuard())
      .trace(async ({ context, onHandle }) => {
        onHandle(({ begin, onStop }) => {
          onStop(({ end }) => {
            this.logger.info(`${context.request.method} ${context.path} took ${end - begin} ms`);
          });
        });
      });
  }
}
