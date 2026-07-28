import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IGovernanceRepository } from '../../domain/repositories/governance.repository.interface';
import { Resolution } from '../../domain/entities/resolution.entity';
import { ResolutionCategory, ResolutionStatus, VoteType, AssociationRole } from '@prisma/client';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import * as crypto from 'crypto';

export interface CreateResolutionCommand {
  associationId: string;
  meetingId?: string;
  title: string;
  description?: string;
  category?: ResolutionCategory;
  voteType?: VoteType;
  quorumThreshold?: number;
  majorityThreshold?: number;
  targetRole?: AssociationRole;
  candidateMemberId?: string;
}

@Injectable()
export class CreateResolutionUseCase {
  constructor(
    @Inject('IGovernanceRepository')
    private readonly governanceRepo: IGovernanceRepository,
  ) {}

  async execute(command: CreateResolutionCommand): Promise<Resolution> {
    const assocId = await this.governanceRepo.resolveAssociationId(command.associationId);
    if (!assocId) {
      throw new NotFoundException('Association', command.associationId);
    }

    if (!command.title || command.title.trim().length === 0) {
      throw new BadRequestException('Le titre de la résolution est obligatoire.');
    }

    if (command.category === ResolutionCategory.BUREAU_ELECTION) {
      if (!command.targetRole) {
        throw new BadRequestException('Le poste du bureau (Rôle) est obligatoire pour une élection.');
      }
      if (!command.candidateMemberId) {
        throw new BadRequestException('Le membre candidat est obligatoire pour une élection.');
      }
    }

    const resolution = new Resolution({
      id: crypto.randomUUID(),
      associationId: assocId,
      meetingId: command.meetingId || null,
      title: command.title,
      description: command.description || null,
      category: command.category || ResolutionCategory.GENERAL_PROPOSAL,
      status: ResolutionStatus.OPEN,
      voteType: command.voteType || VoteType.OPEN_VOTE,
      quorumThreshold: command.quorumThreshold || 50,
      majorityThreshold: command.majorityThreshold || 50,
      targetRole: command.targetRole || null,
      candidateMemberId: command.candidateMemberId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.governanceRepo.createResolution(resolution);
  }
}
