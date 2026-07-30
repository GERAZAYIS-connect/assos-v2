import { Module } from '@nestjs/common';
import { AdminController } from './interfaces/http/admin.controller';
import { AdminService } from './application/services/admin.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
