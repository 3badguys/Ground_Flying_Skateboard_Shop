import { IsString, IsNotEmpty, MaxLength, Matches, IsDateString, IsOptional, IsInt, Min, ValidateIf } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  parentName?: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.phone !== undefined && o.phone !== null && o.phone !== '')
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsDateString()
  enrollmentDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tuition?: number;
}
