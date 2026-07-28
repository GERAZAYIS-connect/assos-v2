import { Module } from '@nestjs/common';
import { NotificationsController } from './interfaces/http/notifications.controller';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
