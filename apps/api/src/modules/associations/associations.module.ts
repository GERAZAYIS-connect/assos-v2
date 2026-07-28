import { Module } from '@nestjs/common';
import { ASSOCIATION_REPOSITORY } from './domain/repositories/association.repository.interface';
import { CreateAssociationUseCase } from './application/use-cases/create-association.use-case';
import { UpdateAssociationUseCase } from './application/use-cases/update-association.use-case';
import { ExportAssociationDataUseCase } from './application/use-cases/export-association-data.use-case';
import { PrismaAssociationRepository } from './infrastructure/repositories/prisma-association.repository';
import { AssociationsController } from './interfaces/http/associations.controller';
import { SuperAdminController } from './interfaces/http/super-admin.controller';

@Module({
  controllers: [AssociationsController, SuperAdminController],
  providers: [
    CreateAssociationUseCase,
    UpdateAssociationUseCase,
    ExportAssociationDataUseCase,
    { provide: ASSOCIATION_REPOSITORY, useClass: PrismaAssociationRepository },
  ],
  exports: [ASSOCIATION_REPOSITORY],
})
export class AssociationsModule {}
