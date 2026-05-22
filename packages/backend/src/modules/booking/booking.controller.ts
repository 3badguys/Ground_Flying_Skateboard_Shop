import { Controller, Get, Post, Body } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingDto } from './dto/booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('eligible-students')
  getEligibleStudents() {
    return this.bookingService.getEligibleStudents();
  }

  @Post()
  book(@Body() dto: BookingDto) {
    return this.bookingService.book(dto);
  }
}
