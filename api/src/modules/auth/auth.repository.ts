import { Injectable } from '@nestjs/common';
import { Role } from './auth.types';
import { PrismaService } from '../prisma/prisma.service';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  unitId?: string;
  isActive: boolean;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fallbackUsers: UserRecord[] = [
    {
      id: 'usr-super-admin',
      name: 'Super Admin',
      email: 'admin@silakap.local',
      passwordHash: '$2b$10$2nb/mj/CW.Q93/AFO1y3OuwxV2i2W3meOkBV.oXgRT5iyBf408rZO',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  ];

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email ?? user.username,
        passwordHash: user.passwordHash,
        role: (user.userRoles[0]?.role.code ?? 'ASN') as Role,
        unitId: user.unitKerjaId ?? undefined,
        isActive: user.status === 'ACTIVE',
      };
    } catch {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Database auth repository unavailable');
      }

      return (
        this.fallbackUsers.find((user) => user.email === normalizedEmail) ??
        null
      );
    }
  }
}
