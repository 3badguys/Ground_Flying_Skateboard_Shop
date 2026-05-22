import { IsInt, Min, IsDateString } from 'class-validator';

export class CreateCourseInfoDto {
  @IsInt()
  @Min(1)
  hours: number;

  @IsInt()
  @Min(0)
  tuition: number;

  @IsDateString()
  enrollmentDate: string;
}
