import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AssociationRole } from '@prisma/client';

const ROLE_LABELS: Record<AssociationRole, string> = {
  PRESIDENT: 'Président',
  TREASURER: 'Trésorier',
  SECRETARY: 'Secrétaire',
  CENSOR: 'Censeur',
  MEMBER: 'Membre',
};

@Injectable()
export class AssociationRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Retrieve the required roles from the decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<AssociationRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Utilisateur non authentifié.');
    }

    // 2. Resolve the association ID from route params or header
    const associationId =
      request.params.associationId ||
      request.params.assocId ||
      request.headers['x-association-id'];

    // If no association context, deny unless no roles required
    if (!associationId) {
      if (!requiredRoles || requiredRoles.length === 0) return true;
      throw new ForbiddenException('Contexte d\'association requis pour cette action.');
    }

    // 3. Resolve the association (support slug or ID)
    const association = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
      select: { id: true },
    });

    if (!association) {
      // Let the controller handle the 404
      return true;
    }

    // 4. Find the membership of the calling user in this association
    const membership = await this.prisma.associationMember.findFirst({
      where: {
        associationId: association.id,
        userId: user.sub,
        status: 'ACTIVE',
      },
      select: { id: true, role: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Vous n\'êtes pas membre actif de cette association.',
      );
    }

    // Attach the membership to the request for downstream use in controllers/services
    request.membership = membership;
    request.resolvedAssociationId = association.id;

    // 5. If no specific roles required => all active members are allowed
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 6. PRESIDENT always has full access
    if (membership.role === 'PRESIDENT') {
      return true;
    }

    // 7. Check if the user's role is in the list of required roles
    if (requiredRoles.includes(membership.role as AssociationRole)) {
      return true;
    }

    const allowedLabels = requiredRoles.map((r) => ROLE_LABELS[r]).join(', ');
    throw new ForbiddenException(
      `Action réservée au(x) : ${allowedLabels}. Votre rôle actuel (${ROLE_LABELS[membership.role as AssociationRole] || membership.role}) ne vous y autorise pas.`,
    );
  }
}
