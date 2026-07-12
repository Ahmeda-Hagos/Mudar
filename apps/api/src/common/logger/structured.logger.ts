import { Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';

/**
 * Enterprise Production Logger.
 * Extends default console loggers and formats logs into structured JSON strings.
 * Perfect for logging to standard output streams (stdout) to be ingested
 * by external collectors (AWS CloudWatch, Datadog, Sentry, logstash).
 */
@Injectable()
export class StructuredLogger extends ConsoleLogger implements LoggerService {
  constructor(context?: string) {
    super(context || 'Mudar-API');
  }

  log(message: any, context?: string) {
    this.printStructuredLog('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printStructuredLog('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.printStructuredLog('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.printStructuredLog('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.printStructuredLog('verbose', message, context);
  }

  private printStructuredLog(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      context: context || this.context,
      message: typeof message === 'object' ? message : String(message),
      ...(trace ? { trace } : {}),
    };

    // Output raw JSON in production environments for indexing engines
    if (process.env.NODE_ENV === 'production') {
      process.stdout.write(JSON.stringify(payload) + '\n');
    } else {
      // Human-readable format in local development console
      super[level === 'info' ? 'log' : level as any](message, context);
    }
  }
}
