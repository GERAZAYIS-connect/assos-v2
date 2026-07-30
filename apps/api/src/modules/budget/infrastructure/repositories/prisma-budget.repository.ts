import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  IBudgetRepository,
  CreateAnnualBudgetInput,
  CreateProfitDistributionInput,
} from '../../domain/repositories/budget.repository.interface';
import { BudgetStatus, BudgetItemType, DistributionStatus, DividendStatus, TransactionType, TransactionStatus, AuditCategory, CaisseType } from '@prisma/client';

@Injectable()
export class PrismaBudgetRepository implements IBudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveAssociationId(associationIdOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: associationIdOrSlug }, { slug: associationIdOrSlug }],
      },
      select: { id: true },
    });
    return assoc ? assoc.id : null;
  }

  async createAnnualBudget(input: CreateAnnualBudgetInput): Promise<any> {
    const assocId = await this.resolveAssociationId(input.associationId);
    if (!assocId) throw new BadRequestException('Association introuvable.');

    const existing = await this.prisma.annualBudget.findUnique({
      where: { associationId_year: { associationId: assocId, year: input.year } },
    });

    if (existing) {
      throw new BadRequestException(`Un budget prévisionnel existe déjà pour l'année ${input.year}.`);
    }

    return this.prisma.annualBudget.create({
      data: {
        associationId: assocId,
        year: input.year,
        title: input.title,
        status: BudgetStatus.DRAFT,
        items: input.items
          ? {
              create: input.items.map((item) => ({
                caisseId: item.caisseId,
                type: item.type,
                category: item.category,
                estimatedAmount: item.estimatedAmount,
                description: item.description,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: { caisse: { select: { id: true, name: true, type: true } } },
        },
      },
    });
  }

  async findAnnualBudgetByYear(associationId: string, year: number): Promise<any | null> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) return null;

    return this.prisma.annualBudget.findUnique({
      where: { associationId_year: { associationId: assocId, year } },
      include: {
        items: {
          include: { caisse: { select: { id: true, name: true, type: true } } },
        },
      },
    });
  }

  async listAnnualBudgets(associationId: string): Promise<any[]> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) return [];

    return this.prisma.annualBudget.findMany({
      where: { associationId: assocId },
      include: {
        items: true,
      },
      orderBy: { year: 'desc' },
    });
  }

  async updateAnnualBudgetStatus(id: string, status: BudgetStatus): Promise<any> {
    return this.prisma.annualBudget.update({
      where: { id },
      data: { status },
    });
  }

  async getBudgetExecutionStats(associationId: string, year: number) {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) throw new BadRequestException('Association introuvable.');

    const budget = await this.findAnnualBudgetByYear(assocId, year);

    // Get all transactions for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        associationId: assocId,
        status: TransactionStatus.CONFIRMED,
        createdAt: { gte: startOfYear, lte: endOfYear },
      },
    });

    let totalRealIncome = 0;
    let totalRealExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === TransactionType.DEPOSIT) {
        totalRealIncome += tx.amount;
      } else if (tx.type === TransactionType.WITHDRAWAL) {
        totalRealExpense += tx.amount;
      }
    });

    let totalEstimatedIncome = 0;
    let totalEstimatedExpense = 0;

    const itemsStats = budget?.items?.map((item: any) => {
      // Find real amount for item category
      const itemTx = transactions.filter((tx) => {
        const desc = tx.description?.toLowerCase() || '';
        const matchCategory = !item.category || desc.includes(item.category.toLowerCase());
        if (item.type === BudgetItemType.INCOME) {
          return tx.type === TransactionType.DEPOSIT && matchCategory;
        } else {
          return tx.type === TransactionType.WITHDRAWAL && matchCategory;
        }
      });

      const realAmount = itemTx.reduce((sum, tx) => sum + tx.amount, 0);
      const executionPercentage = item.estimatedAmount > 0
        ? Math.round((realAmount / item.estimatedAmount) * 100)
        : 0;

      if (item.type === BudgetItemType.INCOME) {
        totalEstimatedIncome += item.estimatedAmount;
      } else {
        totalEstimatedExpense += item.estimatedAmount;
      }

      return {
        ...item,
        realAmount,
        executionPercentage,
      };
    }) || [];

    const executionIncomePercentage = totalEstimatedIncome > 0
      ? Math.round((totalRealIncome / totalEstimatedIncome) * 100)
      : 0;

    const executionExpensePercentage = totalEstimatedExpense > 0
      ? Math.round((totalRealExpense / totalEstimatedExpense) * 100)
      : 0;

    const netRealProfit = totalRealIncome - totalRealExpense;

    // Compute Total Global Savings across all savings caisses
    const savingsCaisses = await this.prisma.caisse.findMany({
      where: {
        associationId: assocId,
        type: { in: [CaisseType.INDIVIDUAL_SAVINGS, CaisseType.COLLECTIVE_SAVINGS, CaisseType.THEMATIC_SAVINGS, CaisseType.SCHOOL_BANK] },
      },
      select: { balance: true },
    });
    const totalGlobalSavings = savingsCaisses.reduce((sum, c) => sum + c.balance, 0);

    // Compute Profits linked to Loan Interest Only
    const loanRepayments = await this.prisma.loanRepayment.findMany({
      where: {
        loan: { associationId: assocId },
        paidAt: { gte: startOfYear, lte: endOfYear },
      },
      include: {
        loan: { select: { amount: true, totalToRepay: true } },
      },
    });

    let totalLoanInterestProfit = 0;
    loanRepayments.forEach((rep) => {
      if (rep.loan && rep.loan.totalToRepay > 0 && rep.loan.totalToRepay > rep.loan.amount) {
        const interestRatio = (rep.loan.totalToRepay - rep.loan.amount) / rep.loan.totalToRepay;
        totalLoanInterestProfit += rep.amount * interestRatio;
      }
    });

    return {
      year,
      totalEstimatedIncome,
      totalEstimatedExpense,
      totalRealIncome,
      totalRealExpense,
      executionIncomePercentage,
      executionExpensePercentage,
      netRealProfit,
      totalGlobalSavings,
      totalLoanInterestProfit: Math.round(totalLoanInterestProfit),
      items: itemsStats,
    };
  }

  async calculateProfitDistribution(input: CreateProfitDistributionInput): Promise<any> {
    const assocId = await this.resolveAssociationId(input.associationId);
    if (!assocId) throw new BadRequestException('Association introuvable.');

    const year = input.year;
    const baseUnitAmount = input.baseUnitAmount || 5000;
    const partyExpenses = input.partyExpenses || 0;
    const retainedReserve = input.retainedReserve || 0;

    // 1. Calculate Net Profit exclusively from Loan Interest Surplus collected during the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const loanRepayments = await this.prisma.loanRepayment.findMany({
      where: {
        loan: { associationId: assocId },
        paidAt: { gte: startOfYear, lte: endOfYear },
      },
      include: {
        loan: { select: { amount: true, totalToRepay: true } },
      },
    });

    let netProfit = 0;
    loanRepayments.forEach((rep) => {
      if (rep.loan && rep.loan.totalToRepay > 0 && rep.loan.totalToRepay > rep.loan.amount) {
        const interestRatio = (rep.loan.totalToRepay - rep.loan.amount) / rep.loan.totalToRepay;
        netProfit += rep.amount * interestRatio;
      }
    });
    netProfit = Math.round(netProfit);
    const distributableProfit = Math.max(0, netProfit - partyExpenses - retainedReserve);

    // Fetch active members
    const members = await this.prisma.associationMember.findMany({
      where: { associationId: assocId, status: 'ACTIVE' },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        user: { select: { email: true } },
      },
    });

    // Fetch savings deposits for the year
    const deposits = await this.prisma.transaction.findMany({
      where: {
        associationId: assocId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.CONFIRMED,
        memberId: { not: null },
        createdAt: { gte: startOfYear, lte: endOfYear },
      },
    });

    // Map Mois-Épargne by member
    const memberSavingsMap: { [memberId: string]: { totalSavings: number; monthSavings: number } } = {};

    members.forEach((m) => {
      memberSavingsMap[m.id] = { totalSavings: 0, monthSavings: 0 };
    });

    deposits.forEach((tx) => {
      if (tx.memberId && memberSavingsMap[tx.memberId]) {
        const txDate = new Date(tx.createdAt);
        // Months elapsed in the year (e.g., deposited in Jan -> 12 months, Dec -> 1 month)
        const months = Math.max(1, 12 - txDate.getMonth());
        const units = Math.floor(tx.amount / baseUnitAmount);
        const me = units * months;

        memberSavingsMap[tx.memberId].totalSavings += tx.amount;
        memberSavingsMap[tx.memberId].monthSavings += me;
      }
    });

    const totalMonthSavings = Object.values(memberSavingsMap).reduce((sum, item) => sum + item.monthSavings, 0);
    const monthlyGainCoeff = totalMonthSavings > 0 ? distributableProfit / totalMonthSavings : 0;

    // Build dividend items (Total Payout = Personal Savings + Share of Loan Interest Profit)
    const dividendItemsData = members.map((m) => {
      const data = memberSavingsMap[m.id] || { totalSavings: 0, monthSavings: 0 };
      const dividendAmount = Math.round(data.monthSavings * monthlyGainCoeff);
      const totalPayout = data.totalSavings + dividendAmount;

      return {
        memberId: m.id,
        totalSavings: data.totalSavings,
        monthSavings: data.monthSavings,
        dividendAmount,
        totalPayout,
        status: DividendStatus.PENDING,
      };
    });

    // Return simulation result without saving to database
    // Attach member details for the UI
    const simulatedItems = dividendItemsData.map((item) => {
      const m = members.find((x) => x.id === item.memberId);
      return {
        ...item,
        member: m ? { profile: m.profile, user: m.user } : null,
      };
    });

    return {
      id: 'simulation-id-temp', // Fake ID for UI purposes
      associationId: assocId,
      year,
      baseUnitAmount,
      partyExpenses,
      retainedReserve,
      netProfit,
      distributableProfit,
      totalMonthSavings,
      monthlyGainCoeff,
      status: DistributionStatus.SIMULATED,
      items: simulatedItems,
    };
  }

  async executeProfitDistribution(input: CreateProfitDistributionInput, adminUserId: string): Promise<any> {
    const assocId = await this.resolveAssociationId(input.associationId);
    if (!assocId) throw new BadRequestException('Association introuvable.');

    const year = input.year;

    // Check if it was already executed
    const existing = await this.prisma.profitDistribution.findFirst({
      where: { associationId: assocId, year, status: DistributionStatus.EXECUTED },
    });
    if (existing) {
      throw new BadRequestException('Cette redistribution a déjà été validée et exécutée.');
    }

    // Call the stateless simulation to get exact values based on real data
    const dist = await this.calculateProfitDistribution(input);
    
    // Find active caisse for financial disbursement entry
    const caisse = await this.prisma.caisse.findFirst({
      where: { associationId: assocId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!caisse) throw new BadRequestException('Aucune caisse active disponible.');

    // Remove any previously orphaned SIMULATED record (from before the refactor) just in case
    const oldSimulated = await this.prisma.profitDistribution.findFirst({
      where: { associationId: assocId, year, status: DistributionStatus.SIMULATED },
    });
    if (oldSimulated) {
      await this.prisma.dividendItem.deleteMany({ where: { distributionId: oldSimulated.id } });
      await this.prisma.profitDistribution.delete({ where: { id: oldSimulated.id } });
    }

    // Prepare items for DB creation (removing the fake ID and UI member relations)
    const itemsData = dist.items.map((item: any) => ({
      memberId: item.memberId,
      totalSavings: item.totalSavings,
      monthSavings: item.monthSavings,
      dividendAmount: item.dividendAmount,
      totalPayout: item.totalPayout,
      status: DividendStatus.PAID,
      paidAt: new Date(),
    }));

    // ACID Transaction Execution
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // Create ProfitDistribution and DividendItems
      const executedDist = await tx.profitDistribution.create({
        data: {
          associationId: assocId,
          year,
          baseUnitAmount: dist.baseUnitAmount,
          partyExpenses: dist.partyExpenses,
          retainedReserve: dist.retainedReserve,
          netProfit: dist.netProfit,
          distributableProfit: dist.distributableProfit,
          totalMonthSavings: dist.totalMonthSavings,
          monthlyGainCoeff: dist.monthlyGainCoeff,
          status: DistributionStatus.EXECUTED,
          executedAt: now,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      for (const item of executedDist.items) {
        if (item.totalPayout > 0) {
          const ref = `DIV-${year}-${Math.floor(1000 + Math.random() * 9000)}-${item.id.slice(-4)}`.toUpperCase();

          // Outflow transaction (WITHDRAWAL) representing payout of cumulative savings + dividend
          await tx.transaction.create({
            data: {
              associationId: assocId,
              caisseId: caisse.id,
              memberId: item.memberId,
              type: TransactionType.WITHDRAWAL,
              amount: item.totalPayout,
              reference: ref,
              description: `Reversement Cassation (Exercice ${year}) : Épargne (${item.totalSavings.toLocaleString('fr-FR')} FCFA) + Bénéfices Prêts (${item.dividendAmount.toLocaleString('fr-FR')} FCFA)`,
              status: TransactionStatus.CONFIRMED,
              createdByUserId: adminUserId,
              approvedByUserId: adminUserId,
            },
          });

          // Money leaves caisse -> Decrement caisse balance
          await tx.caisse.update({
            where: { id: caisse.id },
            data: { balance: { decrement: item.totalPayout } },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          associationId: assocId,
          actorId: adminUserId,
          category: AuditCategory.TREASURY,
          action: 'EXECUTE_PROFIT_DISTRIBUTION',
          targetType: 'ProfitDistribution',
          targetId: executedDist.id,
          metadata: JSON.stringify({
            year,
            loanInterestNetProfit: executedDist.netProfit,
            distributableProfit: executedDist.distributableProfit,
            itemCount: executedDist.items.length,
          }),
        },
      });

      return executedDist;
    });
  }

  async getProfitDistribution(associationId: string, year: number): Promise<any | null> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) return null;

    return this.prisma.profitDistribution.findFirst({
      where: { associationId: assocId, year },
      include: {
        items: {
          include: {
            member: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });
  }

  async listProfitDistributions(associationId: string): Promise<any[]> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) return [];

    return this.prisma.profitDistribution.findMany({
      where: { associationId: assocId },
      include: {
        items: {
          include: {
            member: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { year: 'desc' },
    });
  }
}
