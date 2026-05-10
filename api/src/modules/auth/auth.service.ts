import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthRepository, UserRecord } from './auth.repository';
import { AuthUser, JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthRepository)
    private readonly authRepository: AuthRepository,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, context?: AuditContext) {
    const user = await this.authRepository.findByUsername(dto.username);

    if (!user || !user.isActive) {
      await this.auditService.record({
        entityType: 'AUTH',
        entityId: dto.username.trim().toLowerCase(),
        action: 'LOGIN_FAILED',
        performedBy: null,
        afterData: {
          reason: 'USER_NOT_FOUND_OR_INACTIVE',
          username: dto.username.trim().toLowerCase(),
        },
        context,
      });
      throw new UnauthorizedException('Username atau password tidak valid');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      await this.auditService.record({
        entityType: 'AUTH',
        entityId: user.id,
        action: 'LOGIN_FAILED',
        performedBy: user.id,
        afterData: {
          reason: 'INVALID_PASSWORD',
          username: user.username,
        },
        context,
      });
      throw new UnauthorizedException('Username atau password tidak valid');
    }

    await this.authRepository.updateLastLogin(user.id);

    const authUser = this.toAuthUser(user);

    const payload: JwtPayload = {
      sub: authUser.id,
      username: authUser.username,
      name: authUser.name,
      email: authUser.email,
      roles: authUser.roles,
      unitKerjaId: authUser.unitKerjaId,
      unitKerja: authUser.unitKerja,
    };

    await this.auditService.record({
      entityType: 'AUTH',
      entityId: user.id,
      action: 'LOGIN_SUCCESS',
      performedBy: user.id,
      afterData: {
        username: user.username,
        roles: authUser.roles,
      },
      context,
    });

    return {
      user: authUser,
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  getProfile(user: AuthUser) {
    return user;
  }

  private toAuthUser(user: UserRecord): AuthUser {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roles: user.roles,
      unitKerjaId: user.unitKerjaId,
      unitKerja: user.unitKerja,
    };
  }
}
