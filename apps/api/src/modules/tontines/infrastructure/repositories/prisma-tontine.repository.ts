import { Injectable } from '@nestjs/common';
import { ITontineRepository } from '../../domain/repositories/tontine.repository.interface';
import { Tontine } from '../../domain/entities/tontine.entity';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class PrismaTontineRepository implements ITontineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAssociationId(idOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    return assoc ? assoc.id : null;
  }

  async createTontine(tontine: Tontine, memberIds: string[]): Promise<Tontine> {
    const data = tontine.toJSON();

    const created = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tontine
      const newTontine = await tx.tontine.create({
        data: {
          id: data.id,
          associationId: data.associationId,
          caisseId: data.caisseId,
          name: data.name,
          description: data.description,
          type: data.type,
          amountPerRound: data.amountPerRound,
          frequency: data.frequency,
          status: 'ACTIVE',
          startDate: new Date(),
        },
      });

      // 2. Add Members
      if (memberIds.length > 0) {
        await tx.tontineMember.createMany({
          data: memberIds.map((mId, index) => ({
            tontineId: newTontine.id,
            memberId: mId,
            position: index + 1,
          })),
        });

        // 3. Generate Rounds (1 round per participant)
        const frequency = newTontine.frequency;
        for (let i = 0; i < memberIds.length; i++) {
          const dueDate = new Date();
          if (frequency === 'WEEKLY') {
            dueDate.setDate(dueDate.getDate() + i * 7);
          } else if (frequency === 'BIWEEKLY') {
            dueDate.setDate(dueDate.getDate() + i * 14);
          } else {
            // MONTHLY
            dueDate.setMonth(dueDate.getMonth() + i);
          }

          const round = await tx.tontineRound.create({
            data: {
              tontineId: newTontine.id,
              roundNumber: i + 1,
              dueDate,
              potAmount: data.amountPerRound * memberIds.length,
              status: 'OPEN',
            },
          });

          // 4. Generate expected contributions for each member for this round
          await tx.tontineContribution.createMany({
            data: memberIds.map((mId) => ({
              roundId: round.id,
              memberId: mId,
              amount: data.amountPerRound,
              isPaid: false,
            })),
          });
        }
      }

      return newTontine;
    });

    return new Tontine(created as any);
  }

  async findById(id: string): Promise<Tontine | null> {
    const raw = await this.prisma.tontine.findUnique({
      where: { id },
    });
    if (!raw) return null;
    return new Tontine(raw as any);
  }

  async findByAssociationId(associationId: string, memberId?: string): Promise<Tontine[]> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) return [];

    const where: any = { associationId: assocId };
    if (memberId) {
      where.members = { some: { memberId } };
    }

    const list = await this.prisma.tontine.findMany({
      where,
      include: {
        caisse: { select: { id: true, name: true, balance: true } },
        members: {
          include: {
            member: {
              include: {
                user: { select: { email: true } },
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        rounds: {
          include: {
            beneficiary: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
                user: { select: { email: true } },
              },
            },
            contributions: {
              include: {
                member: {
                  include: {
                    profile: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((t) => new Tontine(t as any));
  }

  async updateTontine(tontine: Tontine): Promise<void> {
    const data = tontine.toJSON();
    await this.prisma.tontine.update({
      where: { id: data.id },
      data: {
        status: data.status,
        name: data.name,
        description: data.description,
      },
    });
  }

  // ACID Atomic Operation: Pay Contribution
  async payContributionAtomic(data: {
    roundId: string;
    memberId: string;
    amount: number;
    createdByUserId?: string;
  }): Promise<{ contribution: any; transaction: any }> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch round & tontine
      const round = await tx.tontineRound.findUnique({
        where: { id: data.roundId },
        include: { tontine: true },
      });
      if (!round) throw new Error('Tour de tontine introuvable.');

      // 2. Fetch contribution
      const contrib = await tx.tontineContribution.findUnique({
        where: { roundId_memberId: { roundId: data.roundId, memberId: data.memberId } },
      });
      if (!contrib) throw new Error('Cotisation introuvable.');
      if (contrib.isPaid) throw new Error('Cette cotisation a déjà été réglée.');

      // 3. Target Caisse (linked to Tontine or fallback to default MAIN caisse)
      let caisseId = round.tontine.caisseId;
      if (!caisseId) {
        const defaultCaisse = await tx.caisse.findFirst({
          where: { associationId: round.tontine.associationId, type: 'MAIN' },
        });
        if (!defaultCaisse) throw new Error('Aucune caisse principale disponible.');
        caisseId = defaultCaisse.id;
      }

      // 4. Credit Caisse
      await tx.caisse.update({
        where: { id: caisseId },
        data: { balance: { increment: data.amount } },
      });

      // 5. Create Transaction entry for receipt
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.transaction.count();
      const reference = `REC-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      const transaction = await tx.transaction.create({
        data: {
          associationId: round.tontine.associationId,
          caisseId,
          type: TransactionType.DEPOSIT,
          amount: data.amount,
          reference,
          description: `Cotisation Tontine "${round.tontine.name}" (Tour #${round.roundNumber})`,
          memberId: data.memberId,
          createdByUserId: data.createdByUserId,
        },
      });

      // 6. Update Contribution
      const updatedContrib = await tx.tontineContribution.update({
        where: { id: contrib.id },
        data: {
          isPaid: true,
          paidAt: new Date(),
          transactionId: transaction.id,
        },
      });

      return { contribution: updatedContrib, transaction };
    });
  }

  // ACID Atomic Operation: Attribute Pot to Winner
  async attributePotAtomic(data: {
    roundId: string;
    beneficiaryMemberId: string;
    potAmount: number;
    auctionAmount?: number;
    createdByUserId?: string;
  }): Promise<{ round: any; transaction: any }> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch round & tontine
      const round = await tx.tontineRound.findUnique({
        where: { id: data.roundId },
        include: { tontine: true },
      });
      if (!round) throw new Error('Tour de tontine introuvable.');
      if (round.status === 'CLOSED') throw new Error('Ce tour de tontine a déjà été attribué et clôturé.');

      // Check if beneficiary already won a pot in this tontine
      const previousWin = await tx.tontineRound.findFirst({
        where: {
          tontineId: round.tontineId,
          beneficiaryMemberId: data.beneficiaryMemberId,
          status: 'CLOSED',
        },
      });
      if (previousWin) {
        throw new Error('Ce membre a déjà bénéficié d\'un pot dans ce cycle de tontine.');
      }

      // Verify that ALL participants have paid their contributions for this round
      const unpaidCount = await tx.tontineContribution.count({
        where: {
          roundId: round.id,
          isPaid: false,
        },
      });
      if (unpaidCount > 0) {
        throw new Error(`Impossible d'attribuer le pot : ${unpaidCount} participant(s) n'ont pas encore versé leur cotisation pour ce tour.`);
      }

      // 2. Target Caisse
      let caisseId = round.tontine.caisseId;
      if (!caisseId) {
        const defaultCaisse = await tx.caisse.findFirst({
          where: { associationId: round.tontine.associationId, type: 'MAIN' },
        });
        if (!defaultCaisse) throw new Error('Aucune caisse principale disponible.');
        caisseId = defaultCaisse.id;
      }

      // 3. Verify Caisse Balance
      const caisse = await tx.caisse.findUnique({ where: { id: caisseId } });
      if (!caisse || caisse.balance < data.potAmount) {
        throw new Error(`Solde insuffisant dans la caisse de tontine (${caisse?.balance || 0} XAF disponibles pour un pot de ${data.potAmount} XAF).`);
      }

      // 4. Debit Caisse
      await tx.caisse.update({
        where: { id: caisseId },
        data: { balance: { decrement: data.potAmount } },
      });

      // 5. Create Transaction entry for receipt
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.transaction.count();
      const reference = `REC-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      const transaction = await tx.transaction.create({
        data: {
          associationId: round.tontine.associationId,
          caisseId,
          type: TransactionType.WITHDRAWAL,
          amount: data.potAmount,
          reference,
          description: `Attribution Pot Tontine "${round.tontine.name}" (Tour #${round.roundNumber})`,
          memberId: data.beneficiaryMemberId,
          createdByUserId: data.createdByUserId,
        },
      });

      // 6. Update Round
      const updatedRound = await tx.tontineRound.update({
        where: { id: round.id },
        data: {
          status: 'CLOSED',
          beneficiaryMemberId: data.beneficiaryMemberId,
          auctionAmount: data.auctionAmount || 0,
          disbursedAt: new Date(),
          transactionId: transaction.id,
        },
      });

      // 7. Check if all rounds are CLOSED -> set Tontine status to COMPLETED
      const remainingOpen = await tx.tontineRound.count({
        where: {
          tontineId: round.tontineId,
          status: 'OPEN',
        },
      });

      if (remainingOpen === 0) {
        await tx.tontine.update({
          where: { id: round.tontineId },
          data: { status: 'COMPLETED' },
        });
      }

      return { round: updatedRound, transaction };
    });
  }

  // ACID Atomic Operation: Renew Tontine for a new cycle
  async renewTontineAtomic(tontineId: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const tontine = await tx.tontine.findUnique({
        where: { id: tontineId },
        include: { members: true, rounds: true },
      });

      if (!tontine) throw new Error('Tontine introuvable.');

      const memberIds = tontine.members.map((m) => m.memberId);
      if (memberIds.length === 0) throw new Error('Aucun membre inscrit dans cette tontine.');

      const memberCount = memberIds.length;
      const now = new Date();
      const maxRoundNumber = tontine.rounds.reduce((max, r) => Math.max(max, r.roundNumber), 0);

      // Create new rounds for the new cycle
      for (let i = 1; i <= memberCount; i++) {
        const dueDate = new Date(now);
        if (tontine.frequency === 'WEEKLY') {
          dueDate.setDate(dueDate.getDate() + i * 7);
        } else if (tontine.frequency === 'BIWEEKLY') {
          dueDate.setDate(dueDate.getDate() + i * 14);
        } else {
          dueDate.setMonth(dueDate.getMonth() + i);
        }

        const newRoundNumber = maxRoundNumber + i;

        await tx.tontineRound.create({
          data: {
            tontineId: tontine.id,
            roundNumber: newRoundNumber,
            dueDate,
            status: 'OPEN',
            potAmount: tontine.amountPerRound * memberCount,
            contributions: {
              create: memberIds.map((mId) => ({
                memberId: mId,
                amount: tontine.amountPerRound,
                isPaid: false,
              })),
            },
          },
        });
      }

      // Re-activate Tontine
      await tx.tontine.update({
        where: { id: tontineId },
        data: { status: 'ACTIVE' },
      });

      return this.findById(tontineId);
    });
  }
}
