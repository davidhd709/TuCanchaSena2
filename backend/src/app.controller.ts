import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up', service: 'tucancha-backend' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'fail',
        db: 'down',
        service: 'tucancha-backend',
      });
    }
  }
}
