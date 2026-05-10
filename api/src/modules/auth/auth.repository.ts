import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string | null;
  passwordHash: string;
  roles: string[];
  unitKerjaId: string | null;
  unitKerja: {
    id: string;
    kode: string;
    nama: string;
  } | null;
  isActive: boolean;
}

type UserRoleRecord = {
  role: {
    code: string;
  };
};

type AuthUserDbRecord = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  passwordHash: string;
  status: string;
  unitKerjaId: string | null;
  unitKerja: {
    id: string;
    kode: string;
    nama: string;
  } | null;
  userRoles: UserRoleRecord[];
  deletedAt: Date | null;
};

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findByUsername(username: string): Promise<UserRecord | null> {
    const normalizedUsername = username.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        unitKerja: {
          select: {
            id: true,
            kode: true,
            nama: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return this.toUserRecord(user as AuthUserDbRecord);
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        unitKerja: {
          select: {
            id: true,
            kode: true,
            nama: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return this.toUserRecord(user as AuthUserDbRecord);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  private toUserRecord(user: AuthUserDbRecord): UserRecord {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: user.userRoles.map((userRole: UserRoleRecord) => userRole.role.code),
      unitKerjaId: user.unitKerjaId,
      unitKerja: user.unitKerja,
      isActive: user.status === 'ACTIVE',
    };
  }
}