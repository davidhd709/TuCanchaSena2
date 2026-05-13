import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSoftwareDto, UpdateSoftwareDto } from './dto/software.dto';

@Injectable()
export class SoftwareService {
  constructor(private prisma: PrismaService) {}

  findActive() {
    return this.prisma.software.findMany({
      where: { status: 'activo' },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.software.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const sw = await this.prisma.software.findUnique({ where: { id } });
    if (!sw) {
      throw new NotFoundException('Software no encontrado');
    }
    return sw;
  }

  create(dto: CreateSoftwareDto) {
    return this.prisma.software.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        version: dto.version,
        status: dto.status ?? 'activo',
        tags: dto.tags ?? [],
        imagenes: dto.imagenes ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateSoftwareDto) {
    await this.findOne(id);
    return this.prisma.software.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.software.delete({ where: { id } });
  }
}
