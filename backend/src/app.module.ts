import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { CourtsModule } from './courts/courts.module';
import { BookingsModule } from './bookings/bookings.module';
import { SoftwareModule } from './software/software.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    UploadsModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    CourtsModule,
    BookingsModule,
    SoftwareModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
