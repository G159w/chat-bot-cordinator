import { env } from '$env/dynamic/private';
import { opentelemetry } from '@elysiajs/opentelemetry';
import { serverTiming } from '@elysiajs/server-timing';
import swagger from '@elysiajs/swagger';
import { inject, injectable } from '@needle-di/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Elysia } from 'elysia';

import { AgentController } from './agent/agent.controller';
import { CrewController } from './crew/crew.controller';
import { Logger } from './logger';
import { AuthGuard } from './utils/auth';
import { HttpErrorHandler } from './utils/exceptions';
import { WorkflowController } from './workflow/workflow.controller';

// Initialize PostgreSQL instrumentation
const pgInstrumentation = new PgInstrumentation({
  enhancedDatabaseReporting: true,
  // Add custom attributes to request spans
  requestHook: (span, request) => {
    if (request && 'text' in request && typeof request.text === 'string') {
      // Add the SQL query as an attribute (be careful with sensitive data)
      span.setAttribute('db.statement', request.text);
    }
  },
  // Add custom attributes to spans
  responseHook: (span, response) => {
    if (response && 'rowCount' in response && typeof response.rowCount === 'number') {
      span.setAttribute('db.rows_affected', response.rowCount);
    }
  }
});

// Register PostgreSQL instrumentation
registerInstrumentations({
  instrumentations: [pgInstrumentation]
});

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
      .use(serverTiming())
      .use(
        opentelemetry({
          serviceName: 'AoA',
          spanProcessor: new BatchSpanProcessor(
            new OTLPTraceExporter({
              headers: {
                Authorization: `Bearer ${env.AXIOM_TOKEN}`,
                'X-Axiom-Dataset': env.AXIOM_DATASET
              },
              url: env.AXIOM_URL
            })
          )
        })
      )
      .use(
        swagger({
          documentation: {
            info: {
              description: 'The complete API for the AoA project',
              title: 'AoA API',
              version: '1.0.0'
            }
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
