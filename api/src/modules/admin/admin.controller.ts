import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ok } from '../shared/respond';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'] as const;

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class AdminController {
  constructor(
    @Inject(AdminService)
    private readonly service: AdminService,
  ) {}

  @Get('users')
  async listUsers() {
    return ok(await this.service.listUsers(), 'Daftar pengguna berhasil dimuat');
  }

  @Get('roles')
  async listRoles() {
    return ok(await this.service.listRoles(), 'Daftar role berhasil dimuat');
  }

  @Get('permissions')
  async listPermissions() {
    return ok(
      await this.service.listPermissions(),
      'Daftar permission berhasil dimuat',
    );
  }

  @Get('settings/summary')
  async getSettingsSummary() {
    return ok(
      await this.service.getSettingsSummary(),
      'Ringkasan pengaturan berhasil dimuat',
    );
  }
}
