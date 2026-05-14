import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtDto, ReplaceAvailabilityDto, UpdateCourtDto } from './dto/court.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { buildPaginated, pageParams } from '../common/utils/paginate';

@Injectable()
export class CourtsService {
  constructor(private prisma: PrismaService) {}

  async findAll(p: PaginationDto) {
    const { skip, take, page, pageSize } = pageParams(p);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.court.findMany({
        where: { isActive: true },
        skip,
        take,
        include: {
          availability: true,
          business: {
            select: { id: true, name: true, address: true, latitude: true, longitude: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.court.count({ where: { isActive: true } }),
    ]);
    return buildPaginated(data, total, page, pageSize);
  }

  findByBusiness(businessId: string) {
    return this.prisma.court.findMany({
      where: { businessId, isActive: true },
      include: { availability: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const court = await this.prisma.court.findUnique({
      where: { id },
      include: {
        availability: true,
        business: { include: { schedules: true } },
      },
    });
    if (!court) {
      throw new NotFoundException('Cancha no encontrada');
    }
    return court;
  }

  async create(dto: CreateCourtDto, currentUser: { sub: string; role: string }) {
    await this.assertBusinessAccess(dto.businessId, currentUser);
    return this.prisma.court.create({
      data: {
        businessId: dto.businessId,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        pricePerHour: dto.pricePerHour,
        capacity: dto.capacity ?? 10,
        status: dto.status ?? 'available',
      },
      include: { availability: true },
    });
  }

  async update(id: string, dto: UpdateCourtDto, currentUser: { sub: string; role: string }) {
    const court = await this.findOne(id);
    await this.assertBusinessAccess(court.businessId, currentUser);
    return this.prisma.court.update({
      where: { id },
      data: dto,
      include: { availability: true },
    });
  }

  async remove(id: string, currentUser: { sub: string; role: string }) {
    const court = await this.findOne(id);
    await this.assertBusinessAccess(court.businessId, currentUser);
    return this.prisma.court.update({
      where: { id },
      data: { isActive: false },
    });
  }

  getAvailability(id: string) {
    return this.prisma.courtAvailability.findMany({
      where: { courtId: id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async replaceAvailability(
    id: string,
    dto: ReplaceAvailabilityDto,
    currentUser: { sub: string; role: string }
  ) {
    const court = await this.findOne(id);
    await this.assertBusinessAccess(court.businessId, currentUser);

    return this.prisma.$transaction(async (tx) => {
      await tx.courtAvailability.deleteMany({ where: { courtId: id } });
      if (dto.availability.length > 0) {
        await tx.courtAvailability.createMany({
          data: dto.availability.map((a) => ({
            courtId: id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            isAvailable: a.isAvailable ?? true,
            pricePerHour: a.pricePerHour ?? null,
          })),
        });
      }
      return tx.court.findUnique({
        where: { id },
        include: { availability: true },
      });
    });
  }

  private async assertBusinessAccess(
    businessId: string,
    currentUser: { sub: string; role: string }
  ) {
    if (currentUser.role === 'admin') {
      return;
    }
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }
    if (business.ownerId !== currentUser.sub) {
      throw new ForbiddenException('No tienes acceso a este negocio');
    }
  }
}
