import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SoftwareService } from './software.service';
import { CreateSoftwareDto, UpdateSoftwareDto } from './dto/software.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('software')
export class SoftwareController {
  constructor(private software: SoftwareService) {}

  @Public()
  @Get()
  findActive() {
    return this.software.findActive();
  }

  @Get('admin')
  @Roles('admin')
  findAll() {
    return this.software.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.software.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateSoftwareDto) {
    return this.software.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateSoftwareDto) {
    return this.software.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.software.remove(id);
  }
}
