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

  @Get('students/:studentId/class-records')
  findByStudentId(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.classRecordService.findByStudentId(studentId);
  }

  @Post('students/:studentId/class-records')
  create(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateClassRecordDto,
  ) {
    return this.classRecordService.create(studentId, dto);
  }

  @Put('class-records/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassRecordDto,
  ) {
    return this.classRecordService.update(id, dto);
  }

  @Delete('class-records/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.classRecordService.remove(id);
  }

  @Get('class-records/calendar')
  calendar(@Query('month') month: string) {
    return this.classRecordService.calendar(month);
  }
}
