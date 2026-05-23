import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PemberhentianController } from './pemberhentian.controller';
import { PemberhentianRepository } from './pemberhentian.repository';
import { PemberhentianService } from './pemberhentian.service';

@Module({
  imports: [PrismaModule],
  controllers: [PemberhentianController],
  providers: [PemberhentianService, PemberhentianRepository],
  exports: [PemberhentianService],
})
export class PemberhentianModule {}
