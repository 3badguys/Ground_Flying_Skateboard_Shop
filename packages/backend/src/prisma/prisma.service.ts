import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { seedSuperAdmin } from './seed-super-admin';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await seedSuperAdmin(this, this.logger);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
