import { Injectable, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ASSOCIATION_REPOSITORY, IAssociationRepository } from '../../domain/repositories/association.repository.interface';
import { AssociationRole } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';

export interface UpdateAssociationCommand {
  associationId: string;
  userId: string;
  data: {
    name?: string;
    motto?: string;
    logoUrl?: string;
    legalStatus?: string;
    registrationRef?: string;
    plan?: any;
    currency?: any;
    country?: string;
    savingsInterestRate?: number;
    joiningFee?: number;
    alertThresholds?: any;
    branding?: any;
  };
}

@Injectable()
export class UpdateAssociationUseCase {
  constructor(
    @Inject(ASSOCIATION_REPOSITORY)
    private readonly associationRepository: IAssociationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateAssociationCommand) {
    const association = await this.associationRepository.findById(command.associationId);
    if (!association) {
      throw new NotFoundException('Association not found');
    }

    // Check user role in this association
    const member = await this.prisma.associationMember.findUnique({
      where: {
        associationId_userId: {
          associationId: command.associationId,
          userId: command.userId,
        },
      },
    });

    if (!member || member.role !== AssociationRole.PRESIDENT) {
      throw new UnauthorizedException('Only the president can update the association settings');
    }

    const updatedAssociation = await this.associationRepository.update(command.associationId, command.data);
    
    return updatedAssociation;
  }
}
