import { PrismaClient, UserRole, CourtType, DayOfWeek, CourtStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('Password123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tucancha.local' },
    update: {},
    create: {
      email: 'admin@tucancha.local',
      password: passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.admin,
    },
  })

  const businessOwner = await prisma.user.upsert({
    where: { email: 'negocio@tucancha.local' },
    update: {},
    create: {
      email: 'negocio@tucancha.local',
      password: passwordHash,
      firstName: 'Carlos',
      lastName: 'Pérez',
      phone: '+57 300 000 0000',
      role: UserRole.bussines,
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'cliente@tucancha.local' },
    update: {},
    create: {
      email: 'cliente@tucancha.local',
      password: passwordHash,
      firstName: 'Ana',
      lastName: 'Gómez',
      phone: '+57 311 000 0000',
      role: UserRole.client,
    },
  })

  const business = await prisma.business.create({
    data: {
      ownerId: businessOwner.id,
      name: 'Cancha El Estadio',
      description: 'Complejo deportivo con canchas sintéticas premium.',
      phone: '+57 300 111 2233',
      email: 'contacto@elestadio.local',
      address: 'Calle 10 #20-30, Bogotá',
      latitude: 4.6097,
      longitude: -74.0817,
      schedules: {
        create: [
          { dayOfWeek: DayOfWeek.monday, openTime: '08:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: DayOfWeek.tuesday, openTime: '08:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: DayOfWeek.wednesday, openTime: '08:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: DayOfWeek.thursday, openTime: '08:00', closeTime: '22:00', isOpen: true },
          { dayOfWeek: DayOfWeek.friday, openTime: '08:00', closeTime: '23:00', isOpen: true },
          { dayOfWeek: DayOfWeek.saturday, openTime: '07:00', closeTime: '23:00', isOpen: true },
          { dayOfWeek: DayOfWeek.sunday, openTime: '07:00', closeTime: '21:00', isOpen: true },
        ],
      },
    },
  })

  const court = await prisma.court.create({
    data: {
      businessId: business.id,
      name: 'Cancha 1 — Principal',
      type: CourtType.football_7,
      description: 'Cancha 7 vs 7 con grama sintética nueva e iluminación LED.',
      pricePerHour: 80000,
      capacity: 14,
      status: CourtStatus.available,
      availability: {
        create: [
          { dayOfWeek: DayOfWeek.monday, startTime: '08:00', endTime: '22:00', isAvailable: true },
          { dayOfWeek: DayOfWeek.tuesday, startTime: '08:00', endTime: '22:00', isAvailable: true },
          { dayOfWeek: DayOfWeek.wednesday, startTime: '08:00', endTime: '22:00', isAvailable: true },
          { dayOfWeek: DayOfWeek.thursday, startTime: '08:00', endTime: '22:00', isAvailable: true },
          { dayOfWeek: DayOfWeek.friday, startTime: '08:00', endTime: '23:00', isAvailable: true, pricePerHour: 100000 },
          { dayOfWeek: DayOfWeek.saturday, startTime: '07:00', endTime: '23:00', isAvailable: true, pricePerHour: 100000 },
          { dayOfWeek: DayOfWeek.sunday, startTime: '07:00', endTime: '21:00', isAvailable: true },
        ],
      },
    },
  })

  await prisma.software.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Tu Cancha SaaS',
      descripcion: 'Plataforma de reservas para canchas sintéticas.',
      version: '1.0.0',
      status: 'activo',
      tags: ['reservas', 'fútbol', 'saas'],
      imagenes: [],
    },
  })

  console.log('Seed completo:')
  console.log(`  admin:    ${admin.email} / Password123!`)
  console.log(`  negocio:  ${businessOwner.email} / Password123!`)
  console.log(`  cliente:  ${client.email} / Password123!`)
  console.log(`  business: ${business.name}`)
  console.log(`  court:    ${court.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
