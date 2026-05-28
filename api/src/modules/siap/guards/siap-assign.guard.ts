import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthUser } from '../../auth/auth.types';

/**
 * Guard untuk memastikan user memiliki permission assign/reassign task
 * 
 * Hanya SUPER_ADMIN, KABID, ANALIS_MADYA yang boleh assign
 * ADMIN_BKPSDM dan ANALIS_MUDA TIDAK boleh assign
 * 
 * Usage:
 * @Post('tasks/:id/assign')
 * @UseGuards(SiapAssignGuard)
 * async assignTask(...) { }
 */
@Injectable()
export class SiapAssignGuard implements CanActivate {
  private readonly ASSIGN_ROLES = [
    'SUPER_ADMIN',
    'KABID',
    'ANALIS_MADYA',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      throw new ForbiddenException('User tidak terautentikasi');
    }

    const hasPermission = user.roles.some((role) =>
      this.ASSIGN_ROLES.includes(role),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Role ${user.roles.join(', ')} tidak diizinkan melakukan assignment task. Hanya ${this.ASSIGN_ROLES.join(', ')} yang diizinkan.`,
      );
    }

    return true;
  }
}
