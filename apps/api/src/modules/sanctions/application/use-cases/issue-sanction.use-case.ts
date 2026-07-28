import { Inject, Injectable } from '@nestjs/common';
import { ISanctionRepository } from '../../domain/repositories/sanction.repository.interface';
import { Sanction } from '../../domain/entities/sanction.entity';
import { SanctionStatus, SanctionSeverity } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

export interface IssueSanctionCommand {
  associationId: string;
  memberId: string;
  title: string;
  reason?: string;
  fineAmount?: number;
  severity?: SanctionSeverity;
  issuedByUserId?: string;
}

@Injectable()
export class IssueSanctionUseCase {
  constructor(
    @Inject('ISanctionRepository') private readonly sanctionRepo: ISanctionRepository,
  ) {}

  async execute(command: IssueSanctionCommand): Promise<Sanction> {
    const assocId = await this.sanctionRepo.resolveAssociationId(command.associationId);
    if (!assocId) {
      throw new NotFoundException('Association', command.associationId);
    }

    const fineAmount = command.fineAmount || 0;
    const severity = command.severity || SanctionSeverity.MINOR;

    const sanction = Sanction.create({
      id: randomUUID(),
      associationId: assocId,
      memberId: command.memberId,
      title: command.title,
      reason: command.reason,
      fineAmount,
      status: fineAmount > 0 ? SanctionStatus.PENDING : SanctionStatus.EXCUSED,
      severity,
      issuedByUserId: command.issuedByUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.sanctionRepo.createSanction(sanction);
    return sanction;
  }
}
