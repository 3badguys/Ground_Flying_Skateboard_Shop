import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ClassRecordService } from './class-record.service';
import { CreateClassRecordDto } from './dto/create-class-record.dto';
import { UpdateClassRecordDto } from './dto/update-class-record.dto';

@Controller()
export class ClassRecordController {
  constructor(private readonly classRecordService: ClassRecordService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Get('students/:studentId/class-records')
  findByStudentId(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: { id: number; role: Role; phone: string | null },
  ) {
    return this.classRecordService.findByStudentId(studentId, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post('students/:studentId/class-records')
  create(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateClassRecordDto,
  ) {
    return this.classRecordService.create(studentId, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Put('class-records/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassRecordDto,
  ) {
    return this.classRecordService.update(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete('class-records/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.classRecordService.remove(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Get('class-records/calendar')
  calendar(
    @Query('month') month: string,
    @CurrentUser() user: { id: number; role: Role; phone: string | null },
  ) {
    return this.classRecordService.calendar(month, user);
  }
}
