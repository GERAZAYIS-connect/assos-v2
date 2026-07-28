import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@ApiTags('super-admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SuperAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get global platform statistics for SuperAdmin' })
  async getGlobalStats() {
    const [
      totalAssociations,
      activeAssociations,
      totalMembers,
      totalTransactions,
      auditLogsCount,
    ] = await Promise.all([
      this.prisma.association.count(),
      this.prisma.association.count({ where: { isActive: true } }),
      this.prisma.associationMember.count(),
      this.prisma.transaction.count(),
      this.prisma.auditLog.count(),
    ]);

    // Calculate aggregated financial volume across platform
    const txAggregate = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
    });

    const totalVolume = txAggregate._sum.amount || 0;

    // Estimate MRR (Monthly Recurring Revenue)
    const planCounts = await this.prisma.association.groupBy({
      by: ['plan'],
      _count: { id: true },
    });

    let mrr = 0;
    planCounts.forEach((p) => {
      if (p.plan === 'ESSENTIAL') mrr += p._count.id * 9900;
      if (p.plan === 'PRO') mrr += p._count.id * 24900;
      if (p.plan === 'ENTERPRISE') mrr += p._count.id * 50000;
    });

    return {
      primaryAdmin: {
        email: 'gerazayisti@gmail.com',
        phone: '695183768',
        role: 'SUPER_ADMINISTRATEUR',
      },
      stats: {
        totalAssociations,
        activeAssociations,
        suspendedAssociations: totalAssociations - activeAssociations,
        totalMembers,
        totalTransactions,
        totalVolume,
        mrrXaf: mrr,
        arrXaf: mrr * 12,
        smsConsumed: totalMembers * 14,
        storageUsedGb: Math.max(1, (totalAssociations * 0.4)).toFixed(1),
        uptime: '99.9%',
        auditLogsCount,
      },
    };
  }

  @Get('associations')
  @ApiOperation({ summary: 'Get all hosted associations with completeness check for SuperAdmin' })
  async getAllAssociations() {
    const list = await this.prisma.association.findMany({
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

    return list.map((a) => {
      const hasName = Boolean(a.name && a.name.trim().length > 0);
      const hasMotto = Boolean(a.motto && a.motto.trim().length > 0);
      const hasLegalStatus = Boolean(a.legalStatus && a.legalStatus.trim().length > 0);
      const hasRegistrationRef = Boolean(a.registrationRef && a.registrationRef.trim().length > 0);

      const missingFields: string[] = [];
      if (!hasName) missingFields.push("Nom de l'association");
      if (!hasMotto) missingFields.push("Devise (Motto)");
      if (!hasLegalStatus) missingFields.push("Statut Légal");
      if (!hasRegistrationRef) missingFields.push("N° Récépissé / Enregistrement");

      const completedCount = 4 - missingFields.length;
      const completenessPercentage = Math.round((completedCount / 4) * 100);

      return {
        id: a.id,
        name: a.name,
        slug: a.slug,
        motto: a.motto,
        legalStatus: a.legalStatus,
        registrationRef: a.registrationRef,
        country: a.country,
        currency: a.currency,
        plan: a.plan,
        subscriptionStatus: a.subscriptionStatus,
        isActive: a.isActive,
        trialEndsAt: a.trialEndsAt,
        subscriptionEndsAt: a.subscriptionEndsAt,
        createdAt: a.createdAt,
        completeness: {
          isComplete: missingFields.length === 0,
          completedCount,
          totalRequired: 4,
          percentage: completenessPercentage,
          missingFields,
        },
        stats: {
          membersCount: a._count.members,
          caissesCount: a._count.caisses,
          tontinesCount: a._count.tontines,
          loansCount: a._count.loans,
        },
      };
    });
  }

  @Patch('associations/:id/subscription')
  @ApiOperation({ summary: 'Advanced subscription & duration update for SuperAdmin' })
  async updateSubscription(
    @Param('id') id: string,
    @Body()
    body: {
      plan?: any;
      subscriptionStatus?: any;
      durationMonths?: number;
      extendTrialDays?: number;
      customExpiryDate?: string;
      paymentReference?: string;
    },
  ) {
    const updateData: any = {};
    if (body.plan) updateData.plan = body.plan;
    if (body.subscriptionStatus) updateData.subscriptionStatus = body.subscriptionStatus;

    const current = await this.prisma.association.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Association introuvable');

    let newSubEnd = current.subscriptionEndsAt || new Date();

    if (body.durationMonths && body.durationMonths > 0) {
      const base = newSubEnd > new Date() ? newSubEnd : new Date();
      newSubEnd = new Date(base.getTime() + body.durationMonths * 30 * 24 * 60 * 60 * 1000);
      updateData.subscriptionEndsAt = newSubEnd;
      updateData.subscriptionStatus = 'ACTIVE';
    }

    if (body.customExpiryDate) {
      updateData.subscriptionEndsAt = new Date(body.customExpiryDate);
      updateData.subscriptionStatus = 'ACTIVE';
    }

    if (body.extendTrialDays && body.extendTrialDays > 0) {
      const baseTrial = current.trialEndsAt && current.trialEndsAt > new Date() ? current.trialEndsAt : new Date();
      updateData.trialEndsAt = new Date(baseTrial.getTime() + body.extendTrialDays * 24 * 60 * 60 * 1000);
      updateData.subscriptionStatus = 'TRIAL';
    }

    const updated = await this.prisma.association.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.auditLog.create({
      data: {
        associationId: id,
        category: 'SUBSCRIPTION',
        action: 'SUPER_ADMIN_SUBSCRIPTION_UPDATE',
        targetType: 'ASSOCIATION',
        targetId: id,
        metadata: `Nouveau Plan: ${updated.plan}, Statut: ${updated.subscriptionStatus}, Ref Paiement: ${body.paymentReference || 'Manuelle'}`,
      },
    });

    return updated;
  }

  @Patch('associations/:id/status')
  @ApiOperation({ summary: 'Suspend or activate an association (SuperAdmin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; subscriptionStatus?: any; reason?: string }
  ) {
    const updateData: any = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.subscriptionStatus) updateData.subscriptionStatus = body.subscriptionStatus;

    const updated = await this.prisma.association.update({
      where: { id },
      data: updateData,
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        associationId: id,
        category: 'ASSOCIATION',
        action: body.isActive === false ? 'ASSOCIATION_SUSPENDED' : 'ASSOCIATION_ACTIVATED',
        targetType: 'ASSOCIATION',
        targetId: id,
        metadata: body.reason || 'Modifié par le Super-Administrateur (gerazayisti@gmail.com)',
      },
    });

    return updated;
  }

  @Patch('associations/:id/plan')
  @ApiOperation({ summary: 'Update SaaS plan or extend trial for an association (SuperAdmin)' })
  async updatePlan(
    @Param('id') id: string,
    @Body() body: { plan?: any; extendTrialDays?: number; subscriptionStatus?: any }
  ) {
    const updateData: any = {};
    if (body.plan) updateData.plan = body.plan;
    if (body.subscriptionStatus) updateData.subscriptionStatus = body.subscriptionStatus;

    if (body.extendTrialDays && body.extendTrialDays > 0) {
      const current = await this.prisma.association.findUnique({ where: { id } });
      const baseDate = current?.trialEndsAt && current.trialEndsAt > new Date() ? current.trialEndsAt : new Date();
      const newTrialDate = new Date(baseDate.getTime() + body.extendTrialDays * 24 * 60 * 60 * 1000);
      updateData.trialEndsAt = newTrialDate;
      updateData.subscriptionStatus = 'TRIAL';
    }

    const updated = await this.prisma.association.update({
      where: { id },
      data: updateData,
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        associationId: id,
        category: 'SUBSCRIPTION',
        action: 'SUPER_ADMIN_PLAN_UPDATE',
        targetType: 'ASSOCIATION',
        targetId: id,
        metadata: `Nouveau plan: ${body.plan || updated.plan}, Prolongation: ${body.extendTrialDays || 0} jours`,
      },
    });

    return updated;
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get global platform audit logs for SuperAdmin' })
  async getAuditLogs() {
    const logs = await this.prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        association: {
          select: { name: true, slug: true },
        },
      },
    });
    return logs;
  }
}
