import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ok } from '../shared/respond';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async health() {
    const database = await this.checkDatabase();

    return ok({
      service: 'silakap-hostinger-api',
      status: database === 'up' ? 'healthy' : 'degraded',
      environment: process.env.NODE_ENV ?? 'development',
      uptime: Math.round(process.uptime()),
      database,
      timestamp: new Date().toISOString(),
    });
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}
