import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const totalAssociations = await this.prisma.association.count();
    const activeAssociations = await this.prisma.association.count({ where: { isActive: true } });
    const suspendedAssociations = totalAssociations - activeAssociations;
    const totalMembers = await this.prisma.associationMember.count();
    const totalTransactions = await this.prisma.transaction.count();
    const auditLogsCount = await this.prisma.auditLog.count();

    // Calculate MRR/ARR based on subscriptions
    // Using simple mock aggregation for now based on Plan prices
    // In a real scenario, this would check active subscriptions in Stripe/Freemo Pay
    const associationsWithPlans = await this.prisma.association.findMany({
      where: { subscriptionStatus: 'ACTIVE', isActive: true },
      select: { plan: true },
    });

    let mrrXaf = 0;
    for (const assoc of associationsWithPlans) {
      if (assoc.plan === 'ESSENTIAL') mrrXaf += 15000;
      else if (assoc.plan === 'PRO') mrrXaf += 35000;
      else if (assoc.plan === 'ENTERPRISE') mrrXaf += 100000;
    }
    const arrXaf = mrrXaf * 12;

    // We can also aggregate total transaction volume if needed, keeping simple for now
    const totalVolumeResult = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
    });
    const totalVolume = totalVolumeResult._sum.amount || 0;

    return {
      primaryAdmin: {
        email: 'gerazayisti@gmail.com', // Replace dynamically if needed
        phone: '695183768',
        role: 'SUPER_ADMIN',
      },
      stats: {
        totalAssociations,
        activeAssociations,
        suspendedAssociations,
        totalMembers,
        totalTransactions,
        totalVolume,
        mrrXaf,
        arrXaf,
        smsConsumed: 1250, // Mock for now
        storageUsedGb: '1.2', // Mock for now
        uptime: '99.9%', // Mock
        auditLogsCount,
      },
    };
  }

  async getHostedAssociations() {
    const assocs = await this.prisma.association.findMany({
      include: {
        _count: {
          select: {
            members: true,
            caisses: true,
            tontines: true,
            loans: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return assocs.map(item => {
      const hasName = Boolean(item.name && item.name.trim().length > 0);
      const hasMotto = Boolean(item.motto && item.motto.trim().length > 0);
      const hasLegalStatus = Boolean(item.legalStatus && item.legalStatus.trim().length > 0);
      const hasRegistrationRef = Boolean(item.registrationRef && item.registrationRef.trim().length > 0);

      const missingFields: string[] = [];
      if (!hasName) missingFields.push("Nom de l'association");
      if (!hasMotto) missingFields.push("Devise (Motto)");
      if (!hasLegalStatus) missingFields.push("Statut Légal");
      if (!hasRegistrationRef) missingFields.push("N° Récépissé / Enregistrement");

      const completedCount = 4 - missingFields.length;
      const completenessPercentage = Math.round((completedCount / 4) * 100);

      return {
        id: item.id,
        name: item.name || 'Association Sans Nom',
        slug: item.slug,
        motto: item.motto,
        legalStatus: item.legalStatus,
        registrationRef: item.registrationRef,
        country: item.country,
        currency: item.currency,
        plan: item.plan,
        subscriptionStatus: item.subscriptionStatus,
        isActive: item.isActive,
        trialEndsAt: item.trialEndsAt,
        subscriptionEndsAt: item.subscriptionEndsAt,
        createdAt: item.createdAt,
        completeness: {
          isComplete: missingFields.length === 0,
          completedCount,
          totalRequired: 4,
          percentage: completenessPercentage,
          missingFields,
        },
        stats: {
          membersCount: item._count.members,
          caissesCount: item._count.caisses,
          tontinesCount: item._count.tontines,
          loansCount: item._count.loans,
        },
      };
    });
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        association: {
          select: { name: true, slug: true }
        }
      }
    });
  }
}
