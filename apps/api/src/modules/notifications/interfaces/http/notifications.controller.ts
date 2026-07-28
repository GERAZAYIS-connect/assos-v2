import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '../../domain/repositories/notification.repository.interface';

@ApiTags('Notifications')
@Controller()
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  @Get('notifications/mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications and unread count' })
  async getMyNotifications(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié.');

    return this.notificationRepository.getNotificationsForUser(userId, associationId);
  }

  @Patch('notifications/:id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié.');

    return this.notificationRepository.markAsRead(id, userId);
  }

  @Patch('notifications/read-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @Request() req: any,
    @Query('associationId') associationId?: string,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non authentifié.');

    return this.notificationRepository.markAllAsRead(userId, associationId);
  }

  @Post('associations/:associationId/notifications/trigger-reminders')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger multi-channel automated reminders' })
  async triggerReminders(@Param('associationId') associationId: string) {
    return this.notificationRepository.triggerAutomatedReminders(associationId);
  }
}
