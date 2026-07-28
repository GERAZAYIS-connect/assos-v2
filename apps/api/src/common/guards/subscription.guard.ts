import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extrait l'associationId depuis les paramètres de la route (ex: /api/associations/:associationId/...)
    const associationId =
      request.params.associationId ||
      request.params.assocId ||
      request.headers['x-association-id'];

    // Si la route n'est pas liée à une association spécifique, laisser passer
    if (!associationId) {
      return true;
    }

    const association = await this.prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      },
    });

    if (!association) {
      return true; // Laisser la gestion 404 au controller/service
    }

    const now = new Date();

    // 1. Cas d'une association en période d'essai (TRIALING / DISCOVERY)
    if (association.subscriptionStatus === 'TRIALING' || association.plan === 'DISCOVERY') {
      if (association.trialEndsAt && now > new Date(association.trialEndsAt)) {
        // Mettre à jour le statut en PAST_DUE / EXPIRED automatiquement
        await this.prisma.association.update({
          where: { id: association.id },
          data: { subscriptionStatus: 'PAST_DUE' },
        });

        // Les requêtes en lecture (GET) restent autorisées, mais la création/modification (POST, PUT, DELETE, PATCH) est bloquée
        if (request.method !== 'GET') {
          throw new ForbiddenException(
            `La période d'essai de 30 jours pour l'association "${association.name}" a expiré. Veuillez souscrire à un abonnement pour continuer à effectuer des opérations.`,
          );
        }
      }
    }

    // 2. Cas d'une association avec abonnement payant expiré
    if (association.subscriptionStatus === 'PAST_DUE' || association.subscriptionStatus === 'CANCELED') {
      if (association.subscriptionEndsAt && now > new Date(association.subscriptionEndsAt)) {
        if (request.method !== 'GET') {
          throw new ForbiddenException(
            `L'abonnement de l'association "${association.name}" a expiré. Veuillez renouveler votre formule.`,
          );
        }
      }
    }

    return true;
  }
}
