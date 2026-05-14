import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, RejectBookingDto } from './dto/booking.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { buildPaginated, pageParams } from '../common/utils/paginate';
import { STORAGE_DRIVER, StorageDriver, UploadInput } from '../uploads/storage.driver';

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

/** Minutos que una reserva pendiente bloquea el horario antes de vencer. */
const BOOKING_HOLD_MINUTES = 30;

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_DRIVER) private storage: StorageDriver
  ) {}

  async findAll(p: PaginationDto) {
    const { skip, take, page, pageSize } = pageParams(p);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        skip,
        take,
        include: { court: { include: { business: true } }, user: this.userSelect() },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count(),
    ]);
    return buildPaginated(data, total, page, pageSize);
  }

  async findMine(userId: string, p: PaginationDto) {
    const { skip, take, page, pageSize } = pageParams(p);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where: { userId },
        skip,
        take,
        include: { court: { include: { business: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.booking.count({ where: { userId } }),
    ]);
    return buildPaginated(data, total, page, pageSize);
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
    // Libera horarios cuyo bloqueo temporal de 30 min ya venció.
    await this.expireStale();

    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { availability: true, business: { include: { schedules: true } } },
    });
    if (!court) {
      throw new NotFoundException('Cancha no encontrada');
    }

    const date = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = DAYS[date.getDay()];

    // La disponibilidad real depende del negocio: si está inactivo, la cancha
    // en mantenimiento, o el negocio cerrado ese día → no hay slots.
    const bizSchedule = court.business.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (
      !court.business.isActive ||
      court.status !== 'available' ||
      !court.isActive ||
      !bizSchedule ||
      !bizSchedule.isOpen
    ) {
      return { date: dateStr, dayOfWeek, courtId, slots: [] as any[] };
    }
    const bizOpen = toMinutes(bizSchedule.openTime);
    const bizClose = toMinutes(bizSchedule.closeTime);

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
      // Horario más restrictivo: intersección entre cancha y negocio.
      const start = Math.max(toMinutes(av.startTime), bizOpen);
      const end = Math.min(toMinutes(av.endTime), bizClose);
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

  async create(dto: CreateBookingDto, userId: string, file?: UploadInput) {
    // Libera horarios cuyo bloqueo temporal de 30 min ya venció.
    await this.expireStale();

    const court = await this.prisma.court.findUnique({
      where: { id: dto.courtId },
      include: { availability: true, business: { include: { schedules: true } } },
    });
    if (!court) {
      throw new NotFoundException('Cancha no encontrada');
    }
    if (court.status !== 'available' || !court.isActive) {
      throw new BadRequestException('Esta cancha no está disponible');
    }
    if (!court.business.isActive) {
      throw new BadRequestException('El negocio no está disponible');
    }

    const startMin = toMinutes(dto.startTime);
    const endMin = toMinutes(dto.endTime);
    if (endMin <= startMin) {
      throw new BadRequestException('La hora de fin debe ser mayor a la de inicio');
    }

    const date = new Date(`${dto.date}T00:00:00`);
    const dayOfWeek = DAYS[date.getDay()];

    // El negocio debe estar abierto ese día y el horario debe caber en su franja.
    const bizSchedule = court.business.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!bizSchedule || !bizSchedule.isOpen) {
      throw new BadRequestException('El negocio está cerrado ese día');
    }
    if (toMinutes(bizSchedule.openTime) > startMin || toMinutes(bizSchedule.closeTime) < endMin) {
      throw new BadRequestException('El horario está fuera del horario de atención del negocio');
    }

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

    const proofUrl = file ? (await this.storage.save(file)).url : undefined;

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
          // Bloqueo temporal: el horario queda reservado 30 min mientras se valida el pago.
          expiresAt: new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000),
        },
        include: { court: true },
      });
    });
  }

  async confirm(id: string, currentUser: { sub: string; role: string }) {
    const booking = await this.findOne(id);
    await this.assertBusinessAccess(booking, currentUser);
    // Pago validado: la reserva ya no vence.
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'confirmed', expiresAt: null },
    });
  }

  async reject(id: string, dto: RejectBookingDto, currentUser: { sub: string; role: string }) {
    const booking = await this.findOne(id);
    await this.assertBusinessAccess(booking, currentUser);
    // Rechazada (estado propio, distinto de cancelada) → el horario vuelve a estar libre.
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'rejected', cancellationReason: dto.cancellationReason, expiresAt: null },
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

  /**
   * Expiración lazy: marca como `expired` las reservas pendientes cuyo bloqueo
   * temporal de 30 min ya venció, liberando el horario. Se llama en los caminos
   * que dependen de la disponibilidad (crear reserva, ver slots).
   */
  private async expireStale() {
    await this.prisma.booking.updateMany({
      where: { status: 'pending', expiresAt: { lt: new Date() } },
      data: { status: 'expired' },
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
