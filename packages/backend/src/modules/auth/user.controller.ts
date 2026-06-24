import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Role } from './roles';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  listUsers(@CurrentUser('id') userId: number) {
    return this.authService.listUsers(userId);
  }

  @Post()
  createUser(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateUserDto,
  ) {
    return this.authService.createUser(userId, dto);
  }

  @Put(':id')
  updateUser(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateUser(userId, id, dto);
  }

  @Delete(':id')
  deleteUser(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.authService.deleteUser(userId, id);
  }

  @Get(':id/students')
  getUserStudents(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.authService.getUserStudents(userId, id);
  }

  @Get(':id/password')
  getUserPassword(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.authService.getUserPassword(userId, id);
  }
}
