import { Module } from '@nestjs/common';
import { ClassRecordController } from './class-record.controller';
import { ClassRecordService } from './class-record.service';

@Module({
  controllers: [ClassRecordController],
  providers: [ClassRecordService],
  exports: [ClassRecordService],
})
export class ClassRecordModule {}
