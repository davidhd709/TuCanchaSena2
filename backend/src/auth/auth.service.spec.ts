/**
 * TEST UNITARIO — AuthService
 * ===========================
 * Probamos la lógica de negocio del servicio de autenticación
 * SIN conectarnos a la base de datos real (usamos "mocks").
 *
 * Estructura de un test con Jest:
 *   describe('nombre del grupo') → agrupa tests relacionados
 *   it('nombre del test')        → un caso de prueba individual
 *   expect(valor).toBe(x)        → aserción: verifica que el valor es el esperado
 */

import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'

// ─────────────────────────────────────────────────────────────────
// MOCKS: objetos falsos que simulan las dependencias reales
// ─────────────────────────────────────────────────────────────────

/**
 * Mock de PrismaService:
 * Simulamos las funciones de la base de datos que usa AuthService.
 * jest.fn() crea una función "espía" que podemos controlar en cada test.
 */
const mockPrismaService = {
  user: {
    findUnique: jest.fn(), // simula prisma.user.findUnique()
    create: jest.fn(),     // simula prisma.user.create()
  },
}

/**
 * Mock de JwtService:
 * Simulamos la firma del token JWT para no necesitar la clave secreta real.
 */
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'), // siempre devuelve un token falso
}

// ─────────────────────────────────────────────────────────────────
// DATOS REUTILIZABLES
// ─────────────────────────────────────────────────────────────────

/** Usuario completo de ejemplo (incluye password hasheada) */
const mockFullUser = {
  id: 'user-uuid-1',
  email: 'test@tucancha.com',
  password: 'hashed-password',
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '3001234567',
  role: 'client',
  isActive: true,
  createdAt: new Date('2025-01-01'),
}

// ─────────────────────────────────────────────────────────────────
// SUITE PRINCIPAL
// ─────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService

  /**
   * beforeEach: se ejecuta ANTES de cada test individual.
   * Aquí creamos un módulo de NestJS "de prueba" con nuestros mocks
   * en lugar de las dependencias reales.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService }, // ← inyectamos el mock
        { provide: JwtService, useValue: mockJwtService },        // ← inyectamos el mock
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)

    // Limpiamos el estado de los mocks entre tests para evitar interferencias
    jest.clearAllMocks()
  })

  // ── Smoke test ──────────────────────────────────────────────────
  it('debería estar definido (smoke test)', () => {
    /**
     * El "smoke test" más básico: simplemente verifica que el servicio
     * se pudo instanciar correctamente. Si hay algún error de configuración
     * o importación, este test lo captura primero.
     */
    expect(service).toBeDefined()
  })

  // ── Tests de register() ─────────────────────────────────────────
  describe('register()', () => {
    const registerDto = {
      email: 'test@tucancha.com',
      password: 'Password123!',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '3001234567',
    }

    it('debería registrar un nuevo usuario correctamente (happy path)', async () => {
      /**
       * Escenario: el email NO existe en la BD → debe crear el usuario
       * y devolver un token + datos del usuario.
       *
       * Controlamos los mocks para este escenario:
       * 1. findUnique devuelve null → el usuario no existe
       * 2. create devuelve un usuario falso
       */
      mockPrismaService.user.findUnique.mockResolvedValue(null)
      mockPrismaService.user.create.mockResolvedValue(mockFullUser)

      const result = await service.register(registerDto)

      // Verificamos la estructura de la respuesta
      expect(result).toHaveProperty('access_token', 'mock-jwt-token')
      expect(result).toHaveProperty('user')
      expect(result.user.email).toBe(registerDto.email)
      // La contraseña NUNCA debe aparecer en la respuesta pública
      expect(result.user).not.toHaveProperty('password')
      // Verificamos que se llamó a create exactamente una vez
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1)
    })

    it('debería lanzar ConflictException si el email ya está registrado', async () => {
      /**
       * Escenario: el email YA existe → debe lanzar un error 409 Conflict.
       * findUnique devuelve un usuario existente.
       */
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-user' })

      // expect(...).rejects.toThrow() verifica que la función lanza una excepción
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException)
      // Verificamos que NUNCA se llamó a create (no debe crear si ya existe)
      expect(mockPrismaService.user.create).not.toHaveBeenCalled()
    })
  })

  // ── Tests de login() ────────────────────────────────────────────
  describe('login()', () => {
    const loginDto = {
      email: 'test@tucancha.com',
      password: 'Password123!',
    }

    it('debería hacer login correctamente con credenciales válidas (happy path)', async () => {
      /**
       * Escenario: usuario existe, está activo, y la contraseña es correcta.
       * bcrypt.compare compara el texto plano con el hash real.
       */
      const hashedPassword = await bcrypt.hash(loginDto.password, 10)
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockFullUser,
        password: hashedPassword,
      })

      const result = await service.login(loginDto)

      expect(result).toHaveProperty('access_token', 'mock-jwt-token')
      expect(result.user.email).toBe(loginDto.email)
      expect(result.user).not.toHaveProperty('password')
    })

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('debería lanzar UnauthorizedException si el usuario está inactivo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockFullUser,
        isActive: false, // ← usuario desactivado
      })

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10)
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockFullUser,
        password: hashedPassword,
        isActive: true,
      })

      // Enviamos una contraseña diferente a la que está hasheada
      await expect(
        service.login({ email: loginDto.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  // ── Tests de me() ───────────────────────────────────────────────
  describe('me()', () => {
    it('debería devolver los datos públicos del usuario autenticado (happy path)', async () => {
      /**
       * Escenario: el usuario existe en la BD → devuelve sus datos sin password.
       */
      mockPrismaService.user.findUnique.mockResolvedValue(mockFullUser)

      const result = await service.me('user-uuid-1')

      expect(result.id).toBe('user-uuid-1')
      expect(result.email).toBe('test@tucancha.com')
      // La contraseña nunca debe exponerse
      expect(result).not.toHaveProperty('password')
    })

    it('debería lanzar UnauthorizedException si el userId no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(service.me('non-existent-id')).rejects.toThrow(UnauthorizedException)
    })
  })
})
