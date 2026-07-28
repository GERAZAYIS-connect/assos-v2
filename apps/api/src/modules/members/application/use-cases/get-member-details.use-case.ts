import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { AssociationRole } from '@prisma/client';

export interface GetMemberDetailsQuery {
  associationId: string;
  actorUserId: string;
  targetMemberId: string;
}

@Injectable()
export class GetMemberDetailsUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: GetMemberDetailsQuery) {
    const actor = await this.memberRepository.findByAssociationAndUser(
      query.associationId,
      query.actorUserId,
    );

    if (!actor) {
      throw new ForbiddenException("Vous ne faites pas partie de cette association.");
    }

    const target = await this.memberRepository.findById(query.targetMemberId);
    if (!target) {
      throw new NotFoundException("Membre introuvable.");
    }

    const isSelf = actor.userId === target.userId;
    const isBureau =
      actor.role === AssociationRole.PRESIDENT ||
      actor.role === AssociationRole.SECRETARY ||
      actor.role === AssociationRole.TREASURER;

    if (!isSelf && !isBureau) {
      throw new ForbiddenException(
        "Seuls le Président, le Secrétaire, le Trésorier et le membre concerné peuvent consulter cette fiche.",
      );
    }

    // Calculate total contributions (DEPOSIT transactions for this member)
    const depositsSum = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        memberId: target.id,
        type: 'DEPOSIT',
        status: 'CONFIRMED',
      },
    });

    const totalContributions = depositsSum._sum.amount || 0;

    // Interaction history & Audit logs
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        targetId: target.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const transactions = await this.prisma.transaction.findMany({
      where: { memberId: target.id },
      include: { caisse: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const combinedTimeline = [
      ...auditLogs.map((log) => ({
        id: log.id,
        category: log.category,
        action: log.action,
        createdAt: log.createdAt,
        metadata: log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : null,
      })),
      ...transactions.map((tx) => ({
        id: tx.id,
        category: 'TREASURY',
        action: `${tx.type === 'DEPOSIT' ? 'Dépôt / Épargne' : 'Retrait'} de ${tx.amount.toLocaleString('fr-FR')} XAF (${tx.caisse.name})`,
        createdAt: tx.createdAt,
        metadata: { reference: tx.reference, description: tx.description },
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 30);

    return {
      member: target.toResponseObject(),
      history: {
        financialSummary: {
          totalContributions,
          totalLoans: 0,
          activeLoansCount: 0,
          totalSanctionsFines: 0,
        },
        auditLogs: combinedTimeline,
      },
    };
  }
}

