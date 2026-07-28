import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentController],
})
export class EquipmentModule {}
