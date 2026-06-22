import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('monthly-income')
  monthlyIncome(@Query('year') year?: number) {
    return this.statisticsService.monthlyIncome(year || new Date().getFullYear());
  }

  @Get('grade-distribution')
  gradeDistribution() {
    return this.statisticsService.gradeDistribution();
  }

  @Get('monthly-hours')
  monthlyHours(@Query('year') year?: number) {
    return this.statisticsService.monthlyHours(year || new Date().getFullYear());
  }

  @Get('student-rankings')
  studentRankings(@Query('type') type?: string) {
    return this.statisticsService.studentRankings(type || 'remaining');
  }

  @Get('monthly-enrollment')
  monthlyEnrollment(@Query('year') year?: number) {
    return this.statisticsService.monthlyEnrollment(year || new Date().getFullYear());
  }

  @Get('annual-summary')
  annualSummary(@Query('year') year?: number) {
    return this.statisticsService.annualSummary(year || new Date().getFullYear());
  }
}
