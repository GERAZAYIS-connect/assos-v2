import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { SimulateSavingsInterestUseCase } from './simulate-savings-interest.use-case';
import { DepositSavingsUseCase } from './deposit-savings.use-case';

@Injectable()
export class ApplySavingsInterestUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly simulateSavingsInterestUseCase: SimulateSavingsInterestUseCase,
    private readonly depositSavingsUseCase: DepositSavingsUseCase,
  ) {}

  async execute(associationId: string, actorUserId: string) {
    const simulation = await this.simulateSavingsInterestUseCase.execute(associationId);

    if (simulation.items.length === 0 || simulation.totalInterestToDistribute <= 0) {
      throw new BadRequestException('Aucun intérêt à distribuer.');
    }

    const appliedTransactions = [];

    for (const item of simulation.items) {
      if (item.calculatedInterest > 0) {
        const result = await this.depositSavingsUseCase.execute({
          associationId: simulation.associationId,
          caisseId: item.caisseId,
          memberId: item.memberId,
          amount: item.calculatedInterest,
          description: `Distribution annuelle des intérêts d'épargne (${item.interestRate}%)`,
          actorUserId,
        });
        appliedTransactions.push(result);
      }
    }

    return {
      success: true,
      associationId: simulation.associationId,
      totalDistributed: simulation.totalInterestToDistribute,
      appliedCount: appliedTransactions.length,
    };
  }
}
