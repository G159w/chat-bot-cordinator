import { injectable } from '@needle-di/core';
import { ConsoleTransport, LogLayer } from 'loglayer';

@injectable()
export class Logger extends LogLayer {
  constructor() {
    super({
      prefix: '[AoA API]',
      transport: new ConsoleTransport({
        logger: console
      })
    });
  }
}
