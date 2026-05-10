import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapController } from './siap.controller';
import { SiapRepository } from './siap.repository';
import { SiapService } from './siap.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SiapController],
  providers: [SiapRepository, SiapService],
  exports: [SiapRepository, SiapService],
})
export class SiapModule {}
