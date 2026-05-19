import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IkmController } from './ikm.controller';
import { IkmRepository } from './ikm.repository';
import { IkmService } from './ikm.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [IkmController],
  providers: [IkmRepository, IkmService],
  exports: [IkmRepository, IkmService],
})
export class IkmModule {}
