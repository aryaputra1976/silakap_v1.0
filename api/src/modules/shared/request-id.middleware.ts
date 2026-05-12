import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const incoming = request.header(REQUEST_ID_HEADER);
  const requestId = incoming && incoming.length <= 100 ? incoming : randomUUID();

  response.setHeader(REQUEST_ID_HEADER, requestId);
  request.headers[REQUEST_ID_HEADER] = requestId;

  next();
}

export function getRequestId(request: Request) {
  const value = request.headers[REQUEST_ID_HEADER];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}