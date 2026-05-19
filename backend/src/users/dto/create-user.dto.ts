import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * DTO admin-only para crear usuarios con rol explícito.
 * Llamado por `POST /users` (Roles=admin). El registro público
 * (`POST /auth/register`) NO acepta `role` y siempre crea `client`.
 */
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsIn(['admin', 'business', 'client'])
  role: 'admin' | 'business' | 'client';
}
