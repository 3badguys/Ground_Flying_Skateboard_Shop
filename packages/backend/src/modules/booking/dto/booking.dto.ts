import { IsInt, Min, IsDateString, IsOptional, IsString } from 'class-validator';

export class BookingDto {
  @IsInt()
  @Min(1)
  studentId: number;

  @IsDateString()
  classDate: string;

  @IsInt()
  @Min(1)
  hours: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;
}
