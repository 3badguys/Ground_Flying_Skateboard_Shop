import { Controller, Get, Post, Body } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingService } from './booking.service';
import { BookingDto } from './dto/booking.dto';

@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('eligible-students')
  getEligibleStudents(@CurrentUser() user: { id: number; role: Role; phone: string | null }) {
    return this.bookingService.getEligibleStudents(user);
  }

  @Post()
  book(@Body() dto: BookingDto, @CurrentUser() user: { id: number; role: Role; phone: string | null }) {
    return this.bookingService.book(dto, user);
  }
}
