import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /** Create a new dump and return its metadata (frontend triggers download). */
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post()
  create() {
    return this.backupService.create();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get('list')
  list() {
    return this.backupService.list();
  }

  /** Stream a .sql file. Uses @Res() so the global JSON interceptor is bypassed. */
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get('download/:name')
  async download(@Param('name') name: string, @Res() res: Response) {
    const file = await this.backupService.download(name);
    res.download(file, name);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(':name')
  remove(@Param('name') name: string) {
    return this.backupService.remove(name);
  }

  /** Upload a .sql dump and restore it (single-transaction, auto-rollback). */
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post('restore')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }),
  )
  restore(
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
  ) {
    if (!file) throw new BadRequestException('请选择 .sql 文件');
    return this.backupService.restore(file.buffer, file.originalname);
  }
}
