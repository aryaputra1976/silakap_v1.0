import { UseGuards, SetMetadata } from '@nestjs/common';
import { SiapAssignGuard } from '../guards/siap-assign.guard';

/**
 * Metadata key untuk SIAP action types
 */
export const SIAP_ACTION_KEY = 'siapAction';

/**
 * Decorator untuk protect endpoint yang memerlukan SIAP action rights
 * 
 * Kombinasi dengan @UseGuards(SiapAssignGuard) untuk assign/reassign task
 * 
 * Usage:
 * @Post('tasks/:id/assign')
 * @RequireSiapAction('ASSIGN_TASK')
 * async assignTask(...) { }
 * 
 * @Post('tasks/:id/reassign')
 * @RequireSiapAction('REASSIGN_TASK')
 * async reassignTask(...) { }
 * 
 * @param actionType - Tipe action yang akan dilakukan (ASSIGN_TASK, REASSIGN_TASK, APPROVE_TASK, dll)
 */
export const RequireSiapAction = (actionType: string) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(SIAP_ACTION_KEY, actionType)(target, propertyKey, descriptor);
    UseGuards(SiapAssignGuard)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator untuk require supervisor role (KABID atau ANALIS_MADYA)
 * 
 * Usage:
 * @Get('team/workload')
 * @RequireSiapSupervisor()
 * async getTeamWorkload(...) { }
 */
export const RequireSiapSupervisor = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const supervisorRoles = ['KABID', 'ANALIS_MADYA'];
    SetMetadata('requiredRoles', supervisorRoles)(target, propertyKey, descriptor);
  };
};
