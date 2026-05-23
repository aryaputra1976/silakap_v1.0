import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RefGajiPokokController } from './ref-gaji-pokok.controller';
import { RefGajiPokokRepository } from './ref-gaji-pokok.repository';
import { RefGajiPokokService } from './ref-gaji-pokok.service';

@Module({
  imports: [AuthModule],
  controllers: [RefGajiPokokController],
  providers: [RefGajiPokokRepository, RefGajiPokokService],
  exports: [RefGajiPokokService],
})
export class RefGajiPokokModule {}
