import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DAYS } from '../../businesses/dto/business.dto';

export const COURT_TYPES = [
  'football_5',
  'football_7',
  'football_8',
  'football_11',
  'futsal',
  'beach_soccer',
  'mini_football',
] as const;

export const COURT_STATUS = ['available', 'unavailable'] as const;

export class CreateCourtDto {
  @IsString() businessId: string;
  @IsString() name: string;
  @IsIn(COURT_TYPES) type: (typeof COURT_TYPES)[number];
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Type(() => Number) @Min(0) pricePerHour: number;
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) capacity?: number;
  @IsOptional() @IsIn(COURT_STATUS) status?: (typeof COURT_STATUS)[number];
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsNumber() @Type(() => Number) @Min(0) @Max(5) rating?: number;
}

export class UpdateCourtDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(COURT_TYPES) type?: (typeof COURT_TYPES)[number];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Type(() => Number) @Min(0) pricePerHour?: number;
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) capacity?: number;
  @IsOptional() @IsIn(COURT_STATUS) status?: (typeof COURT_STATUS)[number];
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsNumber() @Type(() => Number) @Min(0) @Max(5) rating?: number;
}

export class AvailabilitySlotDto {
  @IsIn(DAYS) dayOfWeek: (typeof DAYS)[number];

  @IsString() @Matches(/^\d{2}:\d{2}$/) startTime: string;
  @IsString() @Matches(/^\d{2}:\d{2}$/) endTime: string;

  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsNumber() @Type(() => Number) @Min(0) pricePerHour?: number;
}

export class ReplaceAvailabilityDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability: AvailabilitySlotDto[];
}
