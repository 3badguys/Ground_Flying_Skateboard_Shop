import { Controller, Get, Put, Body } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Put()
  set(@Body() body: { key: string; value: string }) {
    return this.settingsService.set(body.key, body.value);
  }
}
