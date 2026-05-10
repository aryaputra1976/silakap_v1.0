import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiarsipController } from './siarsip.controller';
import { SiarsipRepository } from './siarsip.repository';
import { SiarsipService } from './siarsip.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SiarsipController],
  providers: [SiarsipRepository, SiarsipService],
})
export class SiarsipModule {}
