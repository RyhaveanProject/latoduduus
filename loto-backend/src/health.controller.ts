import { Controller, Get, Head } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  // Root route for Render health probes (GET / and HEAD /)
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'loto-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Head()
  rootHead() {
    return;
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
