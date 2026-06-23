import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('public/stats')
  async getPublicStats() {
    const [courts, bookings] = await Promise.all([
      this.prisma.court.count({ where: { isActive: true } }),
      this.prisma.booking.count(),
    ]);

    return {
      totalCourts: courts,
      totalBookings: bookings,
      averageRating: 4.9, // Valor por defecto hasta tener reseñas reales
    };
  }

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
