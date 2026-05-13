import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  courtId: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectBookingDto {
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class AvailableSlotsQueryDto {
  @IsDateString()
  date: string;
}
