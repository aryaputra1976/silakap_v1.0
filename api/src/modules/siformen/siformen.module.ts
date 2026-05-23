import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiformenController } from './siformen.controller';
import { SiformenRepository } from './siformen.repository';
import { SiformenService } from './siformen.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SiformenController],
  providers: [SiformenRepository, SiformenService],
  exports: [SiformenRepository, SiformenService],
})
export class SiformenModule {}
