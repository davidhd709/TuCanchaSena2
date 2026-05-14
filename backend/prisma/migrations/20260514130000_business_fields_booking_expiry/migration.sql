-- Enum CourtStatus: nuevo valor "maintenance"
ALTER TYPE "CourtStatus" ADD VALUE IF NOT EXISTS 'maintenance';

-- Enum BookingStatus: nuevos valores "rejected" y "expired"
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'expired';

-- Business: fotos, servicios/comodidades y políticas
ALTER TABLE "Business"
  ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "policies" TEXT;

-- Booking: bloqueo temporal de 30 minutos
ALTER TABLE "Booking" ADD COLUMN "expiresAt" TIMESTAMP(3);
