import { Inject, Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import type {
  AdminPermissionRecord,
  AdminRoleRecord,
  AdminSettingsSummary,
  AdminUserRecord,
} from './admin.types';

@Injectable()
export class AdminService {
  constructor(
    @Inject(AdminRepository)
    private readonly repository: AdminRepository,
  ) {}

  async listUsers(): Promise<AdminUserRecord[]> {
    const users = await this.repository.listUsers();

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      nip: user.nip,
      phone: user.phone,
      status: user.status,
      unitKerja: user.unitKerja,
      roles: user.userRoles.map((userRole) => userRole.role),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  }

  async listRoles(): Promise<AdminRoleRecord[]> {
    const roles = await this.repository.listRoles();

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      userCount: role._count.userRoles,
      permissionCount: role._count.rolePermissions,
    }));
  }

  listPermissions(): Promise<AdminPermissionRecord[]> {
    return this.repository.listPermissions();
  }

  getSettingsSummary(): Promise<AdminSettingsSummary> {
    return this.repository.getSettingsSummary();
  }
}
