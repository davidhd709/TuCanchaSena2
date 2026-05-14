import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, ScheduleDto, UpdateBusinessDto } from './dto/business.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { buildPaginated, pageParams } from '../common/utils/paginate';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async findAll(p: PaginationDto) {
    const { skip, take, page, pageSize } = pageParams(p);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.business.findMany({
        where: { isActive: true },
        skip,
        take,
        include: {
          schedules: true,
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { courts: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count({ where: { isActive: true } }),
    ]);
    return buildPaginated(data, total, page, pageSize);
  }

  findByOwner(ownerId: string) {
    return this.prisma.business.findMany({
      where: { ownerId, isActive: true },
      include: { schedules: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: { schedules: true, courts: true },
    });
    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }
    return business;
  }

  async create(dto: CreateBusinessDto, currentUser: { sub: string; role: string }) {
    // El dueño (rol business) solo puede crear SU negocio y uno solo.
    let ownerId = dto.ownerId;
    if (currentUser.role === 'business') {
      ownerId = currentUser.sub;
      const existing = await this.prisma.business.findFirst({
        where: { ownerId: currentUser.sub, isActive: true },
      });
      if (existing) {
        throw new BadRequestException('Ya tienes un negocio registrado');
      }
    }
    if (!ownerId) {
      throw new BadRequestException('ownerId es requerido');
    }

    return this.prisma.business.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        images: dto.images ?? [],
        amenities: dto.amenities ?? [],
        policies: dto.policies,
        schedules: dto.schedules
          ? { create: dto.schedules.map((s) => this.scheduleData(s)) }
          : undefined,
      },
      include: { schedules: true },
    });
  }

  async update(id: string, dto: UpdateBusinessDto, currentUser: { sub: string; role: string }) {
    const business = await this.findOne(id);
    if (currentUser.role !== 'admin' && business.ownerId !== currentUser.sub) {
      throw new ForbiddenException('No puedes editar este negocio');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.schedules) {
        await tx.businessSchedule.deleteMany({ where: { businessId: id } });
        await tx.businessSchedule.createMany({
          data: dto.schedules.map((s) => ({ ...this.scheduleData(s), businessId: id })),
        });
      }
      const { schedules, ...rest } = dto;
      return tx.business.update({
        where: { id },
        data: rest,
        include: { schedules: true },
      });
    });
  }

  async remove(id: string, currentUser: { sub: string; role: string }) {
    const business = await this.findOne(id);
    if (currentUser.role !== 'admin' && business.ownerId !== currentUser.sub) {
      throw new ForbiddenException('No puedes eliminar este negocio');
    }
    return this.prisma.business.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private scheduleData(s: ScheduleDto) {
    return {
      dayOfWeek: s.dayOfWeek,
      openTime: s.openTime,
      closeTime: s.closeTime,
      isOpen: s.isOpen ?? true,
    };
  }
}
