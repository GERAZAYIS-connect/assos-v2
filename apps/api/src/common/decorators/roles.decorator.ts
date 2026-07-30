import { SetMetadata } from '@nestjs/common';
import { AssociationRole } from '@prisma/client';

export const ROLES_KEY = 'association_roles';

/**
 * Décorateur pour définir les rôles d'association autorisés sur un endpoint.
 * Usage : @Roles('PRESIDENT', 'TREASURER')
 * Laisser vide pour autoriser tous les membres actifs : @Roles()
 */
export const Roles = (...roles: AssociationRole[]) => SetMetadata(ROLES_KEY, roles);
