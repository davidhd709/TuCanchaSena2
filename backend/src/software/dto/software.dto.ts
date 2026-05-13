import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateSoftwareDto {
  @IsString() nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  status?: 'activo' | 'inactivo';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];
}

export class UpdateSoftwareDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsIn(['activo', 'inactivo']) status?: 'activo' | 'inactivo';
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) imagenes?: string[];
}
