import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, RejectBookingDto } from './dto/booking.dto';

const DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  findAll() {
    return this.prisma.booking.findMany({
      include: { court: { include: { business: true } }, user: this.userSelect() },
      orderBy: { createdAt: 'desc' },
    });
  }

  findMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { court: { include: { business: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findByBusiness(businessId: string, currentUser: { sub: string; role: string }) {
    if (currentUser.role !== 'admin') {
      const business = await this.prisma.business.findUnique({ where: { id: businessId } });
      if (!business) {
        throw new NotFoundException('Negocio no encontrado');
      }
      if (business.ownerId !== currentUser.sub) {
        throw new ForbiddenException('No tienes acceso a este negocio');
      }
    }
    return this.prisma.booking.findMany({
      where: { court: { businessId } },
      include: { court: true, user: this.userSelect() },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { court: { include: { business: true } }, user: this.userSelect() },
    });
    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return booking;
  }

  async availableSlots(courtId: string, dateStr: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { availability: true },
    });
    if (!court) {
      throw new NotFoundException('Cancha no encontrada');
    }

    const date = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = DAYS[date.getDay()];

    const dayAvailability = court.availability.filter(
      (a) => a.dayOfWeek === dayOfWeek && a.isAvailable
    );

    const dayBookings = await this.prisma.booking.findMany({
      where: {
        courtId,
        date: new Date(`${dateStr}T00:00:00`),
        status: { in: ['pending', 'confirmed', 'completed'] },
      },
    });

    const slots: any[] = [];
    for (const av of dayAvailability) {
      const start = toMinutes(av.startTime);
      const end = toMinutes(av.endTime);
      const price = av.pricePerHour ? Number(av.pricePerHour) : Number(court.pricePerHour);

      for (let m = start; m + 60 <= end; m += 60) {
        const slotStart = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((m + 60) / 60)).padStart(2, '0')}:${String((m + 60) % 60).padStart(2, '0')}`;

        const conflict = dayBookings.some((b) => {
          const bs = toMinutes(b.startTime);
          const be = toMinutes(b.endTime);
          return m < be && m + 60 > bs;
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: !conflict,
          pricePerHour: price,
        });
      }
    }

    return { date: dateStr, dayOfWeek, courtId, slots };
  }

  async create(dto: CreateBookingDto, userId: string, paymentProofPath?: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: dto.courtId },
      include: { availability: true },
    });
    if (!court) {
      throw new NotFoundException('Cancha no encontrada');
    }
    if (court.status !== 'available' || !court.isActive) {
      throw new BadRequestException('Esta cancha no está disponible');
    }

    const startMin = toMinutes(dto.startTime);
    const endMin = toMinutes(dto.endTime);
    if (endMin <= startMin) {
      throw new BadRequestException('La hora de fin debe ser mayor a la de inicio');
    }

    const date = new Date(`${dto.date}T00:00:00`);
    const dayOfWeek = DAYS[date.getDay()];

    const fits = court.availability.some(
      (a) =>
        a.dayOfWeek === dayOfWeek &&
        a.isAvailable &&
        toMinutes(a.startTime) <= startMin &&
        toMinutes(a.endTime) >= endMin
    );
    if (!fits) {
      throw new BadRequestException('La cancha no abre en ese horario');
    }

    const hours = (endMin - startMin) / 60;
    const slot = court.availability.find(
      (a) =>
        a.dayOfWeek === dayOfWeek &&
        toMinutes(a.startTime) <= startMin &&
        toMinutes(a.endTime) >= endMin
    );
    const pricePerHour = slot?.pricePerHour
      ? Number(slot.pricePerHour)
      : Number(court.pricePerHour);
    const totalPrice = hours * pricePerHour;

    const proofUrl = paymentProofPath
      ? `${this.config.get<string>('PUBLIC_BASE_URL') ?? ''}/uploads/${paymentProofPath}`
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const overlap = await tx.booking.findFirst({
        where: {
          courtId: dto.courtId,
          date,
          status: { in: ['pending', 'confirmed'] },
          AND: [{ startTime: { lt: dto.endTime } }, { endTime: { gt: dto.startTime } }],
        },
      });
      if (overlap) {
        throw new ConflictException('El horario ya está reservado');
      }

      return tx.booking.create({
        data: {
          courtId: dto.courtId,
          userId,
          date,
          startTime: dto.startTime,
          endTime: dto.endTime,
          paymentMethod: dto.paymentMethod,
          paymentProof: proofUrl,
          notes: dto.notes,
          totalPrice,
        },
        include: { court: true },
      });
    });
  }

  async confirm(id: string, currentUser: { sub: string; role: string }) {
    const booking = await this.findOne(id);
    await this.assertBusinessAccess(booking, currentUser);
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'confirmed' },
    });
  }

  async reject(id: string, dto: RejectBookingDto, currentUser: { sub: string; role: string }) {
    const booking = await this.findOne(id);
    await this.assertBusinessAccess(booking, currentUser);
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled', cancellationReason: dto.cancellationReason },
    });
  }

  async complete(id: string, currentUser: { sub: string; role: string }) {
    const booking = await this.findOne(id);
    await this.assertBusinessAccess(booking, currentUser);
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'completed' },
    });
  }

  async noShow(id: string, currentUser: { sub: string; role: string }) {
    const booking = await this.findOne(id);
    await this.assertBusinessAccess(booking, currentUser);
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'no_show' },
    });
  }

  async cancel(id: string, currentUser: { sub: string; role: string }) {
    const booking = await this.findOne(id);
    if (currentUser.role === 'client' && booking.userId !== currentUser.sub) {
      throw new ForbiddenException('No puedes cancelar esta reserva');
    }
    if (currentUser.role === 'business' && booking.court.business.ownerId !== currentUser.sub) {
      throw new ForbiddenException('No puedes cancelar esta reserva');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  private async assertBusinessAccess(
    booking: { court: { businessId: string } },
    currentUser: { sub: string; role: string }
  ) {
    if (currentUser.role === 'admin') {
      return;
    }
    const business = await this.prisma.business.findUnique({
      where: { id: booking.court.businessId },
    });
    if (!business || business.ownerId !== currentUser.sub) {
      throw new ForbiddenException('No tienes acceso a esta reserva');
    }
  }

  private userSelect() {
    return {
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    };
  }
}
