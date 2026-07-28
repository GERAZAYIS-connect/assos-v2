import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';

export interface InterestSimulationItem {
  memberId: string;
  memberName: string;
  caisseId: string;
  caisseName: string;
  currentBalance: number;
  interestRate: number;
  calculatedInterest: number;
  newEstimatedBalance: number;
}

export interface InterestSimulationResult {
  associationId: string;
  savingsInterestRate: number;
  totalMembersBenefiting: number;
  totalInterestToDistribute: number;
  items: InterestSimulationItem[];
}

@Injectable()
export class SimulateSavingsInterestUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(associationId: string): Promise<InterestSimulationResult> {
    const assoc = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
    });

    if (!assoc) throw new NotFoundException('Association introuvable.');

    const interestRate = assoc.savingsInterestRate || 0;

    // Find all savings caisses
    const savingsCaisses = await this.prisma.caisse.findMany({
      where: {
        associationId: assoc.id,
        type: {
          in: ['INDIVIDUAL_SAVINGS', 'COLLECTIVE_SAVINGS', 'THEMATIC_SAVINGS', 'SCHOOL_BANK'],
        },
        isActive: true,
      },
    });

    const caisseIds = savingsCaisses.map((c) => c.id);

    // Get all deposit & withdrawal transactions grouped by member and caisse
    const transactions = await this.prisma.transaction.findMany({
      where: {
        associationId: assoc.id,
        caisseId: { in: caisseIds },
        status: 'CONFIRMED',
        memberId: { not: null },
      },
      include: {
        member: {
          include: {
            user: true,
            profile: true,
          },
        },
        caisse: true,
      },
    });

    // Calculate balances per member per caisse
    const balanceMap = new Map<string, { member: any; caisse: any; balance: number }>();

    for (const tx of transactions) {
      if (!tx.memberId || !tx.member) continue;
      const key = `${tx.memberId}_${tx.caisseId}`;
      const existing = balanceMap.get(key) || {
        member: tx.member,
        caisse: tx.caisse,
        balance: 0,
      };

      if (tx.type === 'DEPOSIT') {
        existing.balance += tx.amount;
      } else if (tx.type === 'WITHDRAWAL') {
        existing.balance -= tx.amount;
      }
      balanceMap.set(key, existing);
    }

    const items: InterestSimulationItem[] = [];
    let totalInterest = 0;

    balanceMap.forEach((data) => {
      if (data.balance > 0) {
        const calculatedInterest = Math.round((data.balance * (interestRate / 100)) * 100) / 100;
        const firstName = data.member.profile?.firstName || '';
        const lastName = data.member.profile?.lastName || data.member.user?.email || 'Membre';
        const memberName = `${firstName} ${lastName}`.trim();

        items.push({
          memberId: data.member.id,
          memberName,
          caisseId: data.caisse.id,
          caisseName: data.caisse.name,
          currentBalance: data.balance,
          interestRate,
          calculatedInterest,
          newEstimatedBalance: data.balance + calculatedInterest,
        });

        totalInterest += calculatedInterest;
      }
    });

    return {
      associationId: assoc.id,
      savingsInterestRate: interestRate,
      totalMembersBenefiting: items.length,
      totalInterestToDistribute: totalInterest,
      items,
    };
  }
}
