import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // 1. VUE D'ENSEMBLE — KPIs enrichis
  // ============================================================
  async getPlatformStats() {
    const [
      totalAssociations,
      activeAssociations,
      trialingAssociations,
      totalMembers,
      totalTransactions,
      auditLogsCount,
      loansActive,
      tontinesActive,
      sanctionsPending,
      anomaliesCount,
      contactMessagesUnread,
    ] = await Promise.all([
      this.prisma.association.count(),
      this.prisma.association.count({ where: { subscriptionStatus: 'ACTIVE', isActive: true } }),
      this.prisma.association.count({ where: { subscriptionStatus: 'TRIALING' } }),
      this.prisma.associationMember.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transaction.count(),
      this.prisma.auditLog.count(),
      this.prisma.loan.count({ where: { status: { in: ['APPROVED', 'DISBURSED'] } } }),
      this.prisma.tontine.count({ where: { status: 'ACTIVE' } }),
      this.prisma.sanction.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count({ where: { status: 'ANOMALY' } }),
      this.prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

    const suspendedAssociations = await this.prisma.association.count({ where: { isActive: false } });

    // Trials expiring in 7 days
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const trialsExpiringSoon = await this.prisma.association.count({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { gte: now, lte: in7Days },
      },
    });

    // MRR calculation
    const associationsWithPlans = await this.prisma.association.findMany({
      where: { subscriptionStatus: 'ACTIVE', isActive: true },
      select: { plan: true },
    });
    const PLAN_PRICES: Record<string, number> = {
      DISCOVERY: 0,
      ESSENTIAL: 9900,
      PRO: 24900,
      ENTERPRISE: 100000,
    };
    let mrrXaf = 0;
    for (const assoc of associationsWithPlans) {
      mrrXaf += PLAN_PRICES[assoc.plan] ?? 0;
    }
    const arrXaf = mrrXaf * 12;

    // Total volume
    const totalVolumeResult = await this.prisma.transaction.aggregate({ _sum: { amount: true } });
    const totalVolume = totalVolumeResult._sum.amount || 0;

    // Plan distribution
    const planGroups = await this.prisma.association.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });
    const planDistribution = planGroups.map((g) => ({
      plan: g.plan,
      count: g._count.plan,
    }));

    // Country distribution
    const countryGroups = await this.prisma.association.groupBy({
      by: ['country'],
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });
    const countryDistribution = countryGroups.map((g) => ({
      country: g.country,
      count: g._count.country,
    }));

    // Registration history (last 6 months)
    const associationsWithDates = await this.prisma.association.findMany({
      select: { createdAt: true },
    });
    const historyMap = new Map<string, number>();
    const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' });
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      historyMap.set(formatter.format(d), 0);
    }
    associationsWithDates.forEach((assoc) => {
      const label = formatter.format(assoc.createdAt);
      if (historyMap.has(label)) {
        historyMap.set(label, historyMap.get(label)! + 1);
      }
    });
    const registrationHistory = Array.from(historyMap.entries()).map(([name, total]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      total,
    }));

    // Recent anomalies (last 5)
    const recentAnomalies = await this.prisma.transaction.findMany({
      where: { status: 'ANOMALY' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        association: { select: { name: true, slug: true } },
      },
    });

    return {
      primaryAdmin: {
        email: 'gerazayisti@gmail.com',
        phone: '695183768',
        role: 'SUPER_ADMIN',
      },
      stats: {
        totalAssociations,
        activeAssociations,
        trialingAssociations,
        suspendedAssociations,
        totalMembers,
        totalTransactions,
        mrrXaf,
        arrXaf,
        totalVolume,
        loansActive,
        tontinesActive,
        sanctionsPending,
        anomaliesCount,
        trialsExpiringSoon,
        contactMessagesUnread,
        uptime: '99.9%',
        auditLogsCount,
      },
      planDistribution,
      countryDistribution,
      registrationHistory,
      recentAnomalies,
    };
  }

  // ============================================================
  // 2. ASSOCIATIONS — enrichies
  // ============================================================
  async getHostedAssociations() {
    const assocs = await this.prisma.association.findMany({
      include: {
        _count: {
          select: {
            members: true,
            caisses: true,
            tontines: true,
            loans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each association, get the last audit log date (last activity)
    const assocIds = assocs.map((a) => a.id);
    const lastLogs = await this.prisma.auditLog.findMany({
      where: { associationId: { in: assocIds } },
      orderBy: { createdAt: 'desc' },
      select: { associationId: true, createdAt: true },
    });
    const lastActivityMap = new Map<string, Date>();
    for (const log of lastLogs) {
      if (log.associationId && !lastActivityMap.has(log.associationId)) {
        lastActivityMap.set(log.associationId, log.createdAt);
      }
    }

    // Aggregate volume per association
    const volumes = await this.prisma.transaction.groupBy({
      by: ['associationId'],
      _sum: { amount: true },
      where: { status: 'CONFIRMED' },
    });
    const volumeMap = new Map<string, number>();
    for (const v of volumes) {
      volumeMap.set(v.associationId, v._sum.amount || 0);
    }

    return assocs.map((item) => ({
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
      lastActivity: lastActivityMap.get(item.id) || null,
      stats: {
        membersCount: item._count.members,
        caissesCount: item._count.caisses,
        tontinesCount: item._count.tontines,
        loansCount: item._count.loans,
        totalVolumeXaf: volumeMap.get(item.id) || 0,
      },
    }));
  }

  // ============================================================
  // 3. UTILISATEURS PLATEFORME
  // ============================================================
  async getPlatformUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        platformRole: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        twoFactorEnabled: true,
        preferredLanguage: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            association: { select: { name: true, slug: true } },
          },
        },
        refreshTokens: {
          where: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          select: { id: true, deviceInfo: true, createdAt: true },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      platformRole: u.platformRole,
      isEmailVerified: u.isEmailVerified,
      isPhoneVerified: u.isPhoneVerified,
      twoFactorEnabled: u.twoFactorEnabled,
      preferredLanguage: u.preferredLanguage,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      activeSessions: u.refreshTokens.length,
      associationsCount: u.memberships.length,
      memberships: u.memberships.map((m) => ({
        associationName: m.association.name,
        associationSlug: m.association.slug,
        role: m.role,
        status: m.status,
      })),
    }));
  }

  // Révoquer toutes les sessions d'un utilisateur
  async revokeUserSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true, message: 'Toutes les sessions ont été révoquées.' };
  }

  // ============================================================
  // 4. ABONNEMENTS & FACTURATION
  // ============================================================
  async getSubscriptionOverview() {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const allAssocs = await this.prisma.association.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        plan: true,
        subscriptionStatus: true,
        isActive: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    });

    const PLAN_PRICES: Record<string, number> = {
      DISCOVERY: 0,
      ESSENTIAL: 9900,
      PRO: 24900,
      ENTERPRISE: 100000,
    };

    return allAssocs.map((a) => ({
      ...a,
      membersCount: a._count.members,
      priceXaf: PLAN_PRICES[a.plan] ?? 0,
      expiresIn7Days: a.trialEndsAt ? a.trialEndsAt >= now && a.trialEndsAt <= in7Days : false,
      expiresIn30Days: a.trialEndsAt ? a.trialEndsAt >= now && a.trialEndsAt <= in30Days : false,
    }));
  }

  // ============================================================
  // 5. MÉTRIQUES SAAS
  // ============================================================
  async getSaasMetrics() {
    const [totalAssocs, activeAssocs, trialAssocs, canceledAssocs] = await Promise.all([
      this.prisma.association.count(),
      this.prisma.association.count({ where: { subscriptionStatus: 'ACTIVE', isActive: true } }),
      this.prisma.association.count({ where: { subscriptionStatus: 'TRIALING' } }),
      this.prisma.association.count({ where: { subscriptionStatus: { in: ['CANCELED', 'ARCHIVED'] } } }),
    ]);

    // MRR par plan
    const planGroups = await this.prisma.association.groupBy({
      by: ['plan'],
      where: { subscriptionStatus: 'ACTIVE', isActive: true },
      _count: { plan: true },
    });
    const PLAN_PRICES: Record<string, number> = {
      DISCOVERY: 0,
      ESSENTIAL: 9900,
      PRO: 24900,
      ENTERPRISE: 100000,
    };
    let mrrXaf = 0;
    const mrrByPlan = planGroups.map((g) => {
      const revenue = (PLAN_PRICES[g.plan] ?? 0) * g._count.plan;
      mrrXaf += revenue;
      return { plan: g.plan, count: g._count.plan, revenueXaf: revenue };
    });
    const arrXaf = mrrXaf * 12;

    // Churn rate (cancelled / total)
    const churnRate = totalAssocs > 0 ? Math.round((canceledAssocs / totalAssocs) * 100 * 10) / 10 : 0;

    // Conversion trial → paid
    const paidFromTrial = await this.prisma.association.count({
      where: { subscriptionStatus: 'ACTIVE', isActive: true },
    });
    const trialConversionRate =
      totalAssocs > 0 ? Math.round((paidFromTrial / totalAssocs) * 100 * 10) / 10 : 0;

    // Répartition géo
    const countryGroups = await this.prisma.association.groupBy({
      by: ['country'],
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });

    return {
      mrrXaf,
      arrXaf,
      totalAssocs,
      activeAssocs,
      trialAssocs,
      canceledAssocs,
      churnRate,
      trialConversionRate,
      mrrByPlan,
      countryDistribution: countryGroups.map((g) => ({
        country: g.country,
        count: g._count.country,
      })),
    };
  }

  // ============================================================
  // 6. ANOMALIES DE PAIEMENT
  // ============================================================
  async getPaymentAnomalies() {
    // Agréger par association pour ne pas exposer les membres individuels
    const anomalyGroups = await this.prisma.transaction.groupBy({
      by: ['associationId'],
      where: { status: 'ANOMALY' },
      _count: { id: true },
      _sum: { amount: true },
      _max: { createdAt: true },
    });

    const assocIds = anomalyGroups.map((g) => g.associationId);
    const assocNames = await this.prisma.association.findMany({
      where: { id: { in: assocIds } },
      select: { id: true, name: true, slug: true },
    });
    const nameMap = new Map(assocNames.map((a) => [a.id, { name: a.name, slug: a.slug }]));

    return anomalyGroups.map((g) => ({
      associationId: g.associationId,
      associationName: nameMap.get(g.associationId)?.name || 'Inconnue',
      associationSlug: nameMap.get(g.associationId)?.slug || '',
      count: g._count.id,
      totalAmountXaf: g._sum.amount || 0,
      lastOccurredAt: g._max.createdAt,
      resolved: false,
    }));
  }

  // ============================================================
  // 7. JOURNAUX D'AUDIT
  // ============================================================
  async getAuditLogs(params?: { category?: string; associationId?: string; limit?: number }) {
    const where: any = {};
    if (params?.category) where.category = params.category;
    if (params?.associationId) where.associationId = params.associationId;

    return this.prisma.auditLog.findMany({
      take: params?.limit || 100,
      orderBy: { createdAt: 'desc' },
      where,
      include: {
        association: { select: { name: true, slug: true } },
        actor: { select: { email: true, phone: true } },
      },
    });
  }

  // ============================================================
  // 8. SUPPORT — Messages de contact
  // ============================================================
  async getContactMessages() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markMessageRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // ============================================================
  // Association management
  // ============================================================
  async toggleAssociationStatus(associationId: string) {
    const assoc = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
    });
    if (!assoc) return null;

    return this.prisma.association.update({
      where: { id: assoc.id },
      data: { isActive: !assoc.isActive },
    });
  }

  async updateAssociationSubscription(
    associationId: string,
    plan: string,
    durationMonths: number,
  ) {
    const assoc = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
    });
    if (!assoc) return null;

    const now = new Date();
    const currentEnd = assoc.subscriptionEndsAt && assoc.subscriptionEndsAt > now
      ? assoc.subscriptionEndsAt
      : now;
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + durationMonths);

    return this.prisma.association.update({
      where: { id: assoc.id },
      data: {
        plan: plan as any,
        subscriptionStatus: 'ACTIVE',
        subscriptionEndsAt: newEnd,
        isActive: true,
      },
    });
  }
}
