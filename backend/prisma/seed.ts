import { PrismaClient, UserRole, CourtType, DayOfWeek, CourtStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

/** Disponibilidad semanal estándar para una cancha. */
const weeklyAvailability = () => ({
  create: [
    { dayOfWeek: DayOfWeek.monday, startTime: '08:00', endTime: '22:00', isAvailable: true },
    { dayOfWeek: DayOfWeek.tuesday, startTime: '08:00', endTime: '22:00', isAvailable: true },
    { dayOfWeek: DayOfWeek.wednesday, startTime: '08:00', endTime: '22:00', isAvailable: true },
    { dayOfWeek: DayOfWeek.thursday, startTime: '08:00', endTime: '22:00', isAvailable: true },
    { dayOfWeek: DayOfWeek.friday, startTime: '08:00', endTime: '23:00', isAvailable: true, pricePerHour: undefined },
    { dayOfWeek: DayOfWeek.saturday, startTime: '07:00', endTime: '23:00', isAvailable: true },
    { dayOfWeek: DayOfWeek.sunday, startTime: '07:00', endTime: '21:00', isAvailable: true },
  ],
})

/** Imágenes reales y estables (picsum) — cada cancha con su propia galería. */
const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/600`

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
      role: UserRole.business,
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

  // Seed re-ejecutable: limpia negocios/canchas/reservas previas (los usuarios se conservan).
  await prisma.booking.deleteMany({})
  await prisma.business.deleteMany({})

  const business = await prisma.business.create({
    data: {
      ownerId: businessOwner.id,
      name: 'Sintético Fútbol Club',
      description:
        'Complejo deportivo con canchas sintéticas premium. Ambiente familiar, ' +
        'parqueadero amplio y zona de descanso.',
      phone: '+57 300 111 2233',
      email: 'contacto@sinteticofutbol.local',
      address: 'Calle 10 #20-30, Bogotá',
      latitude: 4.6097,
      longitude: -74.0817,
      images: [img('estadio-fachada'), img('estadio-zona')],
      amenities: [
        'WiFi',
        'Baños',
        'Parqueadero',
        'Iluminación nocturna',
        'Vestidores',
      ],
      policies:
        'Llega 10 minutos antes de tu reserva. El pago se valida por transferencia.',
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

  // Canchas basadas en la imagen de Railway
  const courtsSeed = [
    {
      name: 'Cancha Principal "El Cilindro"',
      type: CourtType.football_7,
      description: 'Cancha principal de alta calidad.',
      pricePerHour: 130000,
      capacity: 14,
      rating: 4.8,
      ratingCount: 50,
      amenities: ['Iluminación LED', 'Parqueadero'],
      images: [img('cilindro-1'), img('cilindro-2')],
    },
    {
      name: 'F5 techada',
      type: CourtType.football_5,
      description: 'Cancha techada para fútbol 5.',
      pricePerHour: 50000,
      capacity: 10,
      rating: 4.7,
      ratingCount: 40,
      amenities: ['Techo', 'Iluminación'],
      images: [img('f5-techada-1')],
    },
    {
      name: 'Futbol',
      type: CourtType.football_7,
      description: 'Cancha estándar de fútbol.',
      pricePerHour: 60000,
      capacity: 14,
      rating: 4.6,
      ratingCount: 30,
      amenities: ['Iluminación'],
      images: [img('futbol-1')],
    },
    {
      name: 'futbol sala 1',
      type: CourtType.futsal,
      description: 'Cancha de futsal profesional.',
      pricePerHour: 70000,
      capacity: 10,
      rating: 4.9,
      ratingCount: 60,
      amenities: ['Piso sintético', 'Iluminación'],
      images: [img('sala1-1')],
    },
    {
      name: 'futbolin',
      type: CourtType.football_7,
      description: 'Cancha recreativa de fútbol.',
      pricePerHour: 80000,
      capacity: 14,
      rating: 4.5,
      ratingCount: 20,
      amenities: ['Iluminación'],
      images: [img('futbolin-1')],
    },
    {
      name: 'Power Kick',
      type: CourtType.football_5,
      description: 'Cancha de fútbol 5 con excelente grama.',
      pricePerHour: 50000,
      capacity: 10,
      rating: 4.8,
      ratingCount: 80,
      amenities: ['Iluminación LED', 'Parqueadero'],
      images: [img('powerkick-1')],
    },
    {
      name: 'sintética svp #1',
      type: CourtType.football_7,
      description: 'Cancha sintética de alta calidad.',
      pricePerHour: 45000,
      capacity: 14,
      rating: 4.7,
      ratingCount: 45,
      amenities: ['Iluminación'],
      images: [img('svp1-1')],
    },
  ]

  for (const c of courtsSeed) {
    await prisma.court.create({
      data: {
        businessId: business.id,
        name: c.name,
        type: c.type,
        description: c.description,
        pricePerHour: c.pricePerHour,
        capacity: c.capacity,
        status: CourtStatus.available,
        images: c.images,
        amenities: c.amenities,
        rating: c.rating,
        ratingCount: c.ratingCount,
        availability: weeklyAvailability(),
      },
    })
  }

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
  console.log(`  canchas:  ${courtsSeed.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
