import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['admin', 'bussines', 'client'])
  role?: 'admin' | 'bussines' | 'client';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
