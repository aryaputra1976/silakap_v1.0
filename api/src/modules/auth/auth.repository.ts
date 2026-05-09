import { Inject, Injectable } from '@nestjs/common';
import { AccountStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const authUserInclude = {
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
} satisfies Prisma.UserInclude;

type AuthUserEntity = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;

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

@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private toUserRecord(user: AuthUserEntity): UserRecord {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: user.userRoles.map((userRole) => userRole.role.code),
      unitKerjaId: user.unitKerjaId,
      unitKerja: user.unitKerja,
      isActive: user.status === AccountStatus.ACTIVE,
    };
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const normalizedUsername = username.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
      include: authUserInclude,
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return this.toUserRecord(user);
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: authUserInclude,
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return this.toUserRecord(user);
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
}
