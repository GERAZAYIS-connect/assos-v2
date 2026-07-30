import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * S'exécute tous les jours à minuit pour vérifier les périodes d'essai expirées.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredTrials() {
    this.logger.log('Démarrage du job CRON de vérification des abonnements...');

    try {
      const now = new Date();

      // Mettre à jour toutes les associations dont l'essai est terminé
      const result = await this.prisma.association.updateMany({
        where: {
          subscriptionStatus: SubscriptionStatus.TRIALING,
          trialEndsAt: {
            lt: now, // La date de fin d'essai est dans le passé
          },
        },
        data: {
          subscriptionStatus: SubscriptionStatus.PAST_DUE,
        },
      });

      if (result.count > 0) {
        this.logger.log(`Statut d'abonnement mis à jour (PAST_DUE) pour ${result.count} association(s).`);
      } else {
        this.logger.debug('Aucune association expirée trouvée aujourd\'hui.');
      }
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour des abonnements expirés', error);
    }
  }
}
