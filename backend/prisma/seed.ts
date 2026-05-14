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
      name: 'Cancha El Estadio',
      description:
        'Complejo deportivo con canchas sintéticas premium en Bogotá. Ambiente familiar, ' +
        'parqueadero amplio, bar-restaurante y zona de descanso para acompañantes.',
      phone: '+57 300 111 2233',
      email: 'contacto@elestadio.local',
      address: 'Calle 10 #20-30, Bogotá',
      latitude: 4.6097,
      longitude: -74.0817,
      images: [img('estadio-fachada'), img('estadio-zona'), img('estadio-bar'), img('estadio-vestidores')],
      amenities: [
        'WiFi',
        'Baños',
        'Parqueadero',
        'Bar',
        'Restaurante',
        'Iluminación nocturna',
        'Vestidores',
        'Duchas',
        'Seguridad',
        'Zona de descanso',
        'Graderías',
        'Cafetería',
      ],
      policies:
        'Llega 10 minutos antes de tu reserva. El pago se valida por transferencia. ' +
        'Cancelaciones con más de 2 horas de anticipación no tienen cargo.',
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

  // 6 canchas con datos reales: imágenes, comodidades y calificación.
  const courtsSeed = [
    {
      name: 'Camp Nou Synthetic Elite',
      type: CourtType.football_7,
      description: 'Cancha 7 vs 7 con grama sintética de última generación e iluminación LED profesional.',
      pricePerHour: 120000,
      capacity: 14,
      rating: 4.9,
      ratingCount: 128,
      amenities: ['Iluminación LED', 'Parqueadero', 'Vestidores', 'Cafetería'],
      images: [img('campnou-1'), img('campnou-2'), img('campnou-3')],
    },
    {
      name: 'Arena Sport Central',
      type: CourtType.futsal,
      description: 'Cancha de futsal techada, ideal para jugar sin importar el clima.',
      pricePerHour: 145000,
      capacity: 10,
      rating: 4.7,
      ratingCount: 96,
      amenities: ['Cancha cubierta', 'Iluminación LED', 'Vestidores', 'Hidratación'],
      images: [img('arena-1'), img('arena-2'), img('arena-3')],
    },
    {
      name: 'Parkview Premium F5',
      type: CourtType.football_5,
      description: 'Cancha 5 vs 5 al aire libre rodeada de zonas verdes. Perfecta para la tarde.',
      pricePerHour: 95000,
      capacity: 10,
      rating: 4.8,
      ratingCount: 74,
      amenities: ['Iluminación LED', 'Parqueadero', 'Hidratación'],
      images: [img('parkview-1'), img('parkview-2'), img('parkview-3')],
    },
    {
      name: 'The Stadium Complex',
      type: CourtType.football_11,
      description: 'Cancha 11 vs 11 reglamentaria con graderías y arbitraje incluido.',
      pricePerHour: 180000,
      capacity: 22,
      rating: 5.0,
      ratingCount: 152,
      amenities: ['Iluminación LED', 'Parqueadero', 'Vestidores', 'Cafetería', 'Arbitraje'],
      images: [img('stadium-1'), img('stadium-2'), img('stadium-3')],
    },
    {
      name: 'Urban Goal Rooftop',
      type: CourtType.football_5,
      description: 'Cancha 5 vs 5 en azotea con vista a la ciudad. Una experiencia diferente.',
      pricePerHour: 110000,
      capacity: 10,
      rating: 4.6,
      ratingCount: 58,
      amenities: ['Iluminación LED', 'Cafetería', 'Wi-Fi'],
      images: [img('rooftop-1'), img('rooftop-2'), img('rooftop-3')],
    },
    {
      name: 'Indoor Elite Hub',
      type: CourtType.futsal,
      description: 'Pabellón cubierto de futsal con piso profesional y climatización.',
      pricePerHour: 130000,
      capacity: 10,
      rating: 4.9,
      ratingCount: 110,
      amenities: ['Cancha cubierta', 'Iluminación LED', 'Vestidores', 'Parqueadero'],
      images: [img('indoor-1'), img('indoor-2'), img('indoor-3')],
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
