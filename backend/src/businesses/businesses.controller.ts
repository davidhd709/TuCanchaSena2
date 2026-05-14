import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private businesses: BusinessesService) {}

  @Get()
  @Roles('admin')
  findAll(@Query() pagination: PaginationDto) {
    return this.businesses.findAll(pagination);
  }

  @Get('my-businesses')
  @Roles('business', 'admin')
  myBusinesses(@CurrentUser() user: JwtUser) {
    return this.businesses.findByOwner(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businesses.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateBusinessDto) {
    return this.businesses.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'business')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto, @CurrentUser() user: JwtUser) {
    return this.businesses.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('admin', 'business')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.businesses.remove(id, user);
  }
}
