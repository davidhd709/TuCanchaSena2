-- AlterTable: campos para imágenes, comodidades y rating de canchas
ALTER TABLE "Court"
  ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "rating" DOUBLE PRECISION,
  ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;
