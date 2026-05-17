import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KinerjaBidangController } from './kinerja-bidang.controller';
import { KinerjaBidangRepository } from './kinerja-bidang.repository';
import { KinerjaBidangService } from './kinerja-bidang.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [KinerjaBidangController],
  providers: [KinerjaBidangRepository, KinerjaBidangService],
  exports: [KinerjaBidangRepository, KinerjaBidangService],
})
export class KinerjaBidangModule {}
