/**
 * TEST UNITARIO — BookingsService
 * ================================
 * Probamos la lógica del servicio de reservas.
 *
 * Este servicio tiene lógica de negocio compleja:
 * - Cálculo de slots disponibles (toMinutes, conflictos)
 * - Validaciones de horario y disponibilidad
 * - Control de acceso por rol
 *
 * Usamos mocks para Prisma y ConfigService igual que en auth.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { BookingsService } from './bookings.service'
import { PrismaService } from '../prisma/prisma.service'

// ─────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────

const mockPrismaService: any = {
  booking: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  court: {
    findUnique: jest.fn(),
  },
  business: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
}

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:8001'),
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
  availability: [
    {
      dayOfWeek: 'monday',
      isAvailable: true,
      startTime: '08:00',
      endTime: '22:00',
      pricePerHour: null, // usará el precio de la cancha (50000)
    },
  ],
}

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
      ],
    }).compile()

    service = module.get<BookingsService>(BookingsService)
    jest.clearAllMocks()
  })

  it('debería estar definido (smoke test)', () => {
    expect(service).toBeDefined()
  })

  // ── Tests de availableSlots() ────────────────────────────────
  describe('availableSlots()', () => {
    it('debería lanzar NotFoundException si la cancha no existe', async () => {
      /**
       * Si la cancha no existe en la BD, el servicio debe lanzar 404.
       * Simulamos que findUnique devuelve null.
       */
      mockPrismaService.court.findUnique.mockResolvedValue(null)

      await expect(
        service.availableSlots('non-existent-court', '2025-01-06'),
      ).rejects.toThrow(NotFoundException)
    })

    it('debería devolver slots disponibles para una fecha válida', async () => {
      /**
       * Escenario feliz: cancha existe, tiene disponibilidad el lunes,
       * y no hay reservas existentes ese día.
       * Esperamos que devuelva slots de 1 hora cada uno (08:00-09:00, 09:00-10:00, ...)
       */
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      mockPrismaService.booking.findMany.mockResolvedValue([]) // sin reservas previas

      const result = await service.availableSlots('court-1', '2025-01-06') // lunes

      expect(result.courtId).toBe('court-1')
      expect(result.dayOfWeek).toBe('monday')
      expect(result.slots).toBeInstanceOf(Array)
      expect(result.slots.length).toBe(14) // 08:00 a 22:00 = 14 horas = 14 slots
      // Todos los slots deben estar disponibles (no hay reservas)
      expect(result.slots.every((s) => s.isAvailable)).toBe(true)
      // El precio por hora debe ser el de la cancha
      expect(result.slots[0].pricePerHour).toBe(50000)
    })

    it('debería marcar un slot como NO disponible si hay una reserva que choca', async () => {
      /**
       * Hay una reserva de 10:00 a 11:00.
       * El slot 10:00-11:00 debe aparecer como isAvailable: false.
       * Los demás deben seguir disponibles.
       */
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      mockPrismaService.booking.findMany.mockResolvedValue([
        {
          startTime: '10:00',
          endTime: '11:00',
          status: 'confirmed',
        },
      ])

      const result = await service.availableSlots('court-1', '2025-01-06')

      // El slot de las 10:00 (índice 2 → 08:00, 09:00, 10:00) debe estar ocupado
      const slot10 = result.slots.find((s) => s.startTime === '10:00')
      expect(slot10).toBeDefined()
      expect(slot10!.isAvailable).toBe(false)

      // El slot de las 09:00 debe seguir libre
      const slot09 = result.slots.find((s) => s.startTime === '09:00')
      expect(slot09!.isAvailable).toBe(true)
    })
  })

  // ── Tests de create() ────────────────────────────────────────
  describe('create()', () => {
    const createDto = {
      courtId: 'court-1',
      date: '2025-01-06', // lunes
      startTime: '10:00',
      endTime: '11:00',
      paymentMethod: 'cash',
      notes: 'Reserva de prueba',
    }
    const userId = 'user-uuid-1'

    it('debería lanzar NotFoundException si la cancha no existe', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(null)

      await expect(service.create(createDto, userId)).rejects.toThrow(NotFoundException)
    })

    it('debería lanzar BadRequestException si la cancha no está disponible', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue({
        ...mockCourt,
        status: 'maintenance', // cancha en mantenimiento
      })

      await expect(service.create(createDto, userId)).rejects.toThrow(BadRequestException)
    })

    it('debería lanzar BadRequestException si la hora de fin es igual o menor que la de inicio', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)

      await expect(
        service.create({ ...createDto, endTime: '09:00' }, userId), // fin antes que inicio
      ).rejects.toThrow(BadRequestException)
    })

    it('debería lanzar ConflictException si ya hay una reserva en ese horario', async () => {
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      // Simulamos que ya hay una reserva solapada
      mockPrismaService.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        startTime: '10:00',
        endTime: '11:00',
      })

      await expect(service.create(createDto, userId)).rejects.toThrow(ConflictException)
    })

    it('debería crear la reserva correctamente y calcular el precio total', async () => {
      /**
       * Escenario feliz: cancha disponible, sin conflictos, horario válido.
       * El precio debe calcularse como: horas × pricePerHour
       * 1 hora × $50.000 = $50.000
       */
      mockPrismaService.court.findUnique.mockResolvedValue(mockCourt)
      mockPrismaService.booking.findFirst.mockResolvedValue(null) // sin conflictos
      mockPrismaService.booking.create.mockResolvedValue({
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
      // Verificamos que create fue llamado con totalPrice correcto
      expect(mockPrismaService.booking.create).toHaveBeenCalledWith(
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

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException)
    })

    it('debería devolver la reserva si existe', async () => {
      const mockBooking = { id: 'booking-1', status: 'pending', court: {}, user: {} }
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking)

      const result = await service.findOne('booking-1')

      expect(result).toEqual(mockBooking)
    })
  })
})
