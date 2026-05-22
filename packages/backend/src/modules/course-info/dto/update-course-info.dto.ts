import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseInfoDto } from './create-course-info.dto';

export class UpdateCourseInfoDto extends PartialType(CreateCourseInfoDto) {}
