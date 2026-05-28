import { SetMetadata, UseGuards } from '@nestjs/common';
import { SiapAssignGuard } from '../guards/siap-assign.guard';

export const SIAP_ACTION_KEY = 'siapAction';

export function RequireSiapAction(actionType: string): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(SIAP_ACTION_KEY, actionType)(target, propertyKey, descriptor);
    UseGuards(SiapAssignGuard)(target, propertyKey, descriptor);
  };
}

export function RequireSiapSupervisorRoles(
  supervisorRoles: string[],
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata('requiredRoles', supervisorRoles)(
      target,
      propertyKey,
      descriptor,
    );
    UseGuards(SiapAssignGuard)(target, propertyKey, descriptor);
  };
}