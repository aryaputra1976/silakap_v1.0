import type { Request } from 'express';
import type { AuditContext } from '../audit/audit.service';

export function getAuditContext(request: Request): AuditContext {
  return {
    ipAddress: getClientIp(request),
    userAgent: request.get('user-agent') ?? null,
  };
}

function getClientIp(request: Request) {
  const forwardedFor = request.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || request.ip || null;
  }

  return request.ip || null;
}
