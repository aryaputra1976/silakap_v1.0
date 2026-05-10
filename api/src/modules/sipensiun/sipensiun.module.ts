import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapModule } from '../siap/siap.module';
import { SipensiunController } from './sipensiun.controller';
import { SipensiunRepository } from './sipensiun.repository';
import { SipensiunService } from './sipensiun.service';

@Module({
  imports: [AuthModule, PrismaModule, SiapModule],
  controllers: [SipensiunController],
  providers: [SipensiunRepository, SipensiunService],
})
export class SipensiunModule {}
