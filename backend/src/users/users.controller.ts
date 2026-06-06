import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.users.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    if (user.role !== 'admin' && user.sub !== id) {
      return this.users.findOne(user.sub);
    }
    return this.users.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtUser) {
    if (user.role !== 'admin' && user.sub !== id) {
      delete dto.role;
      delete dto.isActive;
    }
    return this.users.update(id, dto);
  }

  @Patch(':id/avatar')
  updateAvatar(
    @Param('id') id: string,
    @Body() body: { avatarUrl: string },
    @CurrentUser() user: JwtUser,
  ) {
    const targetId = user.role !== 'admin' && user.sub !== id ? user.sub : id;
    return this.users.update(targetId, { avatarUrl: body.avatarUrl });
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.users.deactivate(id);
  }
}
