import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StudentModule } from './modules/student/student.module';
import { CourseInfoModule } from './modules/course-info/course-info.module';
import { ClassRecordModule } from './modules/class-record/class-record.module';
import { BookingModule } from './modules/booking/booking.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [
    PrismaModule,
    StudentModule,
    CourseInfoModule,
    ClassRecordModule,
    BookingModule,
    SettingsModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
