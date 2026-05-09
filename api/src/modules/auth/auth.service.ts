import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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
  ) {}

  async login(dto: LoginDto) {
    const user = await this.authRepository.findByUsername(dto.username);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Username atau password tidak valid');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
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
