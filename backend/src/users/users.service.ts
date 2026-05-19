import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(({ password, ...u }) => u);
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('El correo ya está registrado');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
      },
    });
    const { password, ...rest } = user;
    return rest;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const { password, ...rest } = user;
    return rest;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    const { password, ...rest } = user;
    return rest;
  }

  async deactivate(id: string) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    const { password, ...rest } = user;
    return rest;
  }
}
