/**
 * TEST UNITARIO — BookingsService
 * ================================
 * Probamos la lógica del servicio de reservas.
 *
 * Este servicio tiene lógica de negocio compleja:
 * - Cálculo de slots disponibles (toMinutes, conflictos)
 * - Validaciones de horario y disponibilidad
 * - Control de acceso por rol
 * - Transacciones de base de datos ($transaction) para evitar race conditions
 *
 * Usamos mocks para Prisma y ConfigService igual que en auth.service.spec.ts
 *
 * NOTA IMPORTANTE sobre $transaction:
 * BookingsService.create() usa prisma.$transaction(async tx => {...})
 * para garantizar consistencia. Debemos mockear ese método también,
 * haciendo que ejecute el callback con un "tx" (cliente de transacción) falso.
 */

import { Test, TestingModule } from '@nestjs/testing'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { BookingsService } from './bookings.service'
import { PrismaService } from '../prisma/prisma.service'
import { STORAGE_DRIVER } from '../uploads/storage.driver'

// ─────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────

/**
 * txMock: simula el cliente de transacción que Prisma pasa al callback
 * de $transaction. Necesita exactamente los mismos métodos que usamos
 * dentro del callback (tx.booking.findFirst y tx.booking.create).
 */
const txMock = {
  booking: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
}

/**
 * mockPrismaService: simula el PrismaService completo.
 *
 * $transaction: cuando BookingsService llama a
 *   this.prisma.$transaction(async (tx) => { ... })
 * nuestro mock ejecuta el callback inmediatamente con txMock,
 * de forma que los tests pueden controlar qué devuelven
 * txMock.booking.findFirst y txMock.booking.create.
 */
const mockPrismaService = {
  booking: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    // `expireStale()` la usa en availableSlots/create y en el cron.
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn(),
  },
  court: {
    findUnique: jest.fn(),
  },
  business: {
    findUnique: jest.fn(),
  },
  // ← CLAVE: ejecuta el callback con txMock y devuelve su resultado
  $transaction: jest.fn().mockImplementation((cb: (tx: typeof txMock) => Promise<unknown>) =>
    cb(txMock),
  ),
}

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:8001'),
}

/** Mock del storage driver: devuelve una URL fija para el comprobante. */
const mockStorageDriver = {
  save: jest.fn().mockResolvedValue({ key: 'k', url: 'http://stub/proof.png' }),
}

// ─────────────────────────────────────────────────────────────────
// DATOS DE PRUEBA REUTILIZABLES
// ─────────────────────────────────────────────────────────────────

/**
 * Una cancha con disponibilidad el lunes de 08:00 a 22:00
 * Usaremos "2025-01-06" que es lunes.
 */
const mockCourt = {
  id: 'court-1',
  name: 'Cancha Principal',
  status: 'available',
  isActive: true,
  pricePerHour: 50000,
  businessId: 'business-1',
  availability: [
    {
      dayOfWeek: 'monday',
      isAvailable: true,
      startTime: '08:00',
      endTime: '22:00',
      pricePerHour: null, // usará el precio de la cancha (50000)
    },
  ],
  // El servicio valida que el negocio esté activo y abierto ese día.
  business: {
    id: 'business-1',
    isActive: true,
    schedules: [
      {
        dayOfWeek: 'monday',
        isOpen: true,
        openTime: '08:00',
        closeTime: '22:00',
      },
    ],
  },
}

/** DTO estándar para crear una reserva de 10:00 a 11:00 el 2025-01-06 (lunes) */
const createDto = {
  courtId: 'court-1',
  date: '2025-01-06', // lunes
  startTime: '10:00',
  endTime: '11:00',
  paymentMethod: 'cash',
  notes: 'Reserva de prueba',
}

const userId = 'user-uuid-1'

/** Reserva existente completa para tests de confirm/reject/cancel */
const mockBooking = {
  id: 'booking-1',
  courtId: 'court-1',
  userId,
  date: new Date('2025-01-06'),
  startTime: '10:00',
  endTime: '11:00',
  totalPrice: 50000,
  status: 'pending',
  court: {
    id: 'court-1',
    businessId: 'business-1',
    business: { id: 'business-1', ownerId: 'owner-uuid-1' },
  },
  user: { id: userId, firstName: 'Juan', lastName: 'Pérez', email: 'test@tucancha.com', phone: '3001234567' },
}

const adminUser = { sub: 'admin-uuid', role: 'admin' }
const ownerUser = { sub: 'owner-uuid-1', role: 'business' }
const clientUser = { sub: userId, role: 'client' }
const strangerUser = { sub: 'stranger-uuid', role: 'client' }

// ─────────────────────────────────────────────────────────────────
// SUITE PRINCIPAL
// ─────────────────────────────────────────────────────────────────

describe('BookingsService', () => {
  let service: BookingsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: STORAGE_DRIVER, useValue: mockStorageDriver },
      ],
    }).compile()

    service = module.get<BookingsService>(BookingsService)

    // Limpiamos todos los mocks (incluidos txMock y $transaction)
    jest.clearAllMocks()

    // Restauramos la implementación por defecto de $transaction tras clearAllMocks
    mockPrismaService.$transaction.mockImplementation(
      (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock),
    )
  })

  it('debería estar definido (smoke test)', () => {
    expect(service).toBeDefined()
  })

  // ── Tests de availableSlots() ────────────────────────────────
  describe('availableSlots()', () => {
    it('debería lanzar NotFoundException si la cancha no existe', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(null)

      await expect(
        service.availableSlots('non-existent-court', '2025-01-06'),
      ).rejects.toThrow(NotFoundException)
    })

    it('debería devolver slots disponibles para una fecha válida', async () => {
      /**
       * Cancha existe, tiene disponibilidad el lunes, sin reservas previas.
       * Esperamos 14 slots de 1 hora (08:00 → 22:00).
       */
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      mockPrismaService.booking.findMany.mockResolvedValue([])

      const result = await service.availableSlots('court-1', '2025-01-06')

      expect(result.courtId).toBe('court-1')
      expect(result.dayOfWeek).toBe('monday')
      expect(result.slots).toBeInstanceOf(Array)
      expect(result.slots.length).toBe(14)
      expect(result.slots.every((s) => s.isAvailable)).toBe(true)
      expect(result.slots[0].pricePerHour).toBe(50000)
    })

    it('debería marcar un slot como NO disponible si hay una reserva que choca', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      mockPrismaService.booking.findMany.mockResolvedValue([
        { startTime: '10:00', endTime: '11:00', status: 'confirmed' },
      ])

      const result = await service.availableSlots('court-1', '2025-01-06')

      const slot10 = result.slots.find((s) => s.startTime === '10:00')
      expect(slot10).toBeDefined()
      expect(slot10!.isAvailable).toBe(false)

      const slot09 = result.slots.find((s) => s.startTime === '09:00')
      expect(slot09!.isAvailable).toBe(true)
    })
  })

  // ── Tests de create() ────────────────────────────────────────
  describe('create()', () => {
    it('debería lanzar NotFoundException si la cancha no existe', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(null)

      await expect(service.create(createDto, userId)).rejects.toThrow(NotFoundException)
    })

    it('debería lanzar BadRequestException si la cancha no está disponible (mantenimiento)', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue({
        ...mockCourt,
        status: 'maintenance',
      })

      await expect(service.create(createDto, userId)).rejects.toThrow(BadRequestException)
    })

    it('debería lanzar BadRequestException si la hora de fin es igual o menor que la de inicio', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)

      await expect(
        service.create({ ...createDto, endTime: '09:00' }, userId),
      ).rejects.toThrow(BadRequestException)
    })

    it('debería lanzar ConflictException si ya hay una reserva en ese horario', async () => {
      /**
       * $transaction ejecuta el callback con txMock.
       * txMock.booking.findFirst devuelve una reserva solapada → ConflictException.
       */
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      txMock.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        startTime: '10:00',
        endTime: '11:00',
      })

      await expect(service.create(createDto, userId)).rejects.toThrow(ConflictException)
    })

    it('debería crear la reserva correctamente y calcular el precio total (happy path)', async () => {
      /**
       * Escenario feliz: cancha disponible, sin conflictos, horario válido.
       * 1 hora × $50.000 = $50.000
       */
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      txMock.booking.findFirst.mockResolvedValue(null) // sin solapamiento
      txMock.booking.create.mockResolvedValue({
        id: 'new-booking-1',
        courtId: 'court-1',
        userId,
        date: new Date('2025-01-06'),
        startTime: '10:00',
        endTime: '11:00',
        totalPrice: 50000,
        status: 'pending',
        court: mockCourt,
      })

      const result = await service.create(createDto, userId)

      expect(result).toHaveProperty('id', 'new-booking-1')
      expect(result.totalPrice).toBe(50000)
      expect(txMock.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalPrice: 50000,
            userId,
          }),
        }),
      )
    })
  })

  // ── Tests de findOne() ───────────────────────────────────────
  describe('findOne()', () => {
    it('debería lanzar NotFoundException si la reserva no existe', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null)

      await expect(service.findOne('non-existent-id', adminUser)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('admin: ve cualquier reserva', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)

      const result = await service.findOne('booking-1', adminUser)

      expect(result).toEqual(mockBooking)
    })

    it('client: ve su propia reserva', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)

      const result = await service.findOne('booking-1', clientUser)

      expect(result).toEqual(mockBooking)
    })

    it('client: ForbiddenException al intentar ver reserva ajena (IDOR)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)

      await expect(service.findOne('booking-1', strangerUser)).rejects.toThrow(
        ForbiddenException,
      )
    })

    it('business: ve reserva de cancha de un negocio que posee', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'business-1',
        ownerId: ownerUser.sub,
      })

      const result = await service.findOne('booking-1', ownerUser)

      expect(result).toEqual(mockBooking)
    })

    it('business: ForbiddenException si la cancha no es de un negocio propio (IDOR)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'business-1',
        ownerId: 'otro-owner',
      })

      await expect(
        service.findOne('booking-1', { sub: 'otro-business', role: 'business' }),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  // ── Tests de confirm() / approve ────────────────────────────
  describe('confirm() — approve', () => {
    it('debería confirmar una reserva si el usuario es admin (happy path)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.booking.update.mockResolvedValue({ ...mockBooking, status: 'confirmed' })

      const result = await service.confirm('booking-1', adminUser)

      expect(result.status).toBe('confirmed')
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'confirmed', expiresAt: null } }),
      )
    })

    it('debería confirmar una reserva si el usuario es dueño del negocio (happy path)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'business-1',
        ownerId: ownerUser.sub,
      })
      mockPrismaService.booking.update.mockResolvedValue({ ...mockBooking, status: 'confirmed' })

      const result = await service.confirm('booking-1', ownerUser)

      expect(result.status).toBe('confirmed')
    })

    it('debería lanzar ForbiddenException si el usuario no tiene acceso al negocio', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'business-1',
        ownerId: 'otro-owner-distinto',
      })

      await expect(
        service.confirm('booking-1', { sub: 'stranger-uuid', role: 'business' }),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  // ── Tests de reject() ────────────────────────────────────────
  describe('reject()', () => {
    it('debería rechazar una reserva con motivo de cancelación (happy path)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'rejected',
        cancellationReason: 'Mantenimiento imprevisto',
      })

      const result = await service.reject(
        'booking-1',
        { cancellationReason: 'Mantenimiento imprevisto' },
        adminUser,
      )

      expect(result.status).toBe('rejected')
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: 'rejected',
            cancellationReason: 'Mantenimiento imprevisto',
            expiresAt: null,
          },
        }),
      )
    })
  })

  // ── Tests de cancel() ────────────────────────────────────────
  describe('cancel()', () => {
    it('debería cancelar su propia reserva si el usuario es cliente (happy path)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.booking.update.mockResolvedValue({ ...mockBooking, status: 'cancelled' })

      const result = await service.cancel('booking-1', clientUser)

      expect(result.status).toBe('cancelled')
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'cancelled' } }),
      )
    })

    it('debería lanzar ForbiddenException si un cliente intenta cancelar la reserva de otro', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)

      await expect(
        service.cancel('booking-1', { sub: 'other-user-uuid', role: 'client' }),
      ).rejects.toThrow(ForbiddenException)
    })

    it('debería cancelar como admin sin restricciones (happy path)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)
      mockPrismaService.booking.update.mockResolvedValue({ ...mockBooking, status: 'cancelled' })

      const result = await service.cancel('booking-1', adminUser)

      expect(result.status).toBe('cancelled')
    })
  })

  // ── Test de Race Condition ───────────────────────────────────
  /**
   * RACE CONDITION TEST
   * ===================
   * Simula dos reservas concurrentes para el MISMO slot de tiempo.
   *
   * Escenario real:
   *   - Usuario A y Usuario B intentan reservar la cancha 'court-1'
   *     el 2025-01-06 de 10:00 a 11:00 AL MISMO TIEMPO.
   *   - La BD usa $transaction para garantizar que solo una tenga éxito.
   *
   * Implementación del mock:
   *   - Primera llamada a $transaction: txMock.booking.findFirst → null (sin solapamiento)
   *     → se crea la reserva → resolved.
   *   - Segunda llamada a $transaction: txMock.booking.findFirst → reserva existente
   *     → se lanza ConflictException → rejected.
   *
   * Usamos Promise.allSettled para lanzar ambas promesas simultáneamente
   * y capturar tanto el fulfilled como el rejected sin que el test falle.
   */
  describe('create() — race condition', () => {
    it('una reserva debe completarse y la otra debe lanzar ConflictException (409)', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)

      const newBookingResult = {
        id: 'new-booking-race',
        courtId: 'court-1',
        userId: 'user-a',
        date: new Date('2025-01-06'),
        startTime: '10:00',
        endTime: '11:00',
        totalPrice: 50000,
        status: 'pending',
        court: mockCourt,
      }

      /**
       * $transaction se llama dos veces (una por cada promesa concurrente).
       * mockImplementationOnce controla exactamente qué sucede en cada llamada:
       *
       * 1ª llamada ($transaction de usuario A):
       *   - findFirst → null (slot libre) → create → éxito
       *
       * 2ª llamada ($transaction de usuario B):
       *   - findFirst → reserva existente → ConflictException lanzada
       */
      mockPrismaService.$transaction
        .mockImplementationOnce(async (cb: (tx: typeof txMock) => Promise<unknown>) => {
          // Usuario A llega primero: no encuentra solapamiento → crea reserva
          txMock.booking.findFirst.mockResolvedValueOnce(null)
          txMock.booking.create.mockResolvedValueOnce(newBookingResult)
          return cb(txMock)
        })
        .mockImplementationOnce(async (cb: (tx: typeof txMock) => Promise<unknown>) => {
          // Usuario B llega justo después: encuentra la reserva de A → conflicto
          txMock.booking.findFirst.mockResolvedValueOnce({
            id: 'new-booking-race',
            startTime: '10:00',
            endTime: '11:00',
          })
          return cb(txMock)
        })

      const dtoCopy = { ...createDto }

      // Lanzamos ambas peticiones simultáneamente
      const [resultA, resultB] = await Promise.allSettled([
        service.create(dtoCopy, 'user-a'),
        service.create(dtoCopy, 'user-b'),
      ])

      // Exactamente 1 debe completarse
      const fulfilled = [resultA, resultB].filter((r) => r.status === 'fulfilled')
      const rejected = [resultA, resultB].filter((r) => r.status === 'rejected')

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)

      // El rechazado debe ser específicamente un ConflictException (HTTP 409)
      const rejectedResult = rejected[0] as PromiseRejectedResult
      expect(rejectedResult.reason).toBeInstanceOf(ConflictException)
    })
  })
})
