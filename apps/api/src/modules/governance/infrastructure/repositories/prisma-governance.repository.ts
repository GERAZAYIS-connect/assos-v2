import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { IGovernanceRepository } from '../../domain/repositories/governance.repository.interface';
import { Resolution } from '../../domain/entities/resolution.entity';
import { VoteChoice, ResolutionStatus, ResolutionCategory, AssociationRole } from '@prisma/client';

@Injectable()
export class PrismaGovernanceRepository implements IGovernanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAssociationId(idOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: { id: true },
    });
    return assoc?.id || null;
  }

  async createResolution(resolution: Resolution): Promise<Resolution> {
    const created = await this.prisma.resolution.create({
      data: {
        id: resolution.id,
        associationId: resolution.associationId,
        meetingId: resolution.meetingId || null,
        title: resolution.title,
        description: resolution.description || null,
        category: resolution.category,
        status: resolution.status,
        voteType: resolution.voteType,
        quorumThreshold: resolution.quorumThreshold,
        majorityThreshold: resolution.majorityThreshold,
        targetRole: resolution.targetRole || null,
        candidateMemberId: resolution.candidateMemberId || null,
      },
    });

    const res = await this.findById(created.id);
    return new Resolution(res);
  }

  async findById(id: string): Promise<any | null> {
    const res = await this.prisma.resolution.findUnique({
      where: { id },
      include: {
        votes: {
          include: {
            voter: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
                user: { select: { email: true } },
              },
            },
          },
        },
        electedMember: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
            user: { select: { email: true } },
          },
        },
        candidateMember: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!res) return null;

    // Get total active members count for Quorum calculation
    const totalActiveMembers = await this.prisma.associationMember.count({
      where: { associationId: res.associationId, status: 'ACTIVE' },
    });

    const totalVotes = res.votes.length;
    const votesFor = res.votes.filter((v) => v.choice === VoteChoice.FOR).length;
    const votesAgainst = res.votes.filter((v) => v.choice === VoteChoice.AGAINST).length;
    const votesAbstain = res.votes.filter((v) => v.choice === VoteChoice.ABSTAIN).length;

    const quorumPercentage = totalActiveMembers > 0 ? (totalVotes / totalActiveMembers) * 100 : 0;
    const expressVotes = votesFor + votesAgainst;
    const approvalPercentage = expressVotes > 0 ? (votesFor / expressVotes) * 100 : 0;

    return {
      ...res,
      stats: {
        totalActiveMembers,
        totalVotes,
        votesFor,
        votesAgainst,
        votesAbstain,
        quorumPercentage: Math.round(quorumPercentage * 10) / 10,
        approvalPercentage: Math.round(approvalPercentage * 10) / 10,
        isQuorumMet: quorumPercentage >= res.quorumThreshold,
        isMajorityMet: approvalPercentage >= res.majorityThreshold,
      },
    };
  }

  async findByAssociationId(associationId: string): Promise<any[]> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) return [];

    const resolutions = await this.prisma.resolution.findMany({
      where: { associationId: assocId },
      include: {
        votes: { select: { id: true, choice: true, voterMemberId: true } },
        electedMember: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        candidateMember: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalActiveMembers = await this.prisma.associationMember.count({
      where: { associationId: assocId, status: 'ACTIVE' },
    });

    return resolutions.map((res) => {
      const totalVotes = res.votes.length;
      const votesFor = res.votes.filter((v) => v.choice === VoteChoice.FOR).length;
      const votesAgainst = res.votes.filter((v) => v.choice === VoteChoice.AGAINST).length;
      const expressVotes = votesFor + votesAgainst;

      const quorumPercentage = totalActiveMembers > 0 ? (totalVotes / totalActiveMembers) * 100 : 0;
      const approvalPercentage = expressVotes > 0 ? (votesFor / expressVotes) * 100 : 0;

      return {
        ...res,
        stats: {
          totalActiveMembers,
          totalVotes,
          votesFor,
          votesAgainst,
          votesAbstain: res.votes.filter((v) => v.choice === VoteChoice.ABSTAIN).length,
          quorumPercentage: Math.round(quorumPercentage * 10) / 10,
          approvalPercentage: Math.round(approvalPercentage * 10) / 10,
        },
      };
    });
  }

  async castVote(data: {
    resolutionId: string;
    voterMemberId: string;
    choice: VoteChoice;
  }): Promise<any> {
    const resolution = await this.prisma.resolution.findUnique({
      where: { id: data.resolutionId },
    });

    if (!resolution) throw new Error('Résolution introuvable.');
    if (resolution.status !== ResolutionStatus.OPEN) {
      throw new Error('Le scrutin pour cette résolution est fermé.');
    }

    // Check unique vote
    const existing = await this.prisma.castVote.findUnique({
      where: {
        resolutionId_voterMemberId: {
          resolutionId: data.resolutionId,
          voterMemberId: data.voterMemberId,
        },
      },
    });

    if (existing) {
      throw new Error('Vous avez déjà voté pour cette résolution.');
    }

    await this.prisma.castVote.create({
      data: {
        resolutionId: data.resolutionId,
        voterMemberId: data.voterMemberId,
        choice: data.choice,
        candidateMemberId: resolution.candidateMemberId || null,
      },
    });

    return this.findById(data.resolutionId);
  }

  async closeResolutionAtomic(data: { resolutionId: string }): Promise<any> {
    await this.prisma.$transaction(async (tx) => {
      const resolution = await tx.resolution.findUnique({
        where: { id: data.resolutionId },
        include: { votes: true },
      });

      if (!resolution) throw new Error('Résolution introuvable.');

      const totalActiveMembers = await tx.associationMember.count({
        where: { associationId: resolution.associationId, status: 'ACTIVE' },
      });

      const totalVotes = resolution.votes.length;
      const votesFor = resolution.votes.filter((v) => v.choice === VoteChoice.FOR).length;
      const votesAgainst = resolution.votes.filter((v) => v.choice === VoteChoice.AGAINST).length;
      const expressVotes = votesFor + votesAgainst;

      const quorumPercentage = totalActiveMembers > 0 ? (totalVotes / totalActiveMembers) * 100 : 0;
      const approvalPercentage = expressVotes > 0 ? (votesFor / expressVotes) * 100 : 0;

      const isQuorumMet = quorumPercentage >= resolution.quorumThreshold;
      const isMajorityMet = approvalPercentage >= resolution.majorityThreshold;

      const finalStatus = isQuorumMet && isMajorityMet ? ResolutionStatus.PASSED : ResolutionStatus.REJECTED;
      let electedMemberId = resolution.electedMemberId;

      // BUREAU ELECTION ROLE TRANSITION LOGIC
      if (finalStatus === ResolutionStatus.PASSED && resolution.category === ResolutionCategory.BUREAU_ELECTION && resolution.candidateMemberId && resolution.targetRole) {
        electedMemberId = resolution.candidateMemberId;

        // 1. Revert previous officer holding this targetRole to regular MEMBER
        await tx.associationMember.updateMany({
          where: {
            associationId: resolution.associationId,
            role: resolution.targetRole,
          },
          data: { role: AssociationRole.MEMBER },
        });

        // 2. Assign elected candidate member to new targetRole
        await tx.associationMember.update({
          where: { id: resolution.candidateMemberId },
          data: { role: resolution.targetRole },
        });
      }

      await tx.resolution.update({
        where: { id: resolution.id },
        data: {
          status: finalStatus,
          electedMemberId,
        },
      });
    });

    return this.findById(data.resolutionId);
  }
}
