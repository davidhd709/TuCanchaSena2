import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * DTO de registro público. NO acepta `role`: cualquier registro por esta vía
 * crea un usuario `client`. La creación con rol arbitrario (admin/business)
 * se hace por el endpoint admin-only `POST /users`.
 */
export class RegisterDto {
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
}
