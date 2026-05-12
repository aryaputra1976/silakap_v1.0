import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestId } from './request-id.middleware';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.resolveMessage(exceptionResponse, exception, status);
    const requestId = getRequestId(request);
    const timestamp = new Date().toISOString();

    if (status >= 500) {
      this.logger.error(
        `[${requestId ?? 'no-request-id'}] ${request.method} ${request.url} failed: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${requestId ?? 'no-request-id'}] ${request.method} ${request.url} rejected: ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        statusCode: status,
        path: request.url,
        method: request.method,
        timestamp,
        requestId,
      },
    });
  }

  private resolveMessage(
    response: unknown,
    exception: unknown,
    status: number,
  ) {
    if (status >= 500 && process.env.NODE_ENV === 'production') {
      return 'Terjadi kesalahan pada server';
    }

    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object' && 'message' in response) {
      const message = (response as { message: unknown }).message;

      if (Array.isArray(message)) {
        return message.join('; ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    if (exception instanceof Error && exception.message) {
      return exception.message;
    }

    return 'Terjadi kesalahan pada server';
  }
}