import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CreateCourtDto, ReplaceAvailabilityDto, UpdateCourtDto } from './dto/court.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courts')
export class CourtsController {
  constructor(private courts: CourtsService) {}

  @Public()
  @Get()
  findAll() {
    return this.courts.findAll();
  }

  @Get('by-business/:businessId')
  findByBusiness(@Param('businessId') businessId: string) {
    return this.courts.findByBusiness(businessId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courts.findOne(id);
  }

  @Post()
  @Roles('admin', 'bussines')
  create(@Body() dto: CreateCourtDto, @CurrentUser() user: JwtUser) {
    return this.courts.create(dto, user);
  }

  @Patch(':id')
  @Roles('admin', 'bussines')
  update(@Param('id') id: string, @Body() dto: UpdateCourtDto, @CurrentUser() user: JwtUser) {
    return this.courts.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('admin', 'bussines')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.courts.remove(id, user);
  }

  @Public()
  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.courts.getAvailability(id);
  }

  @Post(':id/availability')
  @Roles('admin', 'bussines')
  replaceAvailability(
    @Param('id') id: string,
    @Body() dto: ReplaceAvailabilityDto,
    @CurrentUser() user: JwtUser
  ) {
    return this.courts.replaceAvailability(id, dto, user);
  }
}
