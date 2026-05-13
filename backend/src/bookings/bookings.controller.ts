import {
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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BookingsService } from './bookings.service';
import { AvailableSlotsQueryDto, CreateBookingDto, RejectBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.bookings.findAll();
  }

  @Get('my-bookings')
  myBookings(@CurrentUser() user: JwtUser) {
    return this.bookings.findMine(user.sub);
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
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: JwtUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.bookings.create(dto, user.sub, file?.filename);
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
