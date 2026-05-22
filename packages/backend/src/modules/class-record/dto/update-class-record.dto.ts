import { PartialType } from '@nestjs/mapped-types';
import { CreateClassRecordDto } from './create-class-record.dto';

export class UpdateClassRecordDto extends PartialType(CreateClassRecordDto) {}
