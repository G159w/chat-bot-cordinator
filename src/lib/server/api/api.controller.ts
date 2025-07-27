import { env } from '$env/dynamic/private';
import { AgentController } from '$server/api/agent/agent.controller';
import { CrewController } from '$server/api/crew/crew.controller';
import { FlowController } from '$server/api/flow/flow.controller';
import { Logger } from '$server/api/logger';
import { AuthGuard } from '$server/api/utils/auth';
import { HttpErrorHandler } from '$server/api/utils/exceptions';
import { opentelemetry } from '@elysiajs/opentelemetry';
import { serverTiming } from '@elysiajs/server-timing';
import swagger from '@elysiajs/swagger';
import { inject, injectable } from '@needle-di/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Elysia } from 'elysia';
import prometheusPlugin from 'elysia-prometheus';

@injectable()
export class ApiController {
  app: ReturnType<typeof this.getApp>;

  baseApp: ReturnType<typeof this.getBaseApp>;

  constructor(
    private readonly agentController = inject(AgentController),
    private readonly crewController = inject(CrewController),
    private readonly flowController = inject(FlowController),
    private readonly logger = inject(Logger),
    private readonly httpErrorHandler = inject(HttpErrorHandler),
    private readonly authGuard = inject(AuthGuard)
  ) {
    this.baseApp = this.getBaseApp();
    this.app = this.getApp(this.baseApp);
  }

  getApp(app: typeof this.baseApp) {
    return app
      .use(this.httpErrorHandler.handleError)
      .use(this.agentController.getControllerApp)
      .use(this.crewController.getControllerApp)
      .use(this.flowController.getControllerApp);
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
      .use(
        prometheusPlugin({
          dynamicLabels: {
            userAgent: (ctx) => ctx.request.headers.get('user-agent') ?? 'unknown'
          },
          metricsPath: '/metrics',
          staticLabels: { service: 'AoA' }
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
