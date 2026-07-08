import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global Exception Filter to catch all errors and map them
 * into standardized, predictable API JSON responses.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred on the server.';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent: any = exception.getResponse();

      if (typeof resContent === 'object' && resContent !== null) {
        message = resContent.message ?? message;
        if (Array.isArray(resContent.message)) {
          // Flatten array messages from ValidationPipe into structured records
          message = 'Validation failed';
          errors = { validation: resContent.message };
        } else if (resContent.errors) {
          errors = resContent.errors;
        }
      } else if (typeof resContent === 'string') {
        message = resContent;
      }
    } else {
      // Log native system errors (e.g. database errors) safely
      this.logger.error(
        `Unhanded Exception caught: ${exception instanceof Error ? exception.message : JSON.stringify(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
