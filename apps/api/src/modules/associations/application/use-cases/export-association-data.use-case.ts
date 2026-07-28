import { Injectable, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ASSOCIATION_REPOSITORY, IAssociationRepository } from '../../domain/repositories/association.repository.interface';
import { AssociationRole } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';

export interface ExportAssociationDataCommand {
  associationId: string;
  userId: string;
}

@Injectable()
export class ExportAssociationDataUseCase {
  constructor(
    @Inject(ASSOCIATION_REPOSITORY)
    private readonly associationRepository: IAssociationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ExportAssociationDataCommand) {
    const association = await this.associationRepository.findById(command.associationId);
    if (!association) {
      throw new NotFoundException('Association not found');
    }

    // Check user role in this association (President or Admin-like roles)
    const member = await this.prisma.associationMember.findUnique({
      where: {
        associationId_userId: {
          associationId: command.associationId,
          userId: command.userId,
        },
      },
    });

    const allowedRoles: AssociationRole[] = [AssociationRole.PRESIDENT, AssociationRole.SECRETARY, AssociationRole.TREASURER];
    if (!member || !allowedRoles.includes(member.role)) {
      throw new UnauthorizedException('You do not have permission to export association data');
    }

    // Export all relevant data (members, config, etc.)
    const fullAssociationData = await this.prisma.association.findUnique({
      where: { id: command.associationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                createdAt: true,
              }
            },
            profile: true,
            certificates: true,
          }
        },
        auditLogs: true,
      }
    });

    return {
      exportedAt: new Date().toISOString(),
      requestedBy: command.userId,
      data: fullAssociationData,
    };
  }
}
