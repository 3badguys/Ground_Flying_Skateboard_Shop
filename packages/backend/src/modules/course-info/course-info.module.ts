import { Module } from '@nestjs/common';
import { CourseInfoController } from './course-info.controller';
import { CourseInfoService } from './course-info.service';

@Module({
  controllers: [CourseInfoController],
  providers: [CourseInfoService],
})
export class CourseInfoModule {}
