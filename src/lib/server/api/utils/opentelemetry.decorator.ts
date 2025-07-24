import { record } from '@elysiajs/opentelemetry';

/**
 * Class decorator that wraps all public instance methods with an OpenTelemetry span using the method name.
 * Each span will include the method arguments as attributes (args.0, args.1, ...).
 * Works for both sync and async methods. Can be used on controllers, services, and repositories.
 */
export function opentelemetry(): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    const className = target.name;
    const propertyNames = Object.getOwnPropertyNames(target.prototype);
    for (const propertyName of propertyNames) {
      if (
        propertyName === 'constructor' ||
        propertyName.startsWith('#') ||
        typeof target.prototype[propertyName] !== 'function'
      ) {
        continue;
      }
      const originalMethod = target.prototype[propertyName];
      target.prototype[propertyName] = function (...args: unknown[]) {
        const spanName = `${className}.${propertyName}`;
        return record(spanName, (span) => {
          // Attach each argument as a span attribute
          args.forEach((arg, idx) => {
            try {
              span.setAttribute(`args.${idx}`, JSON.stringify(arg));
            } catch {
              span.setAttribute(`args.${idx}`, String(arg));
            }
          });
          return originalMethod.apply(this, args);
        });
      };
    }
  };
}
