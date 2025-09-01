import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

type ReadyCode = 0 | 1 | 2 | 3;
type ReadyName =
  | 'disconnected'
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'unknown';

const STATE_MAP: Record<number, ReadyName> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};


@ApiTags('trucks')
@ApiBearerAuth('bearer')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check() {
    const code = this.connection.readyState as ReadyCode;
    const state = STATE_MAP[code] ?? 'unknown';
    return { app: 'ok', db: { state, code } };
  }
}
