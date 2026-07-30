import { Module, Global } from '@nestjs/common';
import { AssociationRoleGuard } from '../guards/association-role.guard';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * Module global qui expose les guards partagés entre tous les modules.
 * Marqué @Global() pour éviter d'importer ce module partout.
 */
@Global()
@Module({
  providers: [AssociationRoleGuard, PrismaService],
  exports: [AssociationRoleGuard, PrismaService],
})
export class SharedModule {}
