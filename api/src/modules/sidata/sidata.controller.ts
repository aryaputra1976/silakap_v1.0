import { Controller, Get } from '@nestjs/common';
import { ok } from '../shared/respond';

@Controller('api/v1/sidata')
export class SidataController {
  @Get('asn')
  findAsn() {
    return ok([], 'SIDATA ASN endpoint ready');
  }
}
