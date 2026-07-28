import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  INotificationRepository,
  CreateNotificationInput,
} from '../../domain/repositories/notification.repository.interface';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveAssociationId(associationIdOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: associationIdOrSlug }, { slug: associationIdOrSlug }],
      },
      select: { id: true },
    });
    return assoc ? assoc.id : null;
  }

  async createNotification(input: CreateNotificationInput): Promise<any> {
    const assocId = await this.resolveAssociationId(input.associationId);
    if (!assocId) throw new BadRequestException('Association introuvable.');

    return this.prisma.notification.create({
      data: {
        associationId: assocId,
        userId: input.userId,
        type: input.type,
        channel: input.channel || NotificationChannel.IN_APP,
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl,
      },
    });
  }

  async getNotificationsForUser(userId: string, associationId?: string): Promise<{
    unreadCount: number;
    notifications: any[];
  }> {
    const where: any = { userId };
    if (associationId) {
      const assocId = await this.resolveAssociationId(associationId);
      if (assocId) where.associationId = assocId;
    }

    const unreadCount = await this.prisma.notification.count({
      where: {
        ...where,
        status: NotificationStatus.UNREAD,
      },
    });

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 50,
    });

    return { unreadCount, notifications };
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Notification non trouvée.');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string, associationId?: string): Promise<any> {
    const where: any = { userId, status: NotificationStatus.UNREAD };
    if (associationId) {
      const assocId = await this.resolveAssociationId(associationId);
      if (assocId) where.associationId = assocId;
    }

    return this.prisma.notification.updateMany({
      where,
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  async triggerAutomatedReminders(associationId: string): Promise<{
    tontineRemindersCount: number;
    loanRemindersCount: number;
    meetingRemindersCount: number;
  }> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) throw new BadRequestException('Association introuvable.');

    let tontineRemindersCount = 0;
    let loanRemindersCount = 0;
    let meetingRemindersCount = 0;

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Tontine Reminders: Active tontines
    const activeTontines = await this.prisma.tontine.findMany({
      where: { associationId: assocId, status: 'ACTIVE' },
      include: {
        rounds: {
          include: {
            beneficiary: { select: { userId: true, profile: { select: { firstName: true, lastName: true } } } },
          },
        },
        members: {
          include: { member: { select: { userId: true } } },
        },
      },
    });

    for (const tontine of activeTontines) {
      for (const m of tontine.members) {
        if (m.member?.userId) {
          await this.prisma.notification.create({
            data: {
              associationId: assocId,
              userId: m.member.userId,
              type: NotificationType.TONTINE_REMINDER,
              channel: NotificationChannel.IN_APP,
              title: `Rappel Cotisation Tontine : ${tontine.name}`,
              message: `La prochaine séance de cotisation pour la tontine "${tontine.name}" est imminente. N'oubliez pas votre versement.`,
              linkUrl: `/${assocId}/tontines/${tontine.id}`,
            },
          });
          tontineRemindersCount++;
        }
      }
    }

    // 2. Loan Reminders: Active loans with balanceRemaining > 0
    const activeLoans = await this.prisma.loan.findMany({
      where: {
        associationId: assocId,
        status: { in: ['DISBURSED', 'APPROVED'] as any },
        balanceRemaining: { gt: 0 },
      },
      include: {
        borrower: { select: { userId: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    });

    for (const loan of activeLoans) {
      const borrowerUser = (loan as any).borrower;
      if (borrowerUser?.userId) {
        const isOverdue = loan.dueDate && loan.dueDate < now;
        const title = isOverdue
          ? `⚠️ Relance Amiable de Prêt Échu`
          : `Rappel d'Échéance de Prêt`;
        const message = isOverdue
          ? `Votre prêt de ${loan.amount.toLocaleString('fr-FR')} FCFA accuse un solde restant de ${loan.balanceRemaining.toLocaleString('fr-FR')} FCFA. Merci de régulariser votre situation auprès du Trésorier.`
          : `Rappel : L'échéance de remboursement pour votre prêt approche. Solde restant : ${loan.balanceRemaining.toLocaleString('fr-FR')} FCFA.`;

        await this.prisma.notification.create({
          data: {
            associationId: assocId,
            userId: borrowerUser.userId,
            type: NotificationType.LOAN_REPAYMENT_DUE,
            channel: NotificationChannel.IN_APP,
            title,
            message,
            linkUrl: `/${assocId}/loans/${loan.id}`,
          },
        });
        loanRemindersCount++;
      }
    }

    // 3. Meeting Convocations (Upcoming meetings within 3 days)
    const upcomingMeetings = await this.prisma.meeting.findMany({
      where: {
        associationId: assocId,
        scheduledAt: { gte: now, lte: threeDaysLater },
      },
    });

    const assocMembers = await this.prisma.associationMember.findMany({
      where: { associationId: assocId, status: 'ACTIVE' },
      select: { userId: true },
    });

    for (const meeting of upcomingMeetings) {
      for (const m of assocMembers) {
        if (m.userId) {
          await this.prisma.notification.create({
            data: {
              associationId: assocId,
              userId: m.userId,
              type: NotificationType.MEETING_CONVOCATION,
              channel: NotificationChannel.IN_APP,
              title: `Convocation Réunion / Assemblée : ${meeting.title}`,
              message: `Vous êtes convoqué à la réunion "${meeting.title}" prévue le ${new Date(meeting.scheduledAt).toLocaleDateString('fr-FR')}.`,
              linkUrl: `/${assocId}/meetings/${meeting.id}`,
            },
          });
          meetingRemindersCount++;
        }
      }
    }

    return {
      tontineRemindersCount,
      loanRemindersCount,
      meetingRemindersCount,
    };
  }
}
