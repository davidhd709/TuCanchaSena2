import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BookingsService } from './bookings.service';
import { AvailableSlotsQueryDto, CreateBookingDto, RejectBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from '../uploads/storage.driver';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Get()
  @Roles('admin')
  findAll(@Query() pagination: PaginationDto) {
    return this.bookings.findAll(pagination);
  }

  @Get('my-bookings')
  myBookings(@CurrentUser() user: JwtUser, @Query() pagination: PaginationDto) {
    return this.bookings.findMine(user.sub, pagination);
  }

  @Get('business/:businessId')
  @Roles('admin', 'bussines')
  byBusiness(@Param('businessId') businessId: string, @CurrentUser() user: JwtUser) {
    return this.bookings.findByBusiness(businessId, user);
  }

  @Get('court/:courtId/available-slots')
  availableSlots(@Param('courtId') courtId: string, @Query() q: AvailableSlotsQueryDto) {
    return this.bookings.availableSlots(courtId, q.date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookings.findOne(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('paymentProof', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!(ALLOWED_UPLOAD_MIME as readonly string[]).includes(file.mimetype)) {
          return cb(
            new BadRequestException('El comprobante debe ser PNG, JPG o PDF'),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: JwtUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const upload = file ? { buffer: file.buffer, mimetype: file.mimetype } : undefined;
    return this.bookings.create(dto, user.sub, upload);
  }

  @Post(':id/confirm')
  @Roles('admin', 'bussines')
  confirm(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.bookings.confirm(id, user);
  }

  @Post(':id/reject')
  @Roles('admin', 'bussines')
  reject(@Param('id') id: string, @Body() dto: RejectBookingDto, @CurrentUser() user: JwtUser) {
    return this.bookings.reject(id, dto, user);
  }

  @Post(':id/complete')
  @Roles('admin', 'bussines')
  complete(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.bookings.complete(id, user);
  }

  @Post(':id/no-show')
  @Roles('admin', 'bussines')
  noShow(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.bookings.noShow(id, user);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.bookings.cancel(id, user);
  }
}
