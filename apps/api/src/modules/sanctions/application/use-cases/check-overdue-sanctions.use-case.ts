import { Injectable, Inject, Logger } from '@nestjs/common';
import { ISanctionRepository } from '../../domain/repositories/sanction.repository.interface';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { SanctionStatus, MemberStatus } from '@prisma/client';

export interface CheckOverdueSanctionsCommand {
  thresholdDays?: number; // Default could be 30 days
}

@Injectable()
export class CheckOverdueSanctionsUseCase {
  private readonly logger = new Logger(CheckOverdueSanctionsUseCase.name);

  constructor(
    @Inject('ISanctionRepository') private readonly sanctionRepo: ISanctionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command?: CheckOverdueSanctionsCommand): Promise<{ suspendedMembersCount: number }> {
    const thresholdDays = command?.thresholdDays || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    const pendingSanctions = await this.sanctionRepo.listAllByStatus(SanctionStatus.PENDING);
    const memberIdsToSuspend = new Set<string>();

    for (const sanction of pendingSanctions) {
      if (sanction.createdAt < thresholdDate) {
        memberIdsToSuspend.add(sanction.memberId);
      }
    }

    let suspendedMembersCount = 0;

    if (memberIdsToSuspend.size > 0) {
      const memberIdsArray = Array.from(memberIdsToSuspend);
      
      const updateResult = await this.prisma.associationMember.updateMany({
        where: {
          id: { in: memberIdsArray },
          status: MemberStatus.ACTIVE,
        },
        data: {
          status: MemberStatus.SUSPENDED,
          suspendedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      suspendedMembersCount = updateResult.count;
      this.logger.log(`Suspended ${suspendedMembersCount} members due to overdue sanctions.`);
    } else {
      this.logger.log(`No members to suspend due to overdue sanctions.`);
    }

    return { suspendedMembersCount };
  }
}
