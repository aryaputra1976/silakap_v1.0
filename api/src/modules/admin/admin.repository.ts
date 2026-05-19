import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  listUsers() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        {
          name: 'asc',
        },
        {
          username: 'asc',
        },
      ],
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        nip: true,
        phone: true,
        status: true,
        unitKerja: {
          select: {
            id: true,
            kode: true,
            nama: true,
          },
        },
        userRoles: {
          select: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
          orderBy: {
            role: {
              code: 'asc',
            },
          },
        },
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: {
        code: 'asc',
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        isActive: true,
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        {
          resource: 'asc',
        },
        {
          action: 'asc',
        },
        {
          code: 'asc',
        },
      ],
      select: {
        id: true,
        code: true,
        name: true,
        resource: true,
        action: true,
        description: true,
        isActive: true,
      },
    });
  }

  async getSettingsSummary() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      totalRoles,
      activeRoles,
      systemRoles,
      totalPermissions,
      activePermissions,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      this.prisma.role.count(),
      this.prisma.role.count({ where: { isActive: true } }),
      this.prisma.role.count({ where: { isSystem: true } }),
      this.prisma.permission.count(),
      this.prisma.permission.count({ where: { isActive: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
      },
      roles: {
        total: totalRoles,
        active: activeRoles,
        system: systemRoles,
      },
      permissions: {
        total: totalPermissions,
        active: activePermissions,
      },
    };
  }
}
