import type { LoggerService } from '@nestjs/common';
import pino from 'pino';

export const appLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['password', 'token', 'accessToken', 'refreshToken'],
    censor: '[REDACTED]',
  },
});

export class PinoLoggerService implements LoggerService {
  log(message: unknown, ...context: unknown[]): void {
    appLogger.info({ context, message });
  }

  error(message: unknown, ...context: unknown[]): void {
    appLogger.error({ context, message });
  }

  warn(message: unknown, ...context: unknown[]): void {
    appLogger.warn({ context, message });
  }

  debug(message: unknown, ...context: unknown[]): void {
    appLogger.debug({ context, message });
  }

  verbose(message: unknown, ...context: unknown[]): void {
    appLogger.trace({ context, message });
  }

  fatal(message: unknown, ...context: unknown[]): void {
    appLogger.fatal({ context, message });
  }
}
