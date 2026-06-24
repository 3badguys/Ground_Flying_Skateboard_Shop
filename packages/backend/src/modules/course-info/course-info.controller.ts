import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CourseInfoService } from './course-info.service';
import { CreateCourseInfoDto } from './dto/create-course-info.dto';
import { UpdateCourseInfoDto } from './dto/update-course-info.dto';

@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller()
export class CourseInfoController {
  constructor(private readonly courseInfoService: CourseInfoService) {}

  @Get('students/:studentId/course-infos')
  findByStudentId(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.courseInfoService.findByStudentId(studentId);
  }

  @Post('students/:studentId/course-infos')
  create(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateCourseInfoDto,
  ) {
    return this.courseInfoService.create(studentId, dto);
  }

  @Put('course-infos/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseInfoDto,
  ) {
    return this.courseInfoService.update(id, dto);
  }

  @Delete('course-infos/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseInfoService.remove(id);
  }
}
